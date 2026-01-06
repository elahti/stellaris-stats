-- Fixture: Empire data for empire batch tests

-- Save with empire data
INSERT INTO save (filename, name) VALUES ('empire-test.sav', 'Empire Test Save');

-- Gamestate 1
INSERT INTO gamestate (save_id, date, data)
VALUES (
  (SELECT save_id FROM save WHERE filename = 'empire-test.sav'),
  '2200-01-01T00:00:00Z',
  '{"name": "Empire Test", "date": "2200.01.01"}'::jsonb
);

-- Planet coordinates for gamestate 1 (required for FK constraints)
INSERT INTO planet_coordinate (gamestate_id, planet_id, x, y, system_id)
VALUES
  ((SELECT gamestate_id FROM gamestate g JOIN save s ON g.save_id = s.save_id WHERE s.filename = 'empire-test.sav' AND g.date = '2200-01-01T00:00:00Z'), 7, 0.0, 0.0, 1),
  ((SELECT gamestate_id FROM gamestate g JOIN save s ON g.save_id = s.save_id WHERE s.filename = 'empire-test.sav' AND g.date = '2200-01-01T00:00:00Z'), 8, 1.0, 1.0, 1),
  ((SELECT gamestate_id FROM gamestate g JOIN save s ON g.save_id = s.save_id WHERE s.filename = 'empire-test.sav' AND g.date = '2200-01-01T00:00:00Z'), 9, 2.0, 2.0, 1),
  ((SELECT gamestate_id FROM gamestate g JOIN save s ON g.save_id = s.save_id WHERE s.filename = 'empire-test.sav' AND g.date = '2200-01-01T00:00:00Z'), 12, 10.0, 10.0, 2),
  ((SELECT gamestate_id FROM gamestate g JOIN save s ON g.save_id = s.save_id WHERE s.filename = 'empire-test.sav' AND g.date = '2200-01-01T00:00:00Z'), 13, 11.0, 11.0, 2),
  ((SELECT gamestate_id FROM gamestate g JOIN save s ON g.save_id = s.save_id WHERE s.filename = 'empire-test.sav' AND g.date = '2200-01-01T00:00:00Z'), 25, 20.0, 20.0, 3);

-- Empires for gamestate 1
INSERT INTO empire (gamestate_id, country_id, name, is_player, capital_planet_id, owned_planet_count, controlled_planet_count, military_power, economy_power, tech_power)
VALUES
  ((SELECT gamestate_id FROM gamestate g JOIN save s ON g.save_id = s.save_id WHERE s.filename = 'empire-test.sav' AND g.date = '2200-01-01T00:00:00Z'), '0', 'Human Empire', true, 7, 5, 25, 1500.5, 2000.0, 800.0),
  ((SELECT gamestate_id FROM gamestate g JOIN save s ON g.save_id = s.save_id WHERE s.filename = 'empire-test.sav' AND g.date = '2200-01-01T00:00:00Z'), '1', 'Alien Empire', false, 12, 10, 50, 3000.0, 4000.0, 1200.0),
  ((SELECT gamestate_id FROM gamestate g JOIN save s ON g.save_id = s.save_id WHERE s.filename = 'empire-test.sav' AND g.date = '2200-01-01T00:00:00Z'), '2', 'Machine Empire', false, 25, 3, 15, 500.0, 600.0, 400.0);

-- Gamestate 2 (for batch query testing)
INSERT INTO gamestate (save_id, date, data)
VALUES (
  (SELECT save_id FROM save WHERE filename = 'empire-test.sav'),
  '2200-02-01T00:00:00Z',
  '{"name": "Empire Test", "date": "2200.02.01"}'::jsonb
);

-- Planet coordinates for gamestate 2 (required for FK constraints)
INSERT INTO planet_coordinate (gamestate_id, planet_id, x, y, system_id)
VALUES
  ((SELECT gamestate_id FROM gamestate g JOIN save s ON g.save_id = s.save_id WHERE s.filename = 'empire-test.sav' AND g.date = '2200-02-01T00:00:00Z'), 7, 0.0, 0.0, 1);

-- Empires for gamestate 2
INSERT INTO empire (gamestate_id, country_id, name, is_player, capital_planet_id, owned_planet_count, controlled_planet_count, military_power, economy_power, tech_power)
VALUES
  ((SELECT gamestate_id FROM gamestate g JOIN save s ON g.save_id = s.save_id WHERE s.filename = 'empire-test.sav' AND g.date = '2200-02-01T00:00:00Z'), '0', 'Human Empire', true, 7, 6, 30, 1800.0, 2500.0, 1000.0);

-- Empire planet ownership for gamestate 1
INSERT INTO empire_planet (gamestate_id, country_id, planet_id)
VALUES
  ((SELECT gamestate_id FROM gamestate g JOIN save s ON g.save_id = s.save_id WHERE s.filename = 'empire-test.sav' AND g.date = '2200-01-01T00:00:00Z'), '0', 7),
  ((SELECT gamestate_id FROM gamestate g JOIN save s ON g.save_id = s.save_id WHERE s.filename = 'empire-test.sav' AND g.date = '2200-01-01T00:00:00Z'), '0', 8),
  ((SELECT gamestate_id FROM gamestate g JOIN save s ON g.save_id = s.save_id WHERE s.filename = 'empire-test.sav' AND g.date = '2200-01-01T00:00:00Z'), '0', 9),
  ((SELECT gamestate_id FROM gamestate g JOIN save s ON g.save_id = s.save_id WHERE s.filename = 'empire-test.sav' AND g.date = '2200-01-01T00:00:00Z'), '1', 12),
  ((SELECT gamestate_id FROM gamestate g JOIN save s ON g.save_id = s.save_id WHERE s.filename = 'empire-test.sav' AND g.date = '2200-01-01T00:00:00Z'), '1', 13);

-- Save without empires (for testing empty result)
INSERT INTO save (filename, name) VALUES ('no-empires.sav', 'No Empires Save');
INSERT INTO gamestate (save_id, date, data)
VALUES (
  (SELECT save_id FROM save WHERE filename = 'no-empires.sav'),
  '2200-01-01T00:00:00Z',
  '{"name": "No Empires", "date": "2200.01.01"}'::jsonb
);
