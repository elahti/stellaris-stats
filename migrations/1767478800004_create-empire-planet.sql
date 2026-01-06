-- Up Migration
CREATE TABLE empire_planet (
  empire_planet_id SERIAL PRIMARY KEY,
  gamestate_id INTEGER NOT NULL,
  country_id TEXT NOT NULL,
  planet_id INTEGER NOT NULL,
  UNIQUE (gamestate_id, country_id, planet_id),
  FOREIGN KEY (gamestate_id) REFERENCES gamestate (gamestate_id) ON DELETE CASCADE,
  FOREIGN KEY (gamestate_id, country_id)
    REFERENCES empire (gamestate_id, country_id) ON DELETE CASCADE,
  FOREIGN KEY (gamestate_id, planet_id)
    REFERENCES planet_coordinate (gamestate_id, planet_id) ON DELETE CASCADE
);

CREATE INDEX idx_empire_planet_gamestate ON empire_planet(gamestate_id);
CREATE INDEX idx_empire_planet_country ON empire_planet(gamestate_id, country_id);
CREATE INDEX idx_empire_planet_planet ON empire_planet(gamestate_id, planet_id);

-- Down Migration
-- DROP TABLE empire_planet;
