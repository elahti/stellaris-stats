-- Up Migration
CREATE TABLE
  save (
    save_id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    NAME VARCHAR(255) NOT NULL,
    UNIQUE (filename)
  );

CREATE TABLE
  gamestate (
    gamestate_id SERIAL PRIMARY KEY,
    save_id INTEGER NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    "data" JSONB NOT NULL,
    UNIQUE (save_id, date),
    FOREIGN KEY (save_id) REFERENCES save (save_id) ON DELETE CASCADE
  );