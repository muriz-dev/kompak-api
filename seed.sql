-- Kompak API Database Seed
-- Generated on 2026-08-06T13:34:54.621Z

-- 0. Clear existing data
DELETE FROM "notifications";
DELETE FROM "announcements";
DELETE FROM "leaderboard_distributions";
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
('019fd748-b69e-71af-b151-5b222620292e', 'Admin User', '081234567890', '1990-01-01', 'admin@kompak.app', '$2b$10$GDjTunDObU9YWA4IjlvsreDU0QBGtsY7LGF7di01Jw90wYKGq0K1i', 'admin-face-id', 10000, 0, 'ACTIVE', 'ADMIN', 1786023294728, 1786023294728),
('019fd748-b69e-71af-b151-5b23c4304d0e', 'John Doe', '081234567891', '1995-05-05', 'john@example.com', '$2b$10$gplv4kTo4JuKCZ69Qm7.EuGakWDkTYidA29OqAxouxASWUMvteDqG', 'john-face-id', 500, 50, 'ACTIVE', 'CITIZEN', 1786023294728, 1786023294728),
('019fd748-b69e-71af-b151-5b2456ec8c4d', 'Jane Smith', '081234567892', '1992-02-02', 'jane@example.com', '$2b$10$gplv4kTo4JuKCZ69Qm7.EuGakWDkTYidA29OqAxouxASWUMvteDqG', 'jane-face-id', 1500, 150, 'ACTIVE', 'CITIZEN', 1786023294728, 1786023294728),
('019fd748-b69e-71af-b151-5b25a64a6fab', 'Pending User', '081234567893', '1998-08-08', 'pending@example.com', '$2b$10$gplv4kTo4JuKCZ69Qm7.EuGakWDkTYidA29OqAxouxASWUMvteDqG', 'pending-face-id', 0, 0, 'PENDING', 'CITIZEN', 1786023294728, 1786023294728);

-- 2. Providers
INSERT INTO "providers" (id, owner_id, name, address, latitude, longitude, status, created_at, updated_at) VALUES
('019fd748-b708-7f8c-a6e5-65056407edd8', '019fd748-b69e-71af-b151-5b222620292e', 'Toko Kompak Makmur', 'Jl. Kebahagiaan No. 1', -6.200000, 106.816666, 'VERIFIED', 1786023294728, 1786023294728);

-- 3. Events
INSERT INTO "events" (id, created_by, title, description, event_date, attendance_start_time, attendance_end_time, reward_points, latitude, longitude, radius_meters, status, created_at, updated_at) VALUES
('019fd748-b708-7f8c-a6e5-650625d97f73', '019fd748-b69e-71af-b151-5b222620292e', 'Kerja Bakti RT 01', 'Membersihkan selokan dan lingkungan sekitar.', 1786109694728, 1786102494728, 1786116894728, 100, -6.200000, 106.816666, 100, 'PUBLISHED', 1786023294728, 1786023294728),
('019fd748-b708-7f8c-a6e5-65072bd02b46', '019fd748-b69e-71af-b151-5b222620292e', 'Senam Sehat Bersama', 'Senam pagi di lapangan warga.', 1786455294728, 1786448094728, 1786462494728, 50, -6.210000, 106.820000, 50, 'PUBLISHED', 1786023294728, 1786023294728),
('019fd748-b708-7f8c-a6e5-650813f634ae', '019fd748-b69e-71af-b151-5b222620292e', 'Rapat Warga Bulanan', 'Rapat bulanan untuk membahas program kerja.', 1783431294728, 1783424094728, 1783438494728, 25, -6.190000, 106.810000, 150, 'CLOSED', 1782999294728, 1782999294728);

-- 4. Rewards
INSERT INTO "rewards" (id, provider_id, name, points_required, stock, type, source, leaderboard_position, status, created_at, updated_at) VALUES
('019fd748-b708-7f8c-a6e5-6509812392e2', '019fd748-b708-7f8c-a6e5-65056407edd8', 'T-Shirt Kompak', 500, 50, 'PRODUCT', 'POINT_SHOP', NULL, 'ACTIVE', 1786023294728, 1786023294728),
('019fd748-b708-7f8c-a6e5-650ac5b181e7', '019fd748-b708-7f8c-a6e5-65056407edd8', 'Coffee Voucher', 150, 100, 'VOUCHER', 'POINT_SHOP', NULL, 'ACTIVE', 1786023294728, 1786023294728),
('019fd748-b708-7f8c-a6e5-650b7fed574f', '019fd748-b708-7f8c-a6e5-65056407edd8', 'Sepeda Gunung', 0, 1, 'PRODUCT', 'LEADERBOARD', 1, 'ACTIVE', 1786023294728, 1786023294728);

-- 5. Attendances
INSERT INTO "attendances" (id, user_id, event_id, status, verified_at, created_at, updated_at) VALUES
('019fd748-b708-7f8c-a6e5-650ceaea7303', '019fd748-b69e-71af-b151-5b23c4304d0e', '019fd748-b708-7f8c-a6e5-650813f634ae', 'PRESENT', 1783431294728, 1783431294728, 1783431294728),
('019fd748-b708-7f8c-a6e5-650d6ea0a43e', '019fd748-b69e-71af-b151-5b2456ec8c4d', '019fd748-b708-7f8c-a6e5-650813f634ae', 'PRESENT', 1783431294728, 1783431294728, 1783431294728);

-- 6. Event Transactions
INSERT INTO "event_transactions" (id, user_id, attendance_id, event_id, points, created_at) VALUES
('019fd748-b708-7f8c-a6e5-650ee6bce698', '019fd748-b69e-71af-b151-5b23c4304d0e', '019fd748-b708-7f8c-a6e5-650ceaea7303', '019fd748-b708-7f8c-a6e5-650813f634ae', 25, 1783431294728),
('019fd748-b708-7f8c-a6e5-650f05c76689', '019fd748-b69e-71af-b151-5b2456ec8c4d', '019fd748-b708-7f8c-a6e5-650d6ea0a43e', '019fd748-b708-7f8c-a6e5-650813f634ae', 25, 1783431294728);

-- 7. Reward Redemptions
INSERT INTO "reward_redemptions" (id, user_id, reward_id, provider_id, points_spent, idempotency_key, status, completed_at, expires_at, created_at, updated_at) VALUES
('019fd748-b708-7f8c-a6e5-6510228c6b96', '019fd748-b69e-71af-b151-5b2456ec8c4d', '019fd748-b708-7f8c-a6e5-650ac5b181e7', '019fd748-b708-7f8c-a6e5-65056407edd8', 150, 'seed-redemption-completed', 'COMPLETED', 1785159294728, 1785764094728, 1785159294728, 1785159294728),
('019fd748-b708-7f8c-a6e5-65119651f519', '019fd748-b69e-71af-b151-5b23c4304d0e', '019fd748-b708-7f8c-a6e5-6509812392e2', '019fd748-b708-7f8c-a6e5-65056407edd8', 500, 'seed-redemption-pending', 'PENDING', NULL, 1786455294728, 1785850494728, 1785850494728);

-- 8. Badge Definitions
INSERT INTO "badge_definitions" (id, name, description, category, criteria, created_at, updated_at) VALUES
('019fd748-b708-7f8c-a6e5-6512afafa797', 'Top 3 Bulan Ini', 'Masuk ke top 3 leaderboard bulanan.', 'LEADERBOARD', 'rank <= 3', 1786023294728, 1786023294728);

-- 9. Badge Awards
INSERT INTO "badge_awards" (id, user_id, badge_definition_id, leaderboard_year, leaderboard_period, reason, awarded_by, awarded_at) VALUES
('019fd748-b708-7f8c-a6e5-651364ac5945', '019fd748-b69e-71af-b151-5b2456ec8c4d', '019fd748-b708-7f8c-a6e5-6512afafa797', 2026, '06', 'Juara 1 Bulan Juni', '019fd748-b69e-71af-b151-5b222620292e', 1786023294728);

-- 10. Announcements
INSERT INTO "announcements" (id, created_by, title, description, created_at, updated_at) VALUES
('019fd748-b708-7f8c-a6e5-65146caef57b', '019fd748-b69e-71af-b151-5b222620292e', 'Selamat Datang di KOMPAK!', 'Mari berpartisipasi dan raih hadiahnya.', 1786023294728, 1786023294728);

-- 11. Notifications
INSERT INTO "notifications" (id, user_id, title, message, type, is_read, created_at, updated_at) VALUES
('019fd748-b708-7f8c-a6e5-65159d8f161b', '019fd748-b69e-71af-b151-5b23c4304d0e', 'Akun Disetujui', 'Selamat, akun Anda telah disetujui!', 'ACCOUNT_APPROVED', 0, 1786023294728, 1786023294728);
