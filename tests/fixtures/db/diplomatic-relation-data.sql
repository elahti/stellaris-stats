-- Fixture: Diplomatic relation data for diplomatic relation batch tests

-- Save with diplomatic relations
INSERT INTO save (filename, name) VALUES ('diplomacy-test.sav', 'Diplomacy Test Save');

-- Gamestate 1
INSERT INTO gamestate (save_id, date, data)
VALUES (
  (SELECT save_id FROM save WHERE filename = 'diplomacy-test.sav'),
  '2200-01-01T00:00:00Z',
  '{"name": "Diplomacy Test", "date": "2200.01.01"}'::jsonb
);

-- Empires for diplomatic relations (needed for target_empire_name join)
INSERT INTO empire (gamestate_id, country_id, name, is_player, owned_planet_count, controlled_planet_count)
VALUES
  ((SELECT gamestate_id FROM gamestate g JOIN save s ON g.save_id = s.save_id WHERE s.filename = 'diplomacy-test.sav' AND g.date = '2200-01-01T00:00:00Z'), '0', 'Human Empire', true, 5, 25),
  ((SELECT gamestate_id FROM gamestate g JOIN save s ON g.save_id = s.save_id WHERE s.filename = 'diplomacy-test.sav' AND g.date = '2200-01-01T00:00:00Z'), '1', 'Friendly Empire', false, 10, 50),
  ((SELECT gamestate_id FROM gamestate g JOIN save s ON g.save_id = s.save_id WHERE s.filename = 'diplomacy-test.sav' AND g.date = '2200-01-01T00:00:00Z'), '2', 'Hostile Empire', false, 8, 40),
  ((SELECT gamestate_id FROM gamestate g JOIN save s ON g.save_id = s.save_id WHERE s.filename = 'diplomacy-test.sav' AND g.date = '2200-01-01T00:00:00Z'), '3', 'Distant Empire', false, 3, 15);

-- Diplomatic relations from player (country 0) to others
INSERT INTO diplomatic_relation (gamestate_id, source_country_id, target_country_id, opinion, trust, threat, is_hostile, border_range, has_contact, has_communications)
VALUES
  ((SELECT gamestate_id FROM gamestate g JOIN save s ON g.save_id = s.save_id WHERE s.filename = 'diplomacy-test.sav' AND g.date = '2200-01-01T00:00:00Z'), '0', '1', 50, 25, 0, false, 100, true, true),
  ((SELECT gamestate_id FROM gamestate g JOIN save s ON g.save_id = s.save_id WHERE s.filename = 'diplomacy-test.sav' AND g.date = '2200-01-01T00:00:00Z'), '0', '2', -500, -10, 80, true, 50, true, true),
  ((SELECT gamestate_id FROM gamestate g JOIN save s ON g.save_id = s.save_id WHERE s.filename = 'diplomacy-test.sav' AND g.date = '2200-01-01T00:00:00Z'), '0', '3', 0, 0, 0, false, 9999, false, false);

-- Opinion modifiers for friendly relation
INSERT INTO opinion_modifier (diplomatic_relation_id, modifier_type, value)
VALUES
  ((SELECT diplomatic_relation_id FROM diplomatic_relation dr JOIN gamestate g ON dr.gamestate_id = g.gamestate_id JOIN save s ON g.save_id = s.save_id WHERE s.filename = 'diplomacy-test.sav' AND dr.target_country_id = '1'), 'alliance', 50.0),
  ((SELECT diplomatic_relation_id FROM diplomatic_relation dr JOIN gamestate g ON dr.gamestate_id = g.gamestate_id JOIN save s ON g.save_id = s.save_id WHERE s.filename = 'diplomacy-test.sav' AND dr.target_country_id = '1'), 'trade_deal', 25.0);

-- Opinion modifiers for hostile relation
INSERT INTO opinion_modifier (diplomatic_relation_id, modifier_type, value)
VALUES
  ((SELECT diplomatic_relation_id FROM diplomatic_relation dr JOIN gamestate g ON dr.gamestate_id = g.gamestate_id JOIN save s ON g.save_id = s.save_id WHERE s.filename = 'diplomacy-test.sav' AND dr.target_country_id = '2'), 'border_friction', -30.0),
  ((SELECT diplomatic_relation_id FROM diplomatic_relation dr JOIN gamestate g ON dr.gamestate_id = g.gamestate_id JOIN save s ON g.save_id = s.save_id WHERE s.filename = 'diplomacy-test.sav' AND dr.target_country_id = '2'), 'war_enemy', -200.0);

-- Save without relations (for testing empty result)
INSERT INTO save (filename, name) VALUES ('no-relations.sav', 'No Relations Save');
INSERT INTO gamestate (save_id, date, data)
VALUES (
  (SELECT save_id FROM save WHERE filename = 'no-relations.sav'),
  '2200-01-01T00:00:00Z',
  '{"name": "No Relations", "date": "2200.01.01"}'::jsonb
);
