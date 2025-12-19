from dataclasses import dataclass
from typing import Any

import httpx

from agent.models import (
    BudgetComparisonData,
    BudgetComparisonError,
    BudgetSnapshot,
    BudgetTimeSeriesData,
)

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
) -> BudgetComparisonData | BudgetComparisonError:
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
        return BudgetComparisonError(error=f"Save '{filename}' not found")

    gamestates: list[dict[str, Any]] = save_data["gamestates"]
    previous_gs = next((gs for gs in gamestates if gs["date"] == previous_date), None)
    current_gs = next((gs for gs in gamestates if gs["date"] == current_date), None)

    if previous_gs is None or current_gs is None:
        return BudgetComparisonError(
            error="Could not find gamestates for specified dates",
        )

    return BudgetComparisonData(
        previous_date=previous_date,
        current_date=current_date,
        previous_budget=previous_gs["budget"]["balance"],
        current_budget=current_gs["budget"]["balance"],
    )


def select_latest_dates(dates: list[str], count: int = 6) -> list[str]:
    """Select the latest N dates from a sorted list of dates."""
    return dates[-count:] if len(dates) >= count else dates


async def fetch_budget_time_series(
    client: httpx.AsyncClient,
    filename: str,
    dates: list[str],
) -> BudgetTimeSeriesData | BudgetComparisonError:
    """Fetch budget data for multiple dates and return time series structure."""
    query = build_budget_query()
    response = await client.post(
        GRAPHQL_URL,
        json={"query": query, "variables": {"filename": filename}},
    )
    response.raise_for_status()
    data = response.json()

    save_data: dict[str, Any] | None = data["data"]["save"]
    if save_data is None:
        return BudgetComparisonError(error=f"Save '{filename}' not found")

    gamestates: list[dict[str, Any]] = save_data["gamestates"]

    snapshots: list[BudgetSnapshot] = []
    for date in dates:
        gs = next((g for g in gamestates if g["date"] == date), None)
        if gs is None:
            return BudgetComparisonError(
                error=f"Could not find gamestate for date {date}",
            )
        snapshots.append(
            BudgetSnapshot(
                date=date,
                budget=gs["budget"]["balance"],
            ),
        )

    return BudgetTimeSeriesData(
        dates=dates,
        snapshots=snapshots,
    )
