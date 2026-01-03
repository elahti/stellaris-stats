-- Up Migration

CREATE TABLE empire (
  empire_id SERIAL PRIMARY KEY,
  gamestate_id INTEGER NOT NULL,
  country_id TEXT NOT NULL,
  name TEXT NOT NULL,
  is_player BOOLEAN NOT NULL DEFAULT FALSE,
  capital_planet_id INTEGER,
  owned_planet_count INTEGER NOT NULL DEFAULT 0,
  controlled_planet_count INTEGER NOT NULL DEFAULT 0,
  military_power DOUBLE PRECISION,
  economy_power DOUBLE PRECISION,
  tech_power DOUBLE PRECISION,
  UNIQUE (gamestate_id, country_id),
  FOREIGN KEY (gamestate_id) REFERENCES gamestate (gamestate_id) ON DELETE CASCADE
);

CREATE INDEX idx_empire_gamestate ON empire(gamestate_id);
CREATE INDEX idx_empire_is_player ON empire(gamestate_id, is_player);
