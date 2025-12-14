INSERT INTO save (filename, name)
VALUES ('empire-timeline.sav', 'Galactic Empire');

INSERT INTO gamestate (save_id, date, data)
VALUES
  (
    (SELECT save_id FROM save WHERE filename = 'empire-timeline.sav'),
    '2200-01-01',
    '{}'::jsonb
  ),
  (
    (SELECT save_id FROM save WHERE filename = 'empire-timeline.sav'),
    '2225-06-15',
    '{}'::jsonb
  ),
  (
    (SELECT save_id FROM save WHERE filename = 'empire-timeline.sav'),
    '2250-12-31',
    '{}'::jsonb
  );
