INSERT INTO save (filename, name)
VALUES
  ('alpha.sav', 'Empire Alpha'),
  ('beta.sav', 'Empire Beta'),
  ('gamma.sav', 'Empire Gamma');

-- Add gamestates and budget data for Empire Alpha
INSERT INTO gamestate (save_id, date, data)
VALUES
  (
    (SELECT save_id FROM save WHERE filename = 'alpha.sav'),
    '2300-01-01',
    '{}'::jsonb
  ),
  (
    (SELECT save_id FROM save WHERE filename = 'alpha.sav'),
    '2300-02-01',
    '{}'::jsonb
  );

-- Budget entries for first gamestate
INSERT INTO budget_entry (
  energy, minerals, food, alloys, consumer_goods,
  trade, unity, influence
)
VALUES (100.0, 200.0, 50.0, 25.0, 30.0, 10.0, 5.0, 2.0);

INSERT INTO budget_category (gamestate_id, category_type, category_name, budget_entry_id)
VALUES
  (
    (SELECT gamestate_id FROM gamestate
     WHERE save_id = (SELECT save_id FROM save WHERE filename = 'alpha.sav')
     AND date = '2300-01-01'),
    'balance',
    'total',
    (SELECT budget_entry_id FROM budget_entry ORDER BY budget_entry_id DESC LIMIT 1)
  );

-- Budget entries for second gamestate
INSERT INTO budget_entry (
  energy, minerals, food, alloys, consumer_goods,
  trade, unity, influence
)
VALUES (150.0, 250.0, 75.0, 40.0, 45.0, 15.0, 8.0, 3.0);

INSERT INTO budget_category (gamestate_id, category_type, category_name, budget_entry_id)
VALUES
  (
    (SELECT gamestate_id FROM gamestate
     WHERE save_id = (SELECT save_id FROM save WHERE filename = 'alpha.sav')
     AND date = '2300-02-01'),
    'balance',
    'total',
    (SELECT budget_entry_id FROM budget_entry ORDER BY budget_entry_id DESC LIMIT 1)
  );
