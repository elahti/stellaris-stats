INSERT INTO save (filename, name)
VALUES ('test-save', 'Test Empire');

INSERT INTO gamestate (save_id, date, data)
VALUES (
  (SELECT save_id FROM save WHERE filename = 'test-save'),
  '2250-01-15',
  '{"name": "Test Empire", "date": "2250.01.15"}'::jsonb
);
