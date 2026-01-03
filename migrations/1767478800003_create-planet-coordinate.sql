-- Up Migration

CREATE TABLE planet_coordinate (
  planet_coordinate_id SERIAL PRIMARY KEY,
  gamestate_id INTEGER NOT NULL,
  planet_id TEXT NOT NULL,
  x DOUBLE PRECISION NOT NULL,
  y DOUBLE PRECISION NOT NULL,
  system_id INTEGER,
  UNIQUE (gamestate_id, planet_id),
  FOREIGN KEY (gamestate_id) REFERENCES gamestate (gamestate_id) ON DELETE CASCADE
);

CREATE INDEX idx_planet_coordinate_gamestate ON planet_coordinate(gamestate_id);
