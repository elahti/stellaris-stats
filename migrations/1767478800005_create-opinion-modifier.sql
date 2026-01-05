-- Up Migration
CREATE TABLE opinion_modifier (
  opinion_modifier_id SERIAL PRIMARY KEY,
  diplomatic_relation_id INTEGER NOT NULL,
  modifier_type TEXT NOT NULL,
  value DOUBLE PRECISION NOT NULL,
  UNIQUE (diplomatic_relation_id, modifier_type),
  FOREIGN KEY (diplomatic_relation_id)
    REFERENCES diplomatic_relation (diplomatic_relation_id) ON DELETE CASCADE
);

CREATE INDEX idx_opinion_modifier_relation ON opinion_modifier(diplomatic_relation_id);

-- Down Migration
-- DROP TABLE opinion_modifier;
