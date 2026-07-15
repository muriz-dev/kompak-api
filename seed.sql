-- Kompak API Database Seed
-- Generated on 2026-07-15T14:08:10.832Z

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
('019f661b-4451-72e2-8683-53edf0733544', 'Admin User', 'admin@kompak.app', 'admin123', 'APPROVED', 'ADMIN', 10000, 0, 1784124490833, 1784124490833),
('019f661b-4451-72e2-8683-53eede8bfe2a', 'John Doe', 'john@example.com', 'user123', 'APPROVED', 'USER', 500, 50, 1784124490833, 1784124490833),
('019f661b-4451-72e2-8683-53ef2798a23c', 'Jane Smith', 'jane@example.com', 'user123', 'APPROVED', 'USER', 1500, 150, 1784124490833, 1784124490833),
('019f661b-4451-72e2-8683-53f0c35b162e', 'Pending User', 'pending@example.com', 'user123', 'PENDING', 'USER', 0, 0, 1784124490833, 1784124490833);

-- 2. Events
INSERT INTO "events" (id, title, description, event_date, attendance_start_time, attendance_end_time, reward_points, latitude, longitude, radius_meters, created_at, updated_at) VALUES
('019f661b-4451-72e2-8683-53f183a47252', 'Annual Company Gathering', 'Yearly gathering for all employees.', 1784210890833, 1784203690833, 1784218090833, 100, -6.200000, 106.816666, 100, 1784124490833, 1784124490833),
('019f661b-4451-72e2-8683-53f23b3596ec', 'Tech Workshop 2026', 'Learn the latest tech stacks.', 1784556490833, 1784549290833, 1784563690833, 50, -6.210000, 106.820000, 50, 1784124490833, 1784124490833),
('019f661b-4451-72e2-8683-53f35391c44f', 'Q1 Townhall', 'Q1 results and updates.', 1781532490833, 1781525290833, 1781539690833, 25, -6.190000, 106.810000, 150, 1781100490833, 1781100490833);

-- 3. Rewards
INSERT INTO "rewards" (id, name, points_required, stock, category, created_at, updated_at) VALUES
('019f661b-4451-72e2-8683-53f44503a8ef', 'T-Shirt Kompak', 500, 50, 'MERCHANDISE', 1784124490833, 1784124490833),
('019f661b-4451-72e2-8683-53f5f8e44381', 'Coffee Voucher', 150, 100, 'VOUCHER', 1784124490833, 1784124490833),
('019f661b-4451-72e2-8683-53f6be13d5fa', 'Mechanical Keyboard', 2000, 5, 'ELECTRONICS', 1784124490833, 1784124490833);

-- 4. Event Item Rewards
INSERT INTO "event_item_rewards" (id, event_id, reward_id, quantity, created_at) VALUES
('019f661b-4451-72e2-8683-53f77f9c667b', '019f661b-4451-72e2-8683-53f183a47252', '019f661b-4451-72e2-8683-53f44503a8ef', 20, 1784124490833),
('019f661b-4451-72e2-8683-53f8a5d6f233', '019f661b-4451-72e2-8683-53f183a47252', '019f661b-4451-72e2-8683-53f5f8e44381', 50, 1784124490833),
('019f661b-4451-72e2-8683-53f99ecd8fba', '019f661b-4451-72e2-8683-53f23b3596ec', '019f661b-4451-72e2-8683-53f5f8e44381', 30, 1784124490833);

-- 5. Attendances
INSERT INTO "attendances" (id, user_id, event_id, verified_at, created_at, updated_at) VALUES
('019f661b-4451-72e2-8683-53faf1132307', '019f661b-4451-72e2-8683-53eede8bfe2a', '019f661b-4451-72e2-8683-53f35391c44f', 1781532490833, 1781532490833, 1781532490833),
('019f661b-4451-72e2-8683-53fbcad7b0fa', '019f661b-4451-72e2-8683-53ef2798a23c', '019f661b-4451-72e2-8683-53f35391c44f', 1781532490833, 1781532490833, 1781532490833);

-- 6. Point Transactions
INSERT INTO "point_transactions" (id, user_id, amount, transaction_type, reference_id, created_at, updated_at) VALUES
('019f661b-4451-72e2-8683-53fc981cddb4', '019f661b-4451-72e2-8683-53eede8bfe2a', 500, 'EARN', '019f661b-4451-72e2-8683-53f35391c44f', 1781532490833, 1781532490833),
('019f661b-4451-72e2-8683-53fda04b8333', '019f661b-4451-72e2-8683-53ef2798a23c', 1500, 'EARN', '019f661b-4451-72e2-8683-53f35391c44f', 1781532490833, 1781532490833);

-- 7. Redemptions
INSERT INTO "redemptions" (id, user_id, reward_id, status, created_at, updated_at) VALUES
('019f661b-4451-72e2-8683-53febe09b7b5', '019f661b-4451-72e2-8683-53ef2798a23c', '019f661b-4451-72e2-8683-53f5f8e44381', 'COMPLETED', 1783260490833, 1783260490833);
