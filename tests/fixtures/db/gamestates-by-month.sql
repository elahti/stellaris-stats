-- Fixture: Gamestates for DATE_TRUNC month matching tests

-- Save with gamestates on different days of the same month
INSERT INTO save (filename, name) VALUES ('month-test.sav', 'Month Test Empire');

-- Gamestate on the 1st of January
INSERT INTO gamestate (save_id, date, data)
VALUES (
  (SELECT save_id FROM save WHERE filename = 'month-test.sav'),
  '2200-01-01T00:00:00Z',
  '{"name": "Month Test Empire", "date": "2200.01.01"}'::jsonb
);

-- Gamestate in March (mid-month)
INSERT INTO gamestate (save_id, date, data)
VALUES (
  (SELECT save_id FROM save WHERE filename = 'month-test.sav'),
  '2200-03-15T12:30:00Z',
  '{"name": "Month Test Empire", "date": "2200.03.15"}'::jsonb
);

-- Gamestate in June (end of month)
INSERT INTO gamestate (save_id, date, data)
VALUES (
  (SELECT save_id FROM save WHERE filename = 'month-test.sav'),
  '2200-06-30T23:59:59Z',
  '{"name": "Month Test Empire", "date": "2200.06.30"}'::jsonb
);
