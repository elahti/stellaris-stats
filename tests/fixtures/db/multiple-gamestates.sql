-- Fixture: Multiple saves with gamestates for batch query tests

-- Save 1: Two gamestates
INSERT INTO save (filename, name) VALUES ('empire1.sav', 'First Empire');
INSERT INTO gamestate (save_id, date, data)
VALUES (
  (SELECT save_id FROM save WHERE filename = 'empire1.sav'),
  '2200-01-01T00:00:00Z',
  '{"name": "First Empire", "date": "2200.01.01"}'::jsonb
);
INSERT INTO gamestate (save_id, date, data)
VALUES (
  (SELECT save_id FROM save WHERE filename = 'empire1.sav'),
  '2200-02-01T00:00:00Z',
  '{"name": "First Empire", "date": "2200.02.01"}'::jsonb
);

-- Save 2: Three gamestates
INSERT INTO save (filename, name) VALUES ('empire2.sav', 'Second Empire');
INSERT INTO gamestate (save_id, date, data)
VALUES (
  (SELECT save_id FROM save WHERE filename = 'empire2.sav'),
  '2200-03-01T00:00:00Z',
  '{"name": "Second Empire", "date": "2200.03.01"}'::jsonb
);
INSERT INTO gamestate (save_id, date, data)
VALUES (
  (SELECT save_id FROM save WHERE filename = 'empire2.sav'),
  '2200-04-01T00:00:00Z',
  '{"name": "Second Empire", "date": "2200.04.01"}'::jsonb
);
INSERT INTO gamestate (save_id, date, data)
VALUES (
  (SELECT save_id FROM save WHERE filename = 'empire2.sav'),
  '2200-05-01T00:00:00Z',
  '{"name": "Second Empire", "date": "2200.05.01"}'::jsonb
);

-- Save 3: No gamestates (for testing empty results)
INSERT INTO save (filename, name) VALUES ('empty-empire.sav', 'Empty Empire');
