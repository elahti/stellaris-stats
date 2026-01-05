-- Fixture: Planet coordinate data for planet coordinate batch tests

-- Save with planet coordinates
INSERT INTO save (filename, name) VALUES ('coordinates-test.sav', 'Coordinates Test Save');

-- Gamestate 1
INSERT INTO gamestate (save_id, date, data)
VALUES (
  (SELECT save_id FROM save WHERE filename = 'coordinates-test.sav'),
  '2200-01-01T00:00:00Z',
  '{"name": "Coordinates Test", "date": "2200.01.01"}'::jsonb
);

-- Planet coordinates for gamestate 1
INSERT INTO planet_coordinate (gamestate_id, planet_id, x, y, system_id)
VALUES
  ((SELECT gamestate_id FROM gamestate g JOIN save s ON g.save_id = s.save_id WHERE s.filename = 'coordinates-test.sav' AND g.date = '2200-01-01T00:00:00Z'), 7, -56.82, 85.08, 268),
  ((SELECT gamestate_id FROM gamestate g JOIN save s ON g.save_id = s.save_id WHERE s.filename = 'coordinates-test.sav' AND g.date = '2200-01-01T00:00:00Z'), 12, 100.5, -45.3, 512),
  ((SELECT gamestate_id FROM gamestate g JOIN save s ON g.save_id = s.save_id WHERE s.filename = 'coordinates-test.sav' AND g.date = '2200-01-01T00:00:00Z'), 25, 0.0, 0.0, 1);

-- Gamestate 2 (for batch query testing)
INSERT INTO gamestate (save_id, date, data)
VALUES (
  (SELECT save_id FROM save WHERE filename = 'coordinates-test.sav'),
  '2200-02-01T00:00:00Z',
  '{"name": "Coordinates Test", "date": "2200.02.01"}'::jsonb
);

-- Planet coordinates for gamestate 2
INSERT INTO planet_coordinate (gamestate_id, planet_id, x, y, system_id)
VALUES
  ((SELECT gamestate_id FROM gamestate g JOIN save s ON g.save_id = s.save_id WHERE s.filename = 'coordinates-test.sav' AND g.date = '2200-02-01T00:00:00Z'), 7, -56.82, 85.08, 268);

-- Save without coordinates (for testing empty result)
INSERT INTO save (filename, name) VALUES ('no-coordinates.sav', 'No Coordinates Save');
INSERT INTO gamestate (save_id, date, data)
VALUES (
  (SELECT save_id FROM save WHERE filename = 'no-coordinates.sav'),
  '2200-01-01T00:00:00Z',
  '{"name": "No Coordinates", "date": "2200.01.01"}'::jsonb
);
