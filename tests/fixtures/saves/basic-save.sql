-- Insert a test save file
INSERT INTO save (filename, name)
VALUES ('test-save.sav', 'Test Empire');

-- Insert a gamestate for this save
INSERT INTO gamestate (save_id, date, data)
VALUES (
  (SELECT save_id FROM save WHERE filename = 'test-save.sav'),
  '2250-01-01',
  '{}'::jsonb
);
