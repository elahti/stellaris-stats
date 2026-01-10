INSERT INTO save (filename, name)
VALUES ('budget-totals-test.sav', 'Budget Totals Test Empire');

INSERT INTO gamestate (save_id, date, data)
VALUES (
  (SELECT save_id FROM save WHERE filename = 'budget-totals-test.sav'),
  '2200-01-01',
  '{}'::jsonb
);

-- Insert budget entry for countryBase balance
INSERT INTO budget_entry (
  energy, minerals, food, alloys, consumer_goods,
  trade, unity, influence,
  physics_research, engineering_research, society_research,
  exotic_gases, rare_crystals, volatile_motes,
  astral_threads, minor_artifacts, nanites,
  sr_zro, sr_dark_matter, sr_living_metal
)
VALUES (100.0, 200.0, 50.0, 25.0, 30.0, 10.0, 5.0, 2.0, 15.0, 20.0, 18.0, 3.0, 4.0, 2.5, 1.0, 0.5, 0.2, 0.1, 0.3, 0.4);

INSERT INTO budget_category (gamestate_id, category_type, category_name, budget_entry_id)
VALUES (
  (SELECT gamestate_id FROM gamestate WHERE save_id = (SELECT save_id FROM save WHERE filename = 'budget-totals-test.sav')),
  'balance',
  'country_base',
  (SELECT budget_entry_id FROM budget_entry ORDER BY budget_entry_id DESC LIMIT 1)
);

-- Insert budget entry for armies balance
INSERT INTO budget_entry (
  energy, minerals, food, alloys, consumer_goods,
  trade, unity, influence,
  physics_research, engineering_research, society_research,
  exotic_gases, rare_crystals, volatile_motes,
  astral_threads, minor_artifacts, nanites,
  sr_zro, sr_dark_matter, sr_living_metal
)
VALUES (50.0, 100.0, 25.0, 10.0, 15.0, 5.0, 2.0, 1.0, 7.0, 10.0, 9.0, 1.0, 2.0, 1.0, 0.5, 0.2, 0.1, 0.05, 0.1, 0.2);

INSERT INTO budget_category (gamestate_id, category_type, category_name, budget_entry_id)
VALUES (
  (SELECT gamestate_id FROM gamestate WHERE save_id = (SELECT save_id FROM save WHERE filename = 'budget-totals-test.sav')),
  'balance',
  'armies',
  (SELECT budget_entry_id FROM budget_entry ORDER BY budget_entry_id DESC LIMIT 1)
);
