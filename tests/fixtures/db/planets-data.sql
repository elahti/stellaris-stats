-- Fixture for planets data testing
-- Creates saves with gamestates containing planet data in JSONB

INSERT INTO save (filename, name) VALUES
  ('planets-empire.sav', 'Planets Empire'),
  ('no-planets.sav', 'No Planets Empire');

-- Gamestate with planets data
INSERT INTO gamestate (save_id, date, data)
SELECT
  save_id,
  '2200-01-01'::date,
  '{
    "player": [{"country": "0"}],
    "country": {
      "0": {
        "owned_planets": ["1", "2"]
      }
    },
    "planets": {
      "planet": {
        "1": {
          "name": {"key": "Homeworld"},
          "produces": {"energy": 100, "minerals": 50, "food": 30},
          "upkeep": {"energy": -10, "minerals": -5},
          "profits": {"energy": 90, "minerals": 45, "food": 30}
        },
        "2": {
          "name": {"key": "Colony Alpha"},
          "produces": {"energy": 50, "minerals": 25},
          "upkeep": {"energy": -5},
          "profits": {"energy": 45, "minerals": 25}
        }
      }
    }
  }'::jsonb
FROM save WHERE filename = 'planets-empire.sav';

-- Gamestate without planets (empty owned_planets)
INSERT INTO gamestate (save_id, date, data)
SELECT
  save_id,
  '2200-01-01'::date,
  '{
    "player": [{"country": "0"}],
    "country": {
      "0": {
        "owned_planets": []
      }
    },
    "planets": {
      "planet": {}
    }
  }'::jsonb
FROM save WHERE filename = 'no-planets.sav';
