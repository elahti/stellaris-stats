-- Up Migration

CREATE INDEX idx_diplomatic_relation_target ON diplomatic_relation(gamestate_id, target_country_id);
