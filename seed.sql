-- Kompak API Database Seed
-- Generated on 2026-08-03T03:20:21.506Z

-- 0. Clear existing data
DELETE FROM "notifications";
DELETE FROM "announcements";
DELETE FROM "badge_awards";
DELETE FROM "badge_definitions";
DELETE FROM "reward_redemptions";
DELETE FROM "event_transactions";
DELETE FROM "attendances";
DELETE FROM "rewards";
DELETE FROM "providers";
DELETE FROM "events";
DELETE FROM "users";

-- 1. Users
INSERT INTO "users" (id, name, phone_number, birth_date, email, password, face_embedding_id, balance, leaderboard_points, status, role, created_at, updated_at) VALUES
('019fc5a2-ff02-7d5a-81f4-a5a4cfa86352', 'Admin User', '081234567890', '1990-01-01', 'admin@kompak.app', 'admin123', 'admin-face-id', 10000, 0, 'ACTIVE', 'ADMIN', 1785727221507, 1785727221507),
('019fc5a2-ff03-70a1-8d36-b22a12cd2809', 'John Doe', '081234567891', '1995-05-05', 'john@example.com', 'user123', 'john-face-id', 500, 50, 'ACTIVE', 'CITIZEN', 1785727221507, 1785727221507),
('019fc5a2-ff03-70a1-8d36-b22ba8430cf4', 'Jane Smith', '081234567892', '1992-02-02', 'jane@example.com', 'user123', 'jane-face-id', 1500, 150, 'ACTIVE', 'CITIZEN', 1785727221507, 1785727221507),
('019fc5a2-ff03-70a1-8d36-b22ce9eb8095', 'Pending User', '081234567893', '1998-08-08', 'pending@example.com', 'user123', 'pending-face-id', 0, 0, 'PENDING', 'CITIZEN', 1785727221507, 1785727221507);

-- 2. Providers
INSERT INTO "providers" (id, owner_id, name, address, latitude, longitude, status, created_at, updated_at) VALUES
('019fc5a2-ff03-70a1-8d36-b22d1ec40242', '019fc5a2-ff02-7d5a-81f4-a5a4cfa86352', 'Toko Kompak Makmur', 'Jl. Kebahagiaan No. 1', -6.200000, 106.816666, 'VERIFIED', 1785727221507, 1785727221507);

-- 3. Events
INSERT INTO "events" (id, created_by, title, description, event_date, attendance_start_time, attendance_end_time, reward_points, latitude, longitude, radius_meters, status, created_at, updated_at) VALUES
('019fc5a2-ff03-70a1-8d36-b22ed8f26c0a', '019fc5a2-ff02-7d5a-81f4-a5a4cfa86352', 'Kerja Bakti RT 01', 'Membersihkan selokan dan lingkungan sekitar.', 1785813621507, 1785806421507, 1785820821507, 100, -6.200000, 106.816666, 100, 'PUBLISHED', 1785727221507, 1785727221507),
('019fc5a2-ff03-70a1-8d36-b22f2473f85b', '019fc5a2-ff02-7d5a-81f4-a5a4cfa86352', 'Senam Sehat Bersama', 'Senam pagi di lapangan warga.', 1786159221507, 1786152021507, 1786166421507, 50, -6.210000, 106.820000, 50, 'PUBLISHED', 1785727221507, 1785727221507),
('019fc5a2-ff03-70a1-8d36-b230fc99f0b1', '019fc5a2-ff02-7d5a-81f4-a5a4cfa86352', 'Rapat Warga Bulanan', 'Rapat bulanan untuk membahas program kerja.', 1783135221507, 1783128021507, 1783142421507, 25, -6.190000, 106.810000, 150, 'CLOSED', 1782703221507, 1782703221507);

-- 4. Rewards
INSERT INTO "rewards" (id, provider_id, name, points_required, stock, type, source, leaderboard_position, status, created_at, updated_at) VALUES
('019fc5a2-ff03-70a1-8d36-b23127adf005', '019fc5a2-ff03-70a1-8d36-b22d1ec40242', 'T-Shirt Kompak', 500, 50, 'PRODUCT', 'POINT_SHOP', NULL, 'ACTIVE', 1785727221507, 1785727221507),
('019fc5a2-ff03-70a1-8d36-b232a372b1ec', '019fc5a2-ff03-70a1-8d36-b22d1ec40242', 'Coffee Voucher', 150, 100, 'VOUCHER', 'POINT_SHOP', NULL, 'ACTIVE', 1785727221507, 1785727221507),
('019fc5a2-ff03-70a1-8d36-b2338675a477', '019fc5a2-ff03-70a1-8d36-b22d1ec40242', 'Sepeda Gunung', 0, 1, 'PRODUCT', 'LEADERBOARD', 1, 'ACTIVE', 1785727221507, 1785727221507);

-- 5. Attendances
INSERT INTO "attendances" (id, user_id, event_id, status, verified_at, created_at, updated_at) VALUES
('019fc5a2-ff03-70a1-8d36-b2342baa1278', '019fc5a2-ff03-70a1-8d36-b22a12cd2809', '019fc5a2-ff03-70a1-8d36-b230fc99f0b1', 'PRESENT', 1783135221507, 1783135221507, 1783135221507),
('019fc5a2-ff03-70a1-8d36-b235e0bdf4c9', '019fc5a2-ff03-70a1-8d36-b22ba8430cf4', '019fc5a2-ff03-70a1-8d36-b230fc99f0b1', 'PRESENT', 1783135221507, 1783135221507, 1783135221507);

-- 6. Event Transactions
INSERT INTO "event_transactions" (id, user_id, attendance_id, event_id, points, created_at) VALUES
('019fc5a2-ff03-70a1-8d36-b2368f609e56', '019fc5a2-ff03-70a1-8d36-b22a12cd2809', '019fc5a2-ff03-70a1-8d36-b2342baa1278', '019fc5a2-ff03-70a1-8d36-b230fc99f0b1', 25, 1783135221507),
('019fc5a2-ff03-70a1-8d36-b237f497379d', '019fc5a2-ff03-70a1-8d36-b22ba8430cf4', '019fc5a2-ff03-70a1-8d36-b235e0bdf4c9', '019fc5a2-ff03-70a1-8d36-b230fc99f0b1', 25, 1783135221507);

-- 7. Reward Redemptions
INSERT INTO "reward_redemptions" (id, user_id, reward_id, provider_id, points_spent, status, created_at, updated_at) VALUES
('019fc5a2-ff03-70a1-8d36-b238e0caa1bc', '019fc5a2-ff03-70a1-8d36-b22ba8430cf4', '019fc5a2-ff03-70a1-8d36-b232a372b1ec', '019fc5a2-ff03-70a1-8d36-b22d1ec40242', 150, 'COMPLETED', 1784863221507, 1784863221507),
('019fc5a2-ff03-70a1-8d36-b2390624bf2c', '019fc5a2-ff03-70a1-8d36-b22a12cd2809', '019fc5a2-ff03-70a1-8d36-b23127adf005', '019fc5a2-ff03-70a1-8d36-b22d1ec40242', 500, 'PENDING', 1785554421507, 1785554421507);

-- 8. Badge Definitions
INSERT INTO "badge_definitions" (id, name, description, category, criteria, created_at, updated_at) VALUES
('019fc5a2-ff03-70a1-8d36-b23a6bff6bcc', 'Top 3 Bulan Ini', 'Masuk ke top 3 leaderboard bulanan.', 'LEADERBOARD', 'rank <= 3', 1785727221507, 1785727221507);

-- 9. Badge Awards
INSERT INTO "badge_awards" (id, user_id, badge_definition_id, leaderboard_year, leaderboard_period, reason, awarded_by, awarded_at) VALUES
('019fc5a2-ff03-70a1-8d36-b23b63f1c3f2', '019fc5a2-ff03-70a1-8d36-b22ba8430cf4', '019fc5a2-ff03-70a1-8d36-b23a6bff6bcc', 2026, '06', 'Juara 1 Bulan Juni', '019fc5a2-ff02-7d5a-81f4-a5a4cfa86352', 1785727221507);

-- 10. Announcements
INSERT INTO "announcements" (id, created_by, title, description, created_at, updated_at) VALUES
('019fc5a2-ff03-70a1-8d36-b23c1bfbe21b', '019fc5a2-ff02-7d5a-81f4-a5a4cfa86352', 'Selamat Datang di KOMPAK!', 'Mari berpartisipasi dan raih hadiahnya.', 1785727221507, 1785727221507);

-- 11. Notifications
INSERT INTO "notifications" (id, user_id, title, message, type, is_read, created_at, updated_at) VALUES
('019fc5a2-ff03-70a1-8d36-b23dd16f547f', '019fc5a2-ff03-70a1-8d36-b22a12cd2809', 'Akun Disetujui', 'Selamat, akun Anda telah disetujui!', 'ACCOUNT_APPROVED', 0, 1785727221507, 1785727221507);
