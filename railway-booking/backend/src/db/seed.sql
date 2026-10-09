INSERT INTO stations (code, name) VALUES
  ('NDLS', 'New Delhi'),
  ('BCT',  'Mumbai Central'),
  ('MAS',  'Chennai Central'),
  ('HWH',  'Howrah Junction'),
  ('SBC',  'Bengaluru City'),
  ('SC',   'Secunderabad'),
  ('PUNE', 'Pune Junction')
ON CONFLICT (code) DO NOTHING;

INSERT INTO trains (number, name, source_id, dest_id, departs, arrives, fare_per_seat, total_seats) VALUES
  -- New Delhi <-> Mumbai Central
  ('12951', 'Mumbai Rajdhani Express',    (SELECT id FROM stations WHERE code='BCT'),  (SELECT id FROM stations WHERE code='NDLS'), '17:00', '08:30', 1750, 60),
  ('12952', 'Delhi Rajdhani Express',     (SELECT id FROM stations WHERE code='NDLS'), (SELECT id FROM stations WHERE code='BCT'),  '16:55', '08:35', 1750, 60),
  ('12953', 'August Kranti Rajdhani',     (SELECT id FROM stations WHERE code='BCT'),  (SELECT id FROM stations WHERE code='NDLS'), '17:40', '09:43', 1680, 72),
  ('12954', 'August Kranti Express',      (SELECT id FROM stations WHERE code='NDLS'), (SELECT id FROM stations WHERE code='BCT'),  '17:15', '10:05', 1680, 72),

  -- New Delhi <-> Chennai Central
  ('12621', 'Tamil Nadu Express',         (SELECT id FROM stations WHERE code='NDLS'), (SELECT id FROM stations WHERE code='MAS'),  '22:30', '07:10', 1650, 72),
  ('12622', 'Tamil Nadu Express',         (SELECT id FROM stations WHERE code='MAS'),  (SELECT id FROM stations WHERE code='NDLS'), '22:00', '06:40', 1650, 72),
  ('12433', 'Chennai Rajdhani Express',   (SELECT id FROM stations WHERE code='NDLS'), (SELECT id FROM stations WHERE code='MAS'),  '15:35', '20:40', 1890, 60),
  ('12434', 'Nizamuddin Rajdhani Express', (SELECT id FROM stations WHERE code='MAS'),  (SELECT id FROM stations WHERE code='NDLS'), '06:05', '10:30', 1890, 60),

  -- New Delhi <-> Howrah Junction
  ('12301', 'Howrah Rajdhani Express',    (SELECT id FROM stations WHERE code='HWH'),  (SELECT id FROM stations WHERE code='NDLS'), '16:50', '10:05', 1820, 60),
  ('12302', 'New Delhi Rajdhani Express', (SELECT id FROM stations WHERE code='NDLS'), (SELECT id FROM stations WHERE code='HWH'),  '16:55', '09:55', 1820, 60),
  ('12305', 'Poorva Express',             (SELECT id FROM stations WHERE code='HWH'),  (SELECT id FROM stations WHERE code='NDLS'), '08:00', '06:00', 1250, 90),
  ('12306', 'Poorva Express',             (SELECT id FROM stations WHERE code='NDLS'), (SELECT id FROM stations WHERE code='HWH'),  '17:40', '17:00', 1250, 90),

  -- New Delhi <-> Bengaluru City
  ('12649', 'Karnataka Sampark Kranti',   (SELECT id FROM stations WHERE code='SBC'),  (SELECT id FROM stations WHERE code='NDLS'), '13:50', '09:15', 1720, 80),
  ('12650', 'Karnataka Sampark Kranti',   (SELECT id FROM stations WHERE code='NDLS'), (SELECT id FROM stations WHERE code='SBC'),  '08:20', '03:30', 1720, 80),
  ('12627', 'Karnataka Express',          (SELECT id FROM stations WHERE code='SBC'),  (SELECT id FROM stations WHERE code='NDLS'), '19:20', '09:00', 1680, 100),
  ('12628', 'Karnataka Express',          (SELECT id FROM stations WHERE code='NDLS'), (SELECT id FROM stations WHERE code='SBC'),  '20:20', '12:00', 1680, 100),

  -- New Delhi <-> Secunderabad
  ('12723', 'Telangana Express',          (SELECT id FROM stations WHERE code='SC'),   (SELECT id FROM stations WHERE code='NDLS'), '06:25', '05:15', 1450, 72),
  ('12724', 'Telangana Express',          (SELECT id FROM stations WHERE code='NDLS'), (SELECT id FROM stations WHERE code='SC'),   '07:40', '06:30', 1450, 72),
  ('12437', 'Secunderabad Rajdhani',      (SELECT id FROM stations WHERE code='SC'),   (SELECT id FROM stations WHERE code='NDLS'), '12:45', '10:25', 1950, 60),
  ('12438', 'Nizamuddin Rajdhani',        (SELECT id FROM stations WHERE code='NDLS'), (SELECT id FROM stations WHERE code='SC'),   '15:35', '14:00', 1950, 60),

  -- New Delhi <-> Pune Junction
  ('11077', 'Jhelum Express',             (SELECT id FROM stations WHERE code='PUNE'), (SELECT id FROM stations WHERE code='NDLS'), '17:20', '20:40', 1380, 80),
  ('11078', 'Jhelum Express',             (SELECT id FROM stations WHERE code='NDLS'), (SELECT id FROM stations WHERE code='PUNE'), '10:00', '15:55', 1380, 80),
  ('12493', 'Darshan Express',            (SELECT id FROM stations WHERE code='PUNE'), (SELECT id FROM stations WHERE code='NDLS'), '11:05', '06:35', 1520, 75),
  ('12494', 'Darshan Express',            (SELECT id FROM stations WHERE code='NDLS'), (SELECT id FROM stations WHERE code='PUNE'), '21:35', '16:55', 1520, 75),

  -- Mumbai Central <-> Chennai Central
  ('12163', 'Mumbai Chennai Mail',        (SELECT id FROM stations WHERE code='BCT'),  (SELECT id FROM stations WHERE code='MAS'),  '20:35', '19:45', 1420, 80),
  ('12164', 'Chennai Mumbai Mail',        (SELECT id FROM stations WHERE code='MAS'),  (SELECT id FROM stations WHERE code='BCT'),  '06:25', '05:40', 1420, 80),

  -- Mumbai Central <-> Howrah Junction
  ('12809', 'Mumbai Howrah Mail',         (SELECT id FROM stations WHERE code='BCT'),  (SELECT id FROM stations WHERE code='HWH'),  '21:10', '05:45', 1560, 90),
  ('12810', 'Howrah Mumbai Mail',         (SELECT id FROM stations WHERE code='HWH'),  (SELECT id FROM stations WHERE code='BCT'),  '19:55', '04:25', 1560, 90),

  -- Mumbai Central <-> Bengaluru City
  ('11301', 'Udyan Express',              (SELECT id FROM stations WHERE code='BCT'),  (SELECT id FROM stations WHERE code='SBC'),  '08:10', '06:00', 1280, 85),
  ('11302', 'Udyan Express',              (SELECT id FROM stations WHERE code='SBC'),  (SELECT id FROM stations WHERE code='BCT'),  '20:40', '19:45', 1280, 85),

  -- Mumbai Central <-> Secunderabad
  ('17057', 'Devagiri Express',           (SELECT id FROM stations WHERE code='BCT'),  (SELECT id FROM stations WHERE code='SC'),   '21:30', '13:25', 950,  90),
  ('17058', 'Devagiri Express',           (SELECT id FROM stations WHERE code='SC'),   (SELECT id FROM stations WHERE code='BCT'),  '13:25', '07:10', 950,  90),

  -- Mumbai Central <-> Pune Junction
  ('11029', 'Koyna Express',              (SELECT id FROM stations WHERE code='BCT'),  (SELECT id FROM stations WHERE code='PUNE'), '08:10', '12:40', 310,  100),
  ('11030', 'Koyna Express',              (SELECT id FROM stations WHERE code='PUNE'), (SELECT id FROM stations WHERE code='BCT'),  '15:50', '20:05', 310,  100),
  ('12125', 'Pragathi Express',           (SELECT id FROM stations WHERE code='BCT'),  (SELECT id FROM stations WHERE code='PUNE'), '16:25', '19:50', 280,  120),
  ('12126', 'Pragathi Express',           (SELECT id FROM stations WHERE code='PUNE'), (SELECT id FROM stations WHERE code='BCT'),  '07:50', '11:25', 280,  120),

  -- Howrah Junction <-> Chennai Central
  ('12839', 'Howrah Chennai Mail',        (SELECT id FROM stations WHERE code='HWH'),  (SELECT id FROM stations WHERE code='MAS'),  '23:45', '05:30', 980,  80),
  ('12840', 'Chennai Howrah Mail',        (SELECT id FROM stations WHERE code='MAS'),  (SELECT id FROM stations WHERE code='HWH'),  '23:40', '05:10', 980,  80),

  -- Howrah Junction <-> Bengaluru City
  ('12863', 'Howrah Bengaluru Express',   (SELECT id FROM stations WHERE code='HWH'),  (SELECT id FROM stations WHERE code='SBC'),  '22:55', '06:45', 1150, 90),
  ('12864', 'Bengaluru Howrah Express',   (SELECT id FROM stations WHERE code='SBC'),  (SELECT id FROM stations WHERE code='HWH'),  '10:35', '19:55', 1150, 90),

  -- Chennai Central <-> Bengaluru City
  ('12027', 'Chennai Bengaluru Shatabdi', (SELECT id FROM stations WHERE code='MAS'),  (SELECT id FROM stations WHERE code='SBC'),  '17:30', '22:25', 890,  110),
  ('12028', 'Bengaluru Chennai Shatabdi', (SELECT id FROM stations WHERE code='SBC'),  (SELECT id FROM stations WHERE code='MAS'),  '06:00', '11:00', 890,  110),
  ('12607', 'Lalbagh Express',            (SELECT id FROM stations WHERE code='MAS'),  (SELECT id FROM stations WHERE code='SBC'),  '15:30', '21:35', 340,  150),
  ('12608', 'Lalbagh Express',            (SELECT id FROM stations WHERE code='SBC'),  (SELECT id FROM stations WHERE code='MAS'),  '06:20', '12:15', 340,  150),

  -- Chennai Central <-> Secunderabad
  ('12759', 'Charminar Express',          (SELECT id FROM stations WHERE code='MAS'),  (SELECT id FROM stations WHERE code='SC'),   '17:30', '06:35', 850,  100),
  ('12760', 'Charminar Express',          (SELECT id FROM stations WHERE code='SC'),   (SELECT id FROM stations WHERE code='MAS'),  '18:00', '06:50', 850,  100),

  -- Chennai Central <-> Pune Junction
  ('11074', 'Chennai Central Pune Express', (SELECT id FROM stations WHERE code='MAS'), (SELECT id FROM stations WHERE code='PUNE'), '15:50', '13:20', 1080, 80),
  ('11073', 'Pune Chennai Central Express', (SELECT id FROM stations WHERE code='PUNE'),(SELECT id FROM stations WHERE code='MAS'),  '00:25', '22:15', 1080, 80),

  -- Howrah Junction <-> Secunderabad
  ('12703', 'Falaknuma Express',          (SELECT id FROM stations WHERE code='HWH'),  (SELECT id FROM stations WHERE code='SC'),   '08:35', '09:35', 1220, 90),
  ('12704', 'Falaknuma Express',          (SELECT id FROM stations WHERE code='SC'),   (SELECT id FROM stations WHERE code='HWH'),  '15:55', '17:40', 1220, 90),

  -- Howrah Junction <-> Pune Junction
  ('12130', 'Azad Hind Express',          (SELECT id FROM stations WHERE code='HWH'),  (SELECT id FROM stations WHERE code='PUNE'), '21:55', '06:50', 1350, 85),
  ('12129', 'Azad Hind Express',          (SELECT id FROM stations WHERE code='PUNE'), (SELECT id FROM stations WHERE code='HWH'),  '18:35', '03:55', 1350, 85),

  -- Secunderabad <-> Bengaluru City
  ('12785', 'Secunderabad Bengaluru Express', (SELECT id FROM stations WHERE code='SC'),  (SELECT id FROM stations WHERE code='SBC'), '19:00', '05:50', 720, 90),
  ('12786', 'Bengaluru Secunderabad Express', (SELECT id FROM stations WHERE code='SBC'), (SELECT id FROM stations WHERE code='SC'),  '18:30', '05:20', 720, 90),
  ('12735', 'Garib Rath Express',             (SELECT id FROM stations WHERE code='SC'),  (SELECT id FROM stations WHERE code='SBC'), '20:30', '08:10', 680, 100),
  ('12736', 'Garib Rath Express',             (SELECT id FROM stations WHERE code='SBC'), (SELECT id FROM stations WHERE code='SC'),  '19:15', '06:40', 680, 100),

  -- Bengaluru City <-> Pune Junction
  ('11013', 'Lokmanya Tilak Express',     (SELECT id FROM stations WHERE code='PUNE'), (SELECT id FROM stations WHERE code='SBC'),  '01:10', '21:50', 880,  85),
  ('11014', 'Lokmanya Tilak Express',     (SELECT id FROM stations WHERE code='SBC'),  (SELECT id FROM stations WHERE code='PUNE'), '16:00', '13:05', 880,  85),

  -- Secunderabad <-> Pune Junction
  ('12025', 'Pune Shatabdi Express',      (SELECT id FROM stations WHERE code='SC'),   (SELECT id FROM stations WHERE code='PUNE'), '14:45', '23:10', 1050, 90),
  ('12026', 'Secunderabad Shatabdi',      (SELECT id FROM stations WHERE code='PUNE'), (SELECT id FROM stations WHERE code='SC'),   '06:00', '14:20', 1050, 90)
ON CONFLICT (number) DO UPDATE SET
  name = EXCLUDED.name,
  source_id = EXCLUDED.source_id,
  dest_id = EXCLUDED.dest_id,
  departs = EXCLUDED.departs,
  arrives = EXCLUDED.arrives,
  fare_per_seat = EXCLUDED.fare_per_seat,
  total_seats = EXCLUDED.total_seats;
