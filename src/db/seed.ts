import { uuidv7 } from "uuidv7";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to escape strings for SQL
const escapeStr = (str: string | null | undefined) => {
    if (str === null || str === undefined) return "NULL";
    return `'${str.replace(/'/g, "''")}'`;
};

// Helper to get current timestamp in ms
const now = () => Date.now();

// Generate SQL
let sql = `-- Kompak API Database Seed
-- Generated on ${new Date().toISOString()}

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

`;

// 1. Users
const adminId = uuidv7();
const user1Id = uuidv7();
const user2Id = uuidv7();
const user3Id = uuidv7();

sql += `-- 1. Users\n`;
sql += `INSERT INTO "users" (id, name, phone_number, birth_date, email, password, face_embedding_id, balance, leaderboard_points, status, role, created_at, updated_at) VALUES
(${escapeStr(adminId)}, 'Admin User', '081234567890', '1990-01-01', 'admin@kompak.app', 'admin123', 'admin-face-id', 10000, 0, 'ACTIVE', 'ADMIN', ${now()}, ${now()}),
(${escapeStr(user1Id)}, 'John Doe', '081234567891', '1995-05-05', 'john@example.com', 'user123', 'john-face-id', 500, 50, 'ACTIVE', 'CITIZEN', ${now()}, ${now()}),
(${escapeStr(user2Id)}, 'Jane Smith', '081234567892', '1992-02-02', 'jane@example.com', 'user123', 'jane-face-id', 1500, 150, 'ACTIVE', 'CITIZEN', ${now()}, ${now()}),
(${escapeStr(user3Id)}, 'Pending User', '081234567893', '1998-08-08', 'pending@example.com', 'user123', 'pending-face-id', 0, 0, 'PENDING', 'CITIZEN', ${now()}, ${now()});\n`;

// 2. Providers
sql += `\n-- 2. Providers\n`;
const provider1Id = uuidv7();
sql += `INSERT INTO "providers" (id, owner_id, name, address, latitude, longitude, status, created_at, updated_at) VALUES
(${escapeStr(provider1Id)}, ${escapeStr(adminId)}, 'Toko Kompak Makmur', 'Jl. Kebahagiaan No. 1', -6.200000, 106.816666, 'VERIFIED', ${now()}, ${now()});\n`;

// 3. Events
sql += `\n-- 3. Events\n`;
const event1Id = uuidv7();
const event2Id = uuidv7();
const pastEventId = uuidv7();
const oneDayMs = 24 * 60 * 60 * 1000;
const twoHoursMs = 2 * 60 * 60 * 1000;

sql += `INSERT INTO "events" (id, created_by, title, description, event_date, attendance_start_time, attendance_end_time, reward_points, latitude, longitude, radius_meters, status, created_at, updated_at) VALUES
(${escapeStr(event1Id)}, ${escapeStr(adminId)}, 'Kerja Bakti RT 01', 'Membersihkan selokan dan lingkungan sekitar.', ${now() + oneDayMs}, ${now() + oneDayMs - twoHoursMs}, ${now() + oneDayMs + twoHoursMs}, 100, -6.200000, 106.816666, 100, 'PUBLISHED', ${now()}, ${now()}),
(${escapeStr(event2Id)}, ${escapeStr(adminId)}, 'Senam Sehat Bersama', 'Senam pagi di lapangan warga.', ${now() + (oneDayMs * 5)}, ${now() + (oneDayMs * 5) - twoHoursMs}, ${now() + (oneDayMs * 5) + twoHoursMs}, 50, -6.210000, 106.820000, 50, 'PUBLISHED', ${now()}, ${now()}),
(${escapeStr(pastEventId)}, ${escapeStr(adminId)}, 'Rapat Warga Bulanan', 'Rapat bulanan untuk membahas program kerja.', ${now() - (oneDayMs * 30)}, ${now() - (oneDayMs * 30) - twoHoursMs}, ${now() - (oneDayMs * 30) + twoHoursMs}, 25, -6.190000, 106.810000, 150, 'CLOSED', ${now() - (oneDayMs * 35)}, ${now() - (oneDayMs * 35)});\n`;

// 4. Rewards
sql += `\n-- 4. Rewards\n`;
const storeReward1Id = uuidv7();
const storeReward2Id = uuidv7();
const leaderboardReward1Id = uuidv7();

sql += `INSERT INTO "rewards" (id, provider_id, name, points_required, stock, type, source, leaderboard_position, status, created_at, updated_at) VALUES
(${escapeStr(storeReward1Id)}, ${escapeStr(provider1Id)}, 'T-Shirt Kompak', 500, 50, 'PRODUCT', 'POINT_SHOP', NULL, 'ACTIVE', ${now()}, ${now()}),
(${escapeStr(storeReward2Id)}, ${escapeStr(provider1Id)}, 'Coffee Voucher', 150, 100, 'VOUCHER', 'POINT_SHOP', NULL, 'ACTIVE', ${now()}, ${now()}),
(${escapeStr(leaderboardReward1Id)}, ${escapeStr(provider1Id)}, 'Sepeda Gunung', 0, 1, 'PRODUCT', 'LEADERBOARD', 1, 'ACTIVE', ${now()}, ${now()});\n`;

// 5. Attendances
sql += `\n-- 5. Attendances\n`;
const att1Id = uuidv7();
const att2Id = uuidv7();
sql += `INSERT INTO "attendances" (id, user_id, event_id, status, verified_at, created_at, updated_at) VALUES
(${escapeStr(att1Id)}, ${escapeStr(user1Id)}, ${escapeStr(pastEventId)}, 'PRESENT', ${now() - (oneDayMs * 30)}, ${now() - (oneDayMs * 30)}, ${now() - (oneDayMs * 30)}),
(${escapeStr(att2Id)}, ${escapeStr(user2Id)}, ${escapeStr(pastEventId)}, 'PRESENT', ${now() - (oneDayMs * 30)}, ${now() - (oneDayMs * 30)}, ${now() - (oneDayMs * 30)});\n`;

// 6. Event Transactions
sql += `\n-- 6. Event Transactions\n`;
sql += `INSERT INTO "event_transactions" (id, user_id, attendance_id, event_id, points, created_at) VALUES
(${escapeStr(uuidv7())}, ${escapeStr(user1Id)}, ${escapeStr(att1Id)}, ${escapeStr(pastEventId)}, 25, ${now() - (oneDayMs * 30)}),
(${escapeStr(uuidv7())}, ${escapeStr(user2Id)}, ${escapeStr(att2Id)}, ${escapeStr(pastEventId)}, 25, ${now() - (oneDayMs * 30)});\n`;

// 7. Reward Redemptions
sql += `\n-- 7. Reward Redemptions\n`;
sql += `INSERT INTO "reward_redemptions" (id, user_id, reward_id, provider_id, points_spent, status, created_at, updated_at) VALUES
(${escapeStr(uuidv7())}, ${escapeStr(user2Id)}, ${escapeStr(storeReward2Id)}, ${escapeStr(provider1Id)}, 150, 'COMPLETED', ${now() - (oneDayMs * 10)}, ${now() - (oneDayMs * 10)}),
(${escapeStr(uuidv7())}, ${escapeStr(user1Id)}, ${escapeStr(storeReward1Id)}, ${escapeStr(provider1Id)}, 500, 'PENDING', ${now() - (oneDayMs * 2)}, ${now() - (oneDayMs * 2)});\n`;

// 8. Badge Definitions
sql += `\n-- 8. Badge Definitions\n`;
const badge1Id = uuidv7();
sql += `INSERT INTO "badge_definitions" (id, name, description, category, criteria, created_at, updated_at) VALUES
(${escapeStr(badge1Id)}, 'Top 3 Bulan Ini', 'Masuk ke top 3 leaderboard bulanan.', 'LEADERBOARD', 'rank <= 3', ${now()}, ${now()});\n`;

// 9. Badge Awards
sql += `\n-- 9. Badge Awards\n`;
sql += `INSERT INTO "badge_awards" (id, user_id, badge_definition_id, leaderboard_year, leaderboard_period, reason, awarded_by, awarded_at) VALUES
(${escapeStr(uuidv7())}, ${escapeStr(user2Id)}, ${escapeStr(badge1Id)}, 2026, '06', 'Juara 1 Bulan Juni', ${escapeStr(adminId)}, ${now()});\n`;

// 10. Announcements
sql += `\n-- 10. Announcements\n`;
sql += `INSERT INTO "announcements" (id, created_by, title, description, created_at, updated_at) VALUES
(${escapeStr(uuidv7())}, ${escapeStr(adminId)}, 'Selamat Datang di KOMPAK!', 'Mari berpartisipasi dan raih hadiahnya.', ${now()}, ${now()});\n`;

// 11. Notifications
sql += `\n-- 11. Notifications\n`;
sql += `INSERT INTO "notifications" (id, user_id, title, message, type, is_read, created_at, updated_at) VALUES
(${escapeStr(uuidv7())}, ${escapeStr(user1Id)}, 'Akun Disetujui', 'Selamat, akun Anda telah disetujui!', 'ACCOUNT_APPROVED', 0, ${now()}, ${now()});\n`;

// Write to file
const outDir = path.resolve(__dirname, "../../");
const outPath = path.join(outDir, "seed.sql");
fs.writeFileSync(outPath, sql);

console.log(`✅ Seed SQL successfully generated at: ${outPath}`);
console.log(`Run 'npm run db:seed' (which executes wrangler d1 execute) to apply it.`);
