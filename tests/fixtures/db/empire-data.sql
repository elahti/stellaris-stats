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

-- Empires for gamestate 2
INSERT INTO empire (gamestate_id, country_id, name, is_player, capital_planet_id, owned_planet_count, controlled_planet_count, military_power, economy_power, tech_power)
VALUES
  ((SELECT gamestate_id FROM gamestate g JOIN save s ON g.save_id = s.save_id WHERE s.filename = 'empire-test.sav' AND g.date = '2200-02-01T00:00:00Z'), '0', 'Human Empire', true, 7, 6, 30, 1800.0, 2500.0, 1000.0);

-- Save without empires (for testing empty result)
INSERT INTO save (filename, name) VALUES ('no-empires.sav', 'No Empires Save');
INSERT INTO gamestate (save_id, date, data)
VALUES (
  (SELECT save_id FROM save WHERE filename = 'no-empires.sav'),
  '2200-01-01T00:00:00Z',
  '{"name": "No Empires", "date": "2200.01.01"}'::jsonb
);
