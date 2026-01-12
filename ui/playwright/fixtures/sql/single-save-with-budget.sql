INSERT INTO save (filename, name)
VALUES ('test-empire.sav', 'Test Empire');

INSERT INTO gamestate (save_id, date, data)
VALUES
  (
    (SELECT save_id FROM save WHERE filename = 'test-empire.sav'),
    '2300-01-01',
    '{}'::jsonb
  ),
  (
    (SELECT save_id FROM save WHERE filename = 'test-empire.sav'),
    '2300-06-01',
    '{}'::jsonb
  ),
  (
    (SELECT save_id FROM save WHERE filename = 'test-empire.sav'),
    '2301-01-01',
    '{}'::jsonb
  );

-- Budget for first gamestate (early game - no strategic resources yet)
INSERT INTO budget_entry (
  energy, minerals, food, trade,
  alloys, consumer_goods,
  unity, influence,
  physics_research, society_research, engineering_research
)
VALUES (100.0, 150.0, 50.0, 10.0, 20.0, 25.0, 5.0, 2.0, 30.0, 25.0, 28.0);

INSERT INTO budget_category (gamestate_id, category_type, category_name, budget_entry_id)
VALUES
  (
    (SELECT gamestate_id FROM gamestate
     WHERE save_id = (SELECT save_id FROM save WHERE filename = 'test-empire.sav')
     AND date = '2300-01-01'),
    'balance',
    'none',
    (SELECT budget_entry_id FROM budget_entry ORDER BY budget_entry_id DESC LIMIT 1)
  );

-- Budget for second gamestate (mid game - some strategic resources)
INSERT INTO budget_entry (
  energy, minerals, food, trade,
  alloys, consumer_goods,
  rare_crystals, exotic_gases, volatile_motes,
  unity, influence,
  physics_research, society_research, engineering_research
)
VALUES (200.0, 300.0, 100.0, 20.0, 40.0, 50.0, 5.0, 3.0, 4.0, 10.0, 4.0, 60.0, 50.0, 55.0);

INSERT INTO budget_category (gamestate_id, category_type, category_name, budget_entry_id)
VALUES
  (
    (SELECT gamestate_id FROM gamestate
     WHERE save_id = (SELECT save_id FROM save WHERE filename = 'test-empire.sav')
     AND date = '2300-06-01'),
    'balance',
    'none',
    (SELECT budget_entry_id FROM budget_entry ORDER BY budget_entry_id DESC LIMIT 1)
  );

-- Budget for third gamestate (late game - all resources including advanced strategic)
INSERT INTO budget_entry (
  energy, minerals, food, trade,
  alloys, consumer_goods,
  rare_crystals, exotic_gases, volatile_motes,
  sr_dark_matter, sr_living_metal, sr_zro,
  unity, influence,
  physics_research, society_research, engineering_research
)
VALUES (350.0, 500.0, 175.0, 35.0, 70.0, 85.0, 10.0, 8.0, 9.0, 2.0, 1.0, 3.0, 18.0, 7.0, 120.0, 100.0, 110.0);

INSERT INTO budget_category (gamestate_id, category_type, category_name, budget_entry_id)
VALUES
  (
    (SELECT gamestate_id FROM gamestate
     WHERE save_id = (SELECT save_id FROM save WHERE filename = 'test-empire.sav')
     AND date = '2301-01-01'),
    'balance',
    'none',
    (SELECT budget_entry_id FROM budget_entry ORDER BY budget_entry_id DESC LIMIT 1)
  );
