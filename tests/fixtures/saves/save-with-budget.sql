INSERT INTO save (filename, name)
VALUES ('budget-test.sav', 'Budget Test Empire');

INSERT INTO gamestate (save_id, date, data)
VALUES
  (
    (SELECT save_id FROM save WHERE filename = 'budget-test.sav'),
    '2200-01-01',
    '{}'::jsonb
  ),
  (
    (SELECT save_id FROM save WHERE filename = 'budget-test.sav'),
    '2225-06-15',
    '{}'::jsonb
  );

-- Insert budget entries for first gamestate
INSERT INTO budget_entry (
  energy, minerals, food, alloys, consumer_goods,
  trade, unity, influence,
  physics_research, engineering_research, society_research,
  exotic_gases, rare_crystals, volatile_motes,
  astral_threads, minor_artifacts, nanites,
  sr_zro, sr_dark_matter, sr_living_metal
)
VALUES
  -- Balance for armies
  (100.5, 50.0, 75.0, 25.0, 30.0, 10.0, 5.0, 2.0, 15.0, 20.0, 18.0, 3.0, 4.0, 2.5, 1.0, 0.5, 0.2, 0.1, 0.3, 0.4);

INSERT INTO budget_category (gamestate_id, category_type, category_name, budget_entry_id)
VALUES
  (
    (SELECT gamestate_id FROM gamestate WHERE save_id = (SELECT save_id FROM save WHERE filename = 'budget-test.sav') AND date = '2200-01-01'),
    'balance',
    'armies',
    (SELECT budget_entry_id FROM budget_entry ORDER BY budget_entry_id DESC LIMIT 1)
  );

-- Insert budget entries for second gamestate
INSERT INTO budget_entry (
  energy, minerals, food, alloys, consumer_goods,
  trade, unity, influence,
  physics_research, engineering_research, society_research,
  exotic_gases, rare_crystals, volatile_motes,
  astral_threads, minor_artifacts, nanites,
  sr_zro, sr_dark_matter, sr_living_metal
)
VALUES
  -- Balance for armies
  (200.75, 100.0, 150.0, 50.0, 60.0, 20.0, 10.0, 4.0, 30.0, 40.0, 36.0, 6.0, 8.0, 5.0, 2.0, 1.0, 0.4, 0.2, 0.6, 0.8);

INSERT INTO budget_category (gamestate_id, category_type, category_name, budget_entry_id)
VALUES
  (
    (SELECT gamestate_id FROM gamestate WHERE save_id = (SELECT save_id FROM save WHERE filename = 'budget-test.sav') AND date = '2225-06-15'),
    'balance',
    'armies',
    (SELECT budget_entry_id FROM budget_entry ORDER BY budget_entry_id DESC LIMIT 1)
  );
