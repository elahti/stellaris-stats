-- Up Migration
CREATE TABLE
  budget_entry (
    budget_entry_id SERIAL PRIMARY KEY,
    alloys DOUBLE PRECISION,
    consumer_goods DOUBLE PRECISION,
    energy DOUBLE PRECISION,
    engineering_research DOUBLE PRECISION,
    food DOUBLE PRECISION,
    influence DOUBLE PRECISION,
    minerals DOUBLE PRECISION,
    physics_research DOUBLE PRECISION,
    society_research DOUBLE PRECISION,
    trade DOUBLE PRECISION,
    unity DOUBLE PRECISION
  );

CREATE TABLE
  budget_category (
    gamestate_id INTEGER NOT NULL,
    category_type TEXT NOT NULL,
    category_name TEXT NOT NULL,
    budget_entry_id INTEGER NOT NULL,
    PRIMARY KEY (gamestate_id, category_type, category_name),
    FOREIGN KEY (gamestate_id) REFERENCES gamestate (gamestate_id) ON DELETE CASCADE,
    FOREIGN KEY (budget_entry_id) REFERENCES budget_entry (budget_entry_id) ON DELETE CASCADE
  );