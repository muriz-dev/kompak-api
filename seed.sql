-- Kompak API Database Seed
-- Generated on 2026-07-16T14:56:07.184Z

-- 0. Clear existing data (optional, remove if you want to keep data)
DELETE FROM "redemptions";
DELETE FROM "point_transactions";
DELETE FROM "attendances";
DELETE FROM "event_item_rewards";
DELETE FROM "rewards";
DELETE FROM "events";
DELETE FROM "users";

-- 1. Users
INSERT INTO "users" (id, name, email, password, status, role, balance, leaderboard_points, created_at, updated_at) VALUES
('019f6b6d-8412-7991-803e-973eaf198ee8', 'Admin User', 'admin@kompak.app', 'admin123', 'APPROVED', 'ADMIN', 10000, 0, 1784213767187, 1784213767187),
('019f6b6d-8413-771b-a76a-e85fed2ca845', 'John Doe', 'john@example.com', 'user123', 'APPROVED', 'USER', 500, 50, 1784213767187, 1784213767187),
('019f6b6d-8413-771b-a76a-e86025f315d5', 'Jane Smith', 'jane@example.com', 'user123', 'APPROVED', 'USER', 1500, 150, 1784213767187, 1784213767187),
('019f6b6d-8413-771b-a76a-e8613f5cb2ce', 'Pending User', 'pending@example.com', 'user123', 'PENDING', 'USER', 0, 0, 1784213767187, 1784213767187);

-- 2. Events
INSERT INTO "events" (id, title, description, event_date, attendance_start_time, attendance_end_time, reward_points, latitude, longitude, radius_meters, created_at, updated_at) VALUES
('019f6b6d-8413-771b-a76a-e862d2cd1310', 'Annual Company Gathering', 'Yearly gathering for all employees.', 1784300167187, 1784292967187, 1784307367187, 100, -6.200000, 106.816666, 100, 1784213767187, 1784213767187),
('019f6b6d-8413-771b-a76a-e8633a61e202', 'Tech Workshop 2026', 'Learn the latest tech stacks.', 1784645767187, 1784638567187, 1784652967187, 50, -6.210000, 106.820000, 50, 1784213767187, 1784213767187),
('019f6b6d-8413-771b-a76a-e864e4a51608', 'Q1 Townhall', 'Q1 results and updates.', 1781621767187, 1781614567187, 1781628967187, 25, -6.190000, 106.810000, 150, 1781189767187, 1781189767187);

-- 3. Rewards
INSERT INTO "rewards" (id, name, points_required, stock, category, created_at, updated_at) VALUES
('019f6b6d-8413-771b-a76a-e8658f21b710', 'T-Shirt Kompak', 500, 50, 'STORE', 1784213767187, 1784213767187),
('019f6b6d-8413-771b-a76a-e86604a614a3', 'Coffee Voucher', 150, 100, 'STORE', 1784213767187, 1784213767187),
('019f6b6d-8413-771b-a76a-e86761981209', 'Exclusive Pin', 0, 200, 'EVENT', 1784213767187, 1784213767187),
('019f6b6d-8413-771b-a76a-e868b0599aef', 'Lunch Box', 0, 50, 'EVENT', 1784213767187, 1784213767187),
('019f6b6d-8413-771b-a76a-e869848f32c7', 'Mechanical Keyboard', 2000, 5, 'LEADERBOARD', 1784213767187, 1784213767187);

-- 4. Event Item Rewards
INSERT INTO "event_item_rewards" (id, event_id, reward_id, quantity, created_at) VALUES
('019f6b6d-8413-771b-a76a-e86a10e019d7', '019f6b6d-8413-771b-a76a-e862d2cd1310', '019f6b6d-8413-771b-a76a-e86761981209', 20, 1784213767187),
('019f6b6d-8413-771b-a76a-e86b5669677c', '019f6b6d-8413-771b-a76a-e862d2cd1310', '019f6b6d-8413-771b-a76a-e868b0599aef', 50, 1784213767187),
('019f6b6d-8413-771b-a76a-e86c59c01535', '019f6b6d-8413-771b-a76a-e8633a61e202', '019f6b6d-8413-771b-a76a-e868b0599aef', 30, 1784213767187);

-- 5. Attendances
INSERT INTO "attendances" (id, user_id, event_id, verified_at, created_at, updated_at) VALUES
('019f6b6d-8413-771b-a76a-e86d36606990', '019f6b6d-8413-771b-a76a-e85fed2ca845', '019f6b6d-8413-771b-a76a-e864e4a51608', 1781621767187, 1781621767187, 1781621767187),
('019f6b6d-8413-771b-a76a-e86e7cb44f65', '019f6b6d-8413-771b-a76a-e86025f315d5', '019f6b6d-8413-771b-a76a-e864e4a51608', 1781621767187, 1781621767187, 1781621767187);

-- 6. Point Transactions
INSERT INTO "point_transactions" (id, user_id, amount, transaction_type, reference_id, created_at, updated_at) VALUES
('019f6b6d-8413-771b-a76a-e87153de3ba1', '019f6b6d-8413-771b-a76a-e85fed2ca845', 500, 'ATTENDANCE_REWARD', '019f6b6d-8413-771b-a76a-e864e4a51608', 1781621767187, 1781621767187),
('019f6b6d-8413-771b-a76a-e87261d3412f', '019f6b6d-8413-771b-a76a-e86025f315d5', 1500, 'ATTENDANCE_REWARD', '019f6b6d-8413-771b-a76a-e864e4a51608', 1781621767187, 1781621767187),
('019f6b6d-8413-771b-a76a-e873781fa8ee', '019f6b6d-8413-771b-a76a-e86025f315d5', -150, 'ITEM_REDEEM', '019f6b6d-8413-771b-a76a-e86f7dcbe811', 1783349767187, 1783349767187),
('019f6b6d-8413-771b-a76a-e874403263dd', '019f6b6d-8413-771b-a76a-e85fed2ca845', -500, 'ITEM_REDEEM', '019f6b6d-8413-771b-a76a-e870143f2ee8', 1784040967187, 1784040967187);

-- 7. Redemptions
INSERT INTO "redemptions" (id, user_id, reward_id, status, created_at, updated_at) VALUES
('019f6b6d-8413-771b-a76a-e86f7dcbe811', '019f6b6d-8413-771b-a76a-e86025f315d5', '019f6b6d-8413-771b-a76a-e86604a614a3', 'COMPLETED', 1783349767187, 1783349767187),
('019f6b6d-8413-771b-a76a-e870143f2ee8', '019f6b6d-8413-771b-a76a-e85fed2ca845', '019f6b6d-8413-771b-a76a-e8658f21b710', 'PENDING', 1784040967187, 1784040967187);
