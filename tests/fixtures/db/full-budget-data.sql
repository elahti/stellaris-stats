-- Fixture: Complete budget data hierarchy for budget batch tests

-- Save with budget data
INSERT INTO save (filename, name) VALUES ('budget-empire.sav', 'Budget Empire');

-- Gamestate 1
INSERT INTO gamestate (save_id, date, data)
VALUES (
  (SELECT save_id FROM save WHERE filename = 'budget-empire.sav'),
  '2200-01-01T00:00:00Z',
  '{"name": "Budget Empire", "date": "2200.01.01"}'::jsonb
);

-- Budget entries for gamestate 1 - Income
INSERT INTO budget_entry (energy, minerals, food, alloys, consumer_goods, unity, influence, physics_research, society_research, engineering_research, trade, rare_crystals, volatile_motes, exotic_gases, sr_dark_matter, sr_zro, sr_living_metal, minor_artifacts, nanites, astral_threads)
VALUES (100.0, 50.0, 25.0, 10.0, 15.0, 5.0, 3.0, 20.0, 20.0, 20.0, 0.0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO budget_category (gamestate_id, category_type, category_name, budget_entry_id)
VALUES (
  (SELECT gamestate_id FROM gamestate g JOIN save s ON g.save_id = s.save_id WHERE s.filename = 'budget-empire.sav' AND g.date = '2200-01-01T00:00:00Z'),
  'income',
  'country_base',
  (SELECT MAX(budget_entry_id) FROM budget_entry)
);

-- Budget entries for gamestate 1 - Expenses
INSERT INTO budget_entry (energy, minerals, food, alloys, consumer_goods, unity, influence, physics_research, society_research, engineering_research, trade, rare_crystals, volatile_motes, exotic_gases, sr_dark_matter, sr_zro, sr_living_metal, minor_artifacts, nanites, astral_threads)
VALUES (-20.0, -10.0, -5.0, -2.0, -3.0, 0.0, -1.0, 0.0, 0.0, 0.0, 0.0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO budget_category (gamestate_id, category_type, category_name, budget_entry_id)
VALUES (
  (SELECT gamestate_id FROM gamestate g JOIN save s ON g.save_id = s.save_id WHERE s.filename = 'budget-empire.sav' AND g.date = '2200-01-01T00:00:00Z'),
  'expenses',
  'ships',
  (SELECT MAX(budget_entry_id) FROM budget_entry)
);

-- Budget entries for gamestate 1 - Balance
INSERT INTO budget_entry (energy, minerals, food, alloys, consumer_goods, unity, influence, physics_research, society_research, engineering_research, trade, rare_crystals, volatile_motes, exotic_gases, sr_dark_matter, sr_zro, sr_living_metal, minor_artifacts, nanites, astral_threads)
VALUES (80.0, 40.0, 20.0, 8.0, 12.0, 5.0, 2.0, 20.0, 20.0, 20.0, 0.0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO budget_category (gamestate_id, category_type, category_name, budget_entry_id)
VALUES (
  (SELECT gamestate_id FROM gamestate g JOIN save s ON g.save_id = s.save_id WHERE s.filename = 'budget-empire.sav' AND g.date = '2200-01-01T00:00:00Z'),
  'balance',
  'country_base',
  (SELECT MAX(budget_entry_id) FROM budget_entry)
);

-- Gamestate 2 (for batch query testing)
INSERT INTO gamestate (save_id, date, data)
VALUES (
  (SELECT save_id FROM save WHERE filename = 'budget-empire.sav'),
  '2200-02-01T00:00:00Z',
  '{"name": "Budget Empire", "date": "2200.02.01"}'::jsonb
);

-- Budget entries for gamestate 2 - Income
INSERT INTO budget_entry (energy, minerals, food, alloys, consumer_goods, unity, influence, physics_research, society_research, engineering_research, trade, rare_crystals, volatile_motes, exotic_gases, sr_dark_matter, sr_zro, sr_living_metal, minor_artifacts, nanites, astral_threads)
VALUES (150.0, 75.0, 35.0, 15.0, 20.0, 8.0, 4.0, 25.0, 25.0, 25.0, 5.0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO budget_category (gamestate_id, category_type, category_name, budget_entry_id)
VALUES (
  (SELECT gamestate_id FROM gamestate g JOIN save s ON g.save_id = s.save_id WHERE s.filename = 'budget-empire.sav' AND g.date = '2200-02-01T00:00:00Z'),
  'income',
  'country_base',
  (SELECT MAX(budget_entry_id) FROM budget_entry)
);

-- Save without budget data (for testing empty budget)
INSERT INTO save (filename, name) VALUES ('no-budget.sav', 'No Budget Empire');
INSERT INTO gamestate (save_id, date, data)
VALUES (
  (SELECT save_id FROM save WHERE filename = 'no-budget.sav'),
  '2200-01-01T00:00:00Z',
  '{"name": "No Budget Empire", "date": "2200.01.01"}'::jsonb
);
