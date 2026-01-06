-- High threat neighbor scenario - neighbor with threat above 50
-- Generated: 2025-01-05
-- Player empire with a powerful threatening neighbor

-- Save
INSERT INTO save (filename, name) VALUES ('commonwealthofman_1251622081', 'Commonwealth of Man');

-- Gamestate
INSERT INTO gamestate (save_id, date, data) VALUES (
    (SELECT save_id FROM save WHERE filename = 'commonwealthofman_1251622081'),
    '2250-01-01T00:00:00',
    '{}'::jsonb
);

-- Planet coordinates
-- Player empire planets
INSERT INTO planet_coordinate (gamestate_id, planet_id, x, y, system_id) VALUES
    ((SELECT gamestate_id FROM gamestate WHERE date = '2250-01-01T00:00:00' AND save_id = (SELECT save_id FROM save WHERE filename = 'commonwealthofman_1251622081')), 1, 0.0, 0.0, 1);

-- High threat neighbor planets
INSERT INTO planet_coordinate (gamestate_id, planet_id, x, y, system_id) VALUES
    ((SELECT gamestate_id FROM gamestate WHERE date = '2250-01-01T00:00:00' AND save_id = (SELECT save_id FROM save WHERE filename = 'commonwealthofman_1251622081')), 101, 35.0, 0.0, 101);

-- Low threat neighbor planets
INSERT INTO planet_coordinate (gamestate_id, planet_id, x, y, system_id) VALUES
    ((SELECT gamestate_id FROM gamestate WHERE date = '2250-01-01T00:00:00' AND save_id = (SELECT save_id FROM save WHERE filename = 'commonwealthofman_1251622081')), 201, 100.0, 0.0, 201);

-- Empires
INSERT INTO empire (gamestate_id, country_id, name, is_player, capital_planet_id, owned_planet_count, controlled_planet_count, military_power, economy_power, tech_power) VALUES
    ((SELECT gamestate_id FROM gamestate WHERE date = '2250-01-01T00:00:00' AND save_id = (SELECT save_id FROM save WHERE filename = 'commonwealthofman_1251622081')), '0', 'Commonwealth of Man', TRUE, 1, 1, 1, 500, 300, 200),
    ((SELECT gamestate_id FROM gamestate WHERE date = '2250-01-01T00:00:00' AND save_id = (SELECT save_id FROM save WHERE filename = 'commonwealthofman_1251622081')), '1', 'Overwhelming Dominion', FALSE, 101, 5, 5, 5000, 3000, 2000),
    ((SELECT gamestate_id FROM gamestate WHERE date = '2250-01-01T00:00:00' AND save_id = (SELECT save_id FROM save WHERE filename = 'commonwealthofman_1251622081')), '2', 'Minor Federation', FALSE, 201, 1, 1, 400, 250, 150);

-- Empire planets
INSERT INTO empire_planet (gamestate_id, country_id, planet_id) VALUES
    ((SELECT gamestate_id FROM gamestate WHERE date = '2250-01-01T00:00:00' AND save_id = (SELECT save_id FROM save WHERE filename = 'commonwealthofman_1251622081')), '0', 1),
    ((SELECT gamestate_id FROM gamestate WHERE date = '2250-01-01T00:00:00' AND save_id = (SELECT save_id FROM save WHERE filename = 'commonwealthofman_1251622081')), '1', 101),
    ((SELECT gamestate_id FROM gamestate WHERE date = '2250-01-01T00:00:00' AND save_id = (SELECT save_id FROM save WHERE filename = 'commonwealthofman_1251622081')), '2', 201);

-- Diplomatic relations
-- High threat neighbor (threat = 80, above 50 threshold)
INSERT INTO diplomatic_relation (gamestate_id, source_country_id, target_country_id, opinion, trust, threat, is_hostile, border_range, has_contact, has_communications) VALUES
    ((SELECT gamestate_id FROM gamestate WHERE date = '2250-01-01T00:00:00' AND save_id = (SELECT save_id FROM save WHERE filename = 'commonwealthofman_1251622081')), '0', '1', -20, -10, 80, FALSE, 35.0, TRUE, TRUE),
    ((SELECT gamestate_id FROM gamestate WHERE date = '2250-01-01T00:00:00' AND save_id = (SELECT save_id FROM save WHERE filename = 'commonwealthofman_1251622081')), '0', '2', 30, 15, 10, FALSE, 100.0, TRUE, TRUE);

-- Opinion modifiers
INSERT INTO opinion_modifier (diplomatic_relation_id, modifier_type, value) VALUES
    ((SELECT diplomatic_relation_id FROM diplomatic_relation WHERE gamestate_id = (SELECT gamestate_id FROM gamestate WHERE date = '2250-01-01T00:00:00' AND save_id = (SELECT save_id FROM save WHERE filename = 'commonwealthofman_1251622081')) AND source_country_id = '0' AND target_country_id = '1'), 'opinion_relative_power', -30),
    ((SELECT diplomatic_relation_id FROM diplomatic_relation WHERE gamestate_id = (SELECT gamestate_id FROM gamestate WHERE date = '2250-01-01T00:00:00' AND save_id = (SELECT save_id FROM save WHERE filename = 'commonwealthofman_1251622081')) AND source_country_id = '0' AND target_country_id = '1'), 'opinion_fear', -20);
