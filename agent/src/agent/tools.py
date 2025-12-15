from dataclasses import dataclass
from typing import Any

import httpx

from agent.models import BudgetAnalysisResult, BudgetChange, ResourceChange

GRAPHQL_URL = "http://devcontainer:4000"

RESOURCES = [
    "energy",
    "minerals",
    "food",
    "alloys",
    "consumerGoods",
    "influence",
    "unity",
    "physicsResearch",
    "engineeringResearch",
    "societyResearch",
    "exoticGases",
    "rareCrystals",
    "volatileMotes",
    "srDarkMatter",
    "srLivingMetal",
    "srZro",
    "nanites",
    "minorArtifacts",
    "astralThreads",
    "trade",
]

BUDGET_CATEGORIES = [
    "armies",
    "colonies",
    "commercialPacts",
    "countryAgendas",
    "countryBase",
    "countryCivics",
    "countryDessanu",
    "countryEthic",
    "countryPowerProjection",
    "countryRuler",
    "edicts",
    "leaderCommanders",
    "leaderOfficials",
    "leaderScientists",
    "megastructures",
    "megastructuresGrandArchive",
    "megastructuresHabitat",
    "megastructuresHyperRelay",
    "migrationPacts",
    "none",
    "orbitalMiningDeposits",
    "orbitalResearchDeposits",
    "overlordSubsidy",
    "planetArtisans",
    "planetBiologists",
    "planetBuildings",
    "planetBuildingsCloneVats",
    "planetBuildingsHabCapital",
    "planetBuildingsStormTech",
    "planetBuildingsStrongholds",
    "planetBureaucrats",
    "planetCivilians",
    "planetClerks",
    "planetDeposits",
    "planetDistricts",
    "planetDistrictsCities",
    "planetDistrictsFarming",
    "planetDistrictsGenerator",
    "planetDistrictsHab",
    "planetDistrictsMining",
    "planetDoctors",
    "planetEnergyThralls",
    "planetEngineers",
    "planetEntertainers",
    "planetFarmers",
    "planetJobs",
    "planetJobsProductive",
    "planetMaintenanceDrones",
    "planetMetallurgists",
    "planetMiners",
    "planetPhysicists",
    "planetPoliticians",
    "planetPopAssemblers",
    "planetPops",
    "planetResourceDeficit",
    "planetSrMiners",
    "planetTechnician",
    "planetTraders",
    "popCategoryCivilians",
    "popCategoryDrones",
    "popCategoryRulers",
    "popCategorySpecialists",
    "popCategoryWorkers",
    "popFactions",
    "shipComponents",
    "ships",
    "situations",
    "starbaseBuildings",
    "starbaseModules",
    "starbases",
    "stationGatherers",
    "stationObserverMissions",
    "stationObservers",
    "stationResearchers",
    "tradePolicy",
]


@dataclass
class AgentDeps:
    http_client: httpx.AsyncClient
    threshold_percent: float = 15.0


async def list_saves(client: httpx.AsyncClient) -> list[dict[str, str]]:
    """List all available save files."""
    query = """
    query ListSaves {
        saves {
            filename
            name
        }
    }
    """
    response = await client.post(GRAPHQL_URL, json={"query": query})
    response.raise_for_status()
    data = response.json()
    saves: list[dict[str, Any]] = data["data"]["saves"]
    return [{"filename": s["filename"], "name": s["name"]} for s in saves]


async def get_available_dates(client: httpx.AsyncClient, filename: str) -> list[str]:
    """Get all available dates for a save file, sorted ascending."""
    query = """
    query GetDates($filename: String!) {
        save(filename: $filename) {
            gamestates {
                date
            }
        }
    }
    """
    response = await client.post(
        GRAPHQL_URL,
        json={"query": query, "variables": {"filename": filename}},
    )
    response.raise_for_status()
    data = response.json()
    save_data: dict[str, Any] | None = data["data"]["save"]
    if save_data is None:
        return []
    gamestates: list[dict[str, str]] = save_data["gamestates"]
    dates = sorted([gs["date"] for gs in gamestates])
    return dates


def find_comparison_dates(dates: list[str]) -> tuple[str, str] | None:
    """Find latest date and approximately 1 year prior date for comparison."""
    if len(dates) < 2:
        return None

    latest_date = dates[-1]
    latest_year = int(latest_date[:4])
    target_year = latest_year - 1

    one_year_prior = None
    for date in dates:
        year = int(date[:4])
        if year <= target_year:
            one_year_prior = date
        else:
            break

    if one_year_prior is None:
        one_year_prior = dates[0]

    return (one_year_prior, latest_date)


def build_budget_query() -> str:
    """Build GraphQL query for budget data with all categories and resources."""
    resource_fields = "\n                ".join(RESOURCES)
    category_fields = "\n            ".join([
        f"{cat} {{\n                {resource_fields}\n            }}"
        for cat in BUDGET_CATEGORIES
    ])

    return f"""
    query GetBudget($filename: String!) {{
        save(filename: $filename) {{
            gamestates {{
                date
                budget {{
                    balance {{
                        {category_fields}
                    }}
                }}
            }}
        }}
    }}
    """


async def fetch_budget_comparison(
    client: httpx.AsyncClient,
    filename: str,
    previous_date: str,
    current_date: str,
) -> dict[str, Any]:
    """Fetch budget data for two dates and return comparison-ready structure."""
    query = build_budget_query()
    response = await client.post(
        GRAPHQL_URL,
        json={"query": query, "variables": {"filename": filename}},
    )
    response.raise_for_status()
    data = response.json()

    save_data: dict[str, Any] | None = data["data"]["save"]
    if save_data is None:
        return {"error": f"Save '{filename}' not found"}

    gamestates: list[dict[str, Any]] = save_data["gamestates"]
    previous_gs = next((gs for gs in gamestates if gs["date"] == previous_date), None)
    current_gs = next((gs for gs in gamestates if gs["date"] == current_date), None)

    if previous_gs is None or current_gs is None:
        return {"error": "Could not find gamestates for specified dates"}

    return {
        "previous_date": previous_date,
        "current_date": current_date,
        "previous_budget": previous_gs["budget"]["balance"],
        "current_budget": current_gs["budget"]["balance"],
    }


def analyze_budget_changes(
    filename: str,
    comparison_data: dict[str, Any],
    threshold_percent: float,
) -> BudgetAnalysisResult:
    """Analyze budget changes and identify sudden changes exceeding threshold."""
    if "error" in comparison_data:
        return BudgetAnalysisResult(
            save_filename=filename,
            previous_date="",
            current_date="",
            threshold_percent=threshold_percent,
            sudden_changes=[],
            summary=comparison_data["error"],
        )

    previous_date: str = comparison_data["previous_date"]
    current_date: str = comparison_data["current_date"]
    previous_budget: dict[str, Any] = comparison_data["previous_budget"]
    current_budget: dict[str, Any] = comparison_data["current_budget"]

    sudden_changes: list[BudgetChange] = []

    for category_name in BUDGET_CATEGORIES:
        prev_cat: dict[str, Any] | None = previous_budget.get(category_name)
        curr_cat: dict[str, Any] | None = current_budget.get(category_name)

        if prev_cat is None:
            prev_cat = {}
        if curr_cat is None:
            curr_cat = {}

        resource_changes: list[ResourceChange] = []

        for resource in RESOURCES:
            prev_val_raw: float | None = prev_cat.get(resource)
            curr_val_raw: float | None = curr_cat.get(resource)

            prev_val: float = prev_val_raw if prev_val_raw is not None else 0.0
            curr_val: float = curr_val_raw if curr_val_raw is not None else 0.0

            change_abs = curr_val - prev_val

            if abs(prev_val) > 0.01:
                change_pct = (change_abs / abs(prev_val)) * 100
            elif abs(curr_val) > 0.01:
                change_pct = 100.0 if curr_val > 0 else -100.0
            else:
                change_pct = 0.0

            if abs(change_pct) >= threshold_percent and abs(change_abs) > 0.1:
                resource_changes.append(
                    ResourceChange(
                        resource=resource,
                        previous_value=prev_val,
                        current_value=curr_val,
                        change_absolute=round(change_abs, 2),
                        change_percent=round(change_pct, 2),
                    ),
                )

        if resource_changes:
            sudden_changes.append(
                BudgetChange(
                    category_type="balance",
                    category_name=category_name,
                    changes=resource_changes,
                ),
            )

    total_changes = sum(len(bc.changes) for bc in sudden_changes)
    categories_affected = len(sudden_changes)

    if total_changes == 0:
        summary = (
            f"No sudden changes (>{threshold_percent}%) detected in budget balance "
            f"between {previous_date} and {current_date}."
        )
    else:
        summary = (
            f"Detected {total_changes} resource change(s) exceeding {threshold_percent}% "
            f"threshold across {categories_affected} budget categorie(s) "
            f"between {previous_date} and {current_date}."
        )

    return BudgetAnalysisResult(
        save_filename=filename,
        previous_date=previous_date,
        current_date=current_date,
        threshold_percent=threshold_percent,
        sudden_changes=sudden_changes,
        summary=summary,
    )
