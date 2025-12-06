-- Up Migration
DO $$
DECLARE
  gamestate_row RECORD;
  category_types TEXT[] := ARRAY['income', 'expenses', 'balance'];
  category_names TEXT[] := ARRAY[
    'armies', 'country_base', 'country_power_projection',
    'leader_commanders', 'leader_officials', 'leader_scientists',
    'orbital_mining_deposits', 'orbital_research_deposits',
    'planet_artisans', 'planet_biologists', 'planet_buildings',
    'planet_buildings_strongholds', 'planet_bureaucrats',
    'planet_districts_cities', 'planet_districts_farming',
    'planet_districts_generator', 'planet_districts_mining',
    'planet_doctors', 'planet_engineers', 'planet_farmers',
    'planet_jobs', 'planet_metallurgists', 'planet_miners',
    'planet_physicists', 'planet_politicians', 'planet_pops',
    'planet_resource_deficit', 'planet_technician', 'planet_traders',
    'pop_category_rulers', 'pop_category_specialists', 'pop_category_workers',
    'pop_factions', 'ship_components', 'ships',
    'starbase_buildings', 'starbase_modules', 'starbases',
    'station_gatherers', 'station_researchers', 'trade_policy'
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
        entry_data := budget_data #> ARRAY[category_type, category_name];

        CONTINUE WHEN entry_data IS NULL;

        INSERT INTO budget_entry (
          alloys, consumer_goods, energy, engineering_research,
          food, influence, minerals, physics_research,
          society_research, trade, unity
        ) VALUES (
          (entry_data ->> 'alloys')::DOUBLE PRECISION,
          (entry_data ->> 'consumer_goods')::DOUBLE PRECISION,
          (entry_data ->> 'energy')::DOUBLE PRECISION,
          (entry_data ->> 'engineering_research')::DOUBLE PRECISION,
          (entry_data ->> 'food')::DOUBLE PRECISION,
          (entry_data ->> 'influence')::DOUBLE PRECISION,
          (entry_data ->> 'minerals')::DOUBLE PRECISION,
          (entry_data ->> 'physics_research')::DOUBLE PRECISION,
          (entry_data ->> 'society_research')::DOUBLE PRECISION,
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