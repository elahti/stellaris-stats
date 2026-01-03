-- Up Migration

CREATE TABLE diplomatic_relation (
  diplomatic_relation_id SERIAL PRIMARY KEY,
  gamestate_id INTEGER NOT NULL,
  source_country_id TEXT NOT NULL,
  target_country_id TEXT NOT NULL,
  opinion DOUBLE PRECISION,
  trust DOUBLE PRECISION,
  threat DOUBLE PRECISION,
  is_hostile BOOLEAN NOT NULL DEFAULT FALSE,
  border_range DOUBLE PRECISION,
  has_contact BOOLEAN NOT NULL DEFAULT FALSE,
  has_communications BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (gamestate_id, source_country_id, target_country_id),
  FOREIGN KEY (gamestate_id) REFERENCES gamestate (gamestate_id) ON DELETE CASCADE
);

CREATE INDEX idx_diplomatic_relation_gamestate ON diplomatic_relation(gamestate_id);
CREATE INDEX idx_diplomatic_relation_source ON diplomatic_relation(gamestate_id, source_country_id);
