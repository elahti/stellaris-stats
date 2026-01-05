-- Basic neighbor detection scenario - multiple neighbors at different distances
-- Generated: 2025-01-05
-- Player empire with 3 neighbors at varying distances, no hostility

-- Save
INSERT INTO save (filename, name) VALUES ('commonwealthofman_1251622081', 'Commonwealth of Man');

-- Gamestate
INSERT INTO gamestate (save_id, date, data) VALUES (
    (SELECT save_id FROM save WHERE filename = 'commonwealthofman_1251622081'),
    '2250-01-01T00:00:00',
    '{}'::jsonb
);

-- Planet coordinates (for distance calculations)
-- Player empire planets (around origin)
INSERT INTO planet_coordinate (gamestate_id, planet_id, x, y, system_id) VALUES
    ((SELECT gamestate_id FROM gamestate WHERE date = '2250-01-01T00:00:00' AND save_id = (SELECT save_id FROM save WHERE filename = 'commonwealthofman_1251622081')), 1, 0.0, 0.0, 1),
    ((SELECT gamestate_id FROM gamestate WHERE date = '2250-01-01T00:00:00' AND save_id = (SELECT save_id FROM save WHERE filename = 'commonwealthofman_1251622081')), 2, 10.0, 5.0, 2);

-- Neighbor 1 planets (close - distance ~50)
INSERT INTO planet_coordinate (gamestate_id, planet_id, x, y, system_id) VALUES
    ((SELECT gamestate_id FROM gamestate WHERE date = '2250-01-01T00:00:00' AND save_id = (SELECT save_id FROM save WHERE filename = 'commonwealthofman_1251622081')), 101, 50.0, 0.0, 101);

-- Neighbor 2 planets (medium - distance ~100)
INSERT INTO planet_coordinate (gamestate_id, planet_id, x, y, system_id) VALUES
    ((SELECT gamestate_id FROM gamestate WHERE date = '2250-01-01T00:00:00' AND save_id = (SELECT save_id FROM save WHERE filename = 'commonwealthofman_1251622081')), 201, 100.0, 0.0, 201);

-- Neighbor 3 planets (far - distance ~150)
INSERT INTO planet_coordinate (gamestate_id, planet_id, x, y, system_id) VALUES
    ((SELECT gamestate_id FROM gamestate WHERE date = '2250-01-01T00:00:00' AND save_id = (SELECT save_id FROM save WHERE filename = 'commonwealthofman_1251622081')), 301, 150.0, 0.0, 301);

-- Empires
-- Player empire (country_id = '0')
INSERT INTO empire (gamestate_id, country_id, name, is_player, capital_planet_id, owned_planet_count, controlled_planet_count, military_power, economy_power, tech_power) VALUES
    ((SELECT gamestate_id FROM gamestate WHERE date = '2250-01-01T00:00:00' AND save_id = (SELECT save_id FROM save WHERE filename = 'commonwealthofman_1251622081')), '0', 'Commonwealth of Man', TRUE, 1, 2, 2, 1000, 500, 300);

-- Neighbor empires
INSERT INTO empire (gamestate_id, country_id, name, is_player, capital_planet_id, owned_planet_count, controlled_planet_count, military_power, economy_power, tech_power) VALUES
    ((SELECT gamestate_id FROM gamestate WHERE date = '2250-01-01T00:00:00' AND save_id = (SELECT save_id FROM save WHERE filename = 'commonwealthofman_1251622081')), '1', 'United Nations of Earth', FALSE, 101, 1, 1, 800, 400, 250),
    ((SELECT gamestate_id FROM gamestate WHERE date = '2250-01-01T00:00:00' AND save_id = (SELECT save_id FROM save WHERE filename = 'commonwealthofman_1251622081')), '2', 'Tzynn Empire', FALSE, 201, 1, 1, 1200, 600, 350),
    ((SELECT gamestate_id FROM gamestate WHERE date = '2250-01-01T00:00:00' AND save_id = (SELECT save_id FROM save WHERE filename = 'commonwealthofman_1251622081')), '3', 'Blorg Commonality', FALSE, 301, 1, 1, 600, 300, 200);

-- Empire planets (ownership)
INSERT INTO empire_planet (gamestate_id, country_id, planet_id) VALUES
    ((SELECT gamestate_id FROM gamestate WHERE date = '2250-01-01T00:00:00' AND save_id = (SELECT save_id FROM save WHERE filename = 'commonwealthofman_1251622081')), '0', 1),
    ((SELECT gamestate_id FROM gamestate WHERE date = '2250-01-01T00:00:00' AND save_id = (SELECT save_id FROM save WHERE filename = 'commonwealthofman_1251622081')), '0', 2),
    ((SELECT gamestate_id FROM gamestate WHERE date = '2250-01-01T00:00:00' AND save_id = (SELECT save_id FROM save WHERE filename = 'commonwealthofman_1251622081')), '1', 101),
    ((SELECT gamestate_id FROM gamestate WHERE date = '2250-01-01T00:00:00' AND save_id = (SELECT save_id FROM save WHERE filename = 'commonwealthofman_1251622081')), '2', 201),
    ((SELECT gamestate_id FROM gamestate WHERE date = '2250-01-01T00:00:00' AND save_id = (SELECT save_id FROM save WHERE filename = 'commonwealthofman_1251622081')), '3', 301);

-- Diplomatic relations (player to neighbors, all neutral/positive)
INSERT INTO diplomatic_relation (gamestate_id, source_country_id, target_country_id, opinion, trust, threat, is_hostile, border_range, has_contact, has_communications) VALUES
    ((SELECT gamestate_id FROM gamestate WHERE date = '2250-01-01T00:00:00' AND save_id = (SELECT save_id FROM save WHERE filename = 'commonwealthofman_1251622081')), '0', '1', 50, 25, 10, FALSE, 50.0, TRUE, TRUE),
    ((SELECT gamestate_id FROM gamestate WHERE date = '2250-01-01T00:00:00' AND save_id = (SELECT save_id FROM save WHERE filename = 'commonwealthofman_1251622081')), '0', '2', 0, 0, 20, FALSE, 100.0, TRUE, TRUE),
    ((SELECT gamestate_id FROM gamestate WHERE date = '2250-01-01T00:00:00' AND save_id = (SELECT save_id FROM save WHERE filename = 'commonwealthofman_1251622081')), '0', '3', 75, 50, 5, FALSE, 150.0, TRUE, TRUE);

-- Opinion modifiers (basic positive/negative modifiers)
INSERT INTO opinion_modifier (diplomatic_relation_id, modifier_type, value) VALUES
    ((SELECT diplomatic_relation_id FROM diplomatic_relation WHERE gamestate_id = (SELECT gamestate_id FROM gamestate WHERE date = '2250-01-01T00:00:00' AND save_id = (SELECT save_id FROM save WHERE filename = 'commonwealthofman_1251622081')) AND source_country_id = '0' AND target_country_id = '1'), 'opinion_common_ground', 25),
    ((SELECT diplomatic_relation_id FROM diplomatic_relation WHERE gamestate_id = (SELECT gamestate_id FROM gamestate WHERE date = '2250-01-01T00:00:00' AND save_id = (SELECT save_id FROM save WHERE filename = 'commonwealthofman_1251622081')) AND source_country_id = '0' AND target_country_id = '3'), 'opinion_friendly', 50);
