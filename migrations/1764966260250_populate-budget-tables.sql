-- Up Migration
DO $$
DECLARE
  gamestate_row RECORD;
  category_types TEXT[] := ARRAY['income', 'expenses', 'balance'];
  category_names TEXT[] := ARRAY[
    'armies', 'countryBase', 'countryPowerProjection',
    'leaderCommanders', 'leaderOfficials', 'leaderScientists',
    'orbitalMiningDeposits', 'orbitalResearchDeposits',
    'planetArtisans', 'planetBiologists', 'planetBuildings',
    'planetBuildingsStrongholds', 'planetBureaucrats',
    'planetDistrictsCities', 'planetDistrictsFarming',
    'planetDistrictsGenerator', 'planetDistrictsMining',
    'planetDoctors', 'planetEngineers', 'planetFarmers',
    'planetJobs', 'planetMetallurgists', 'planetMiners',
    'planetPhysicists', 'planetPoliticians', 'planetPops',
    'planetResourceDeficit', 'planetTechnician', 'planetTraders',
    'popCategoryRulers', 'popCategorySpecialists', 'popCategoryWorkers',
    'popFactions', 'shipComponents', 'ships',
    'starbaseBuildings', 'starbaseModules', 'starbases',
    'stationGatherers', 'stationResearchers', 'tradePolicy'
  ];
  category_type TEXT;
  category_name TEXT;
  budget_data JSONB;
  entry_data JSONB;
  new_budget_entry_id INTEGER;
BEGIN
  FOR gamestate_row IN
    SELECT
      gamestate_id,
      data -> 'country' -> (data -> 'player' -> 0 ->> 'country')
        -> 'budget' -> 'current_month' AS budget_current_month
    FROM gamestate
    WHERE data -> 'country' -> (data -> 'player' -> 0 ->> 'country')
      -> 'budget' -> 'current_month' IS NOT NULL
  LOOP
    budget_data := gamestate_row.budget_current_month;

    FOREACH category_type IN ARRAY category_types
    LOOP
      FOREACH category_name IN ARRAY category_names
      LOOP
        entry_data := budget_data -> category_type -> category_name;

        CONTINUE WHEN entry_data IS NULL;

        INSERT INTO budget_entry (
          alloys, consumer_goods, energy, engineering_research,
          food, influence, minerals, physics_research,
          society_research, trade, unity
        ) VALUES (
          (entry_data ->> 'alloys')::DOUBLE PRECISION,
          (entry_data ->> 'consumerGoods')::DOUBLE PRECISION,
          (entry_data ->> 'energy')::DOUBLE PRECISION,
          (entry_data ->> 'engineeringResearch')::DOUBLE PRECISION,
          (entry_data ->> 'food')::DOUBLE PRECISION,
          (entry_data ->> 'influence')::DOUBLE PRECISION,
          (entry_data ->> 'minerals')::DOUBLE PRECISION,
          (entry_data ->> 'physicsResearch')::DOUBLE PRECISION,
          (entry_data ->> 'societyResearch')::DOUBLE PRECISION,
          (entry_data ->> 'trade')::DOUBLE PRECISION,
          (entry_data ->> 'unity')::DOUBLE PRECISION
        )
        RETURNING budget_entry_id INTO new_budget_entry_id;

        INSERT INTO budget_category (
          gamestate_id, category_type, category_name, budget_entry_id
        ) VALUES (
          gamestate_row.gamestate_id,
          category_type,
          category_name,
          new_budget_entry_id
        );
      END LOOP;
    END LOOP;
  END LOOP;
END $$;
