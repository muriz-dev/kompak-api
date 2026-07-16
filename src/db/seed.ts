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

-- 0. Clear existing data (optional, remove if you want to keep data)
DELETE FROM "redemptions";
DELETE FROM "point_transactions";
DELETE FROM "attendances";
DELETE FROM "event_item_rewards";
DELETE FROM "rewards";
DELETE FROM "events";
DELETE FROM "users";

-- 1. Users
`;

// Users
const adminId = uuidv7();
const user1Id = uuidv7();
const user2Id = uuidv7();
const user3Id = uuidv7();

sql += `INSERT INTO "users" (id, name, email, password, status, role, balance, leaderboard_points, created_at, updated_at) VALUES
(${escapeStr(adminId)}, 'Admin User', 'admin@kompak.app', 'admin123', 'APPROVED', 'ADMIN', 10000, 0, ${now()}, ${now()}),
(${escapeStr(user1Id)}, 'John Doe', 'john@example.com', 'user123', 'APPROVED', 'USER', 500, 50, ${now()}, ${now()}),
(${escapeStr(user2Id)}, 'Jane Smith', 'jane@example.com', 'user123', 'APPROVED', 'USER', 1500, 150, ${now()}, ${now()}),
(${escapeStr(user3Id)}, 'Pending User', 'pending@example.com', 'user123', 'PENDING', 'USER', 0, 0, ${now()}, ${now()});
`;

// Events
sql += `\n-- 2. Events\n`;
const event1Id = uuidv7();
const event2Id = uuidv7();
const pastEventId = uuidv7();

const oneDayMs = 24 * 60 * 60 * 1000;
const twoHoursMs = 2 * 60 * 60 * 1000;

sql += `INSERT INTO "events" (id, title, description, event_date, attendance_start_time, attendance_end_time, reward_points, latitude, longitude, radius_meters, created_at, updated_at) VALUES
(${escapeStr(event1Id)}, 'Annual Company Gathering', 'Yearly gathering for all employees.', ${now() + oneDayMs}, ${now() + oneDayMs - twoHoursMs}, ${now() + oneDayMs + twoHoursMs}, 100, -6.200000, 106.816666, 100, ${now()}, ${now()}),
(${escapeStr(event2Id)}, 'Tech Workshop 2026', 'Learn the latest tech stacks.', ${now() + (oneDayMs * 5)}, ${now() + (oneDayMs * 5) - twoHoursMs}, ${now() + (oneDayMs * 5) + twoHoursMs}, 50, -6.210000, 106.820000, 50, ${now()}, ${now()}),
(${escapeStr(pastEventId)}, 'Q1 Townhall', 'Q1 results and updates.', ${now() - (oneDayMs * 30)}, ${now() - (oneDayMs * 30) - twoHoursMs}, ${now() - (oneDayMs * 30) + twoHoursMs}, 25, -6.190000, 106.810000, 150, ${now() - (oneDayMs * 35)}, ${now() - (oneDayMs * 35)});
`;

// Rewards
sql += `\n-- 3. Rewards\n`;
const storeReward1Id = uuidv7();
const storeReward2Id = uuidv7();
const eventReward1Id = uuidv7();
const eventReward2Id = uuidv7();
const leaderboardReward1Id = uuidv7();

sql += `INSERT INTO "rewards" (id, name, points_required, stock, category, created_at, updated_at) VALUES
(${escapeStr(storeReward1Id)}, 'T-Shirt Kompak', 500, 50, 'STORE', ${now()}, ${now()}),
(${escapeStr(storeReward2Id)}, 'Coffee Voucher', 150, 100, 'STORE', ${now()}, ${now()}),
(${escapeStr(eventReward1Id)}, 'Exclusive Pin', 0, 200, 'EVENT', ${now()}, ${now()}),
(${escapeStr(eventReward2Id)}, 'Lunch Box', 0, 50, 'EVENT', ${now()}, ${now()}),
(${escapeStr(leaderboardReward1Id)}, 'Mechanical Keyboard', 2000, 5, 'LEADERBOARD', ${now()}, ${now()});
`;

// Event Item Rewards
sql += `\n-- 4. Event Item Rewards\n`;
sql += `INSERT INTO "event_item_rewards" (id, event_id, reward_id, quantity, created_at) VALUES
(${escapeStr(uuidv7())}, ${escapeStr(event1Id)}, ${escapeStr(eventReward1Id)}, 20, ${now()}),
(${escapeStr(uuidv7())}, ${escapeStr(event1Id)}, ${escapeStr(eventReward2Id)}, 50, ${now()}),
(${escapeStr(uuidv7())}, ${escapeStr(event2Id)}, ${escapeStr(eventReward2Id)}, 30, ${now()});
`;

// Attendances
sql += `\n-- 5. Attendances\n`;
sql += `INSERT INTO "attendances" (id, user_id, event_id, verified_at, created_at, updated_at) VALUES
(${escapeStr(uuidv7())}, ${escapeStr(user1Id)}, ${escapeStr(pastEventId)}, ${now() - (oneDayMs * 30)}, ${now() - (oneDayMs * 30)}, ${now() - (oneDayMs * 30)}),
(${escapeStr(uuidv7())}, ${escapeStr(user2Id)}, ${escapeStr(pastEventId)}, ${now() - (oneDayMs * 30)}, ${now() - (oneDayMs * 30)}, ${now() - (oneDayMs * 30)});
`;

// Redemptions Setup
const redemption1Id = uuidv7();
const redemption2Id = uuidv7();

// Point Transactions
sql += `\n-- 6. Point Transactions\n`;
sql += `INSERT INTO "point_transactions" (id, user_id, amount, transaction_type, reference_id, created_at, updated_at) VALUES
(${escapeStr(uuidv7())}, ${escapeStr(user1Id)}, 500, 'ATTENDANCE_REWARD', ${escapeStr(pastEventId)}, ${now() - (oneDayMs * 30)}, ${now() - (oneDayMs * 30)}),
(${escapeStr(uuidv7())}, ${escapeStr(user2Id)}, 1500, 'ATTENDANCE_REWARD', ${escapeStr(pastEventId)}, ${now() - (oneDayMs * 30)}, ${now() - (oneDayMs * 30)}),
(${escapeStr(uuidv7())}, ${escapeStr(user2Id)}, -150, 'ITEM_REDEEM', ${escapeStr(redemption1Id)}, ${now() - (oneDayMs * 10)}, ${now() - (oneDayMs * 10)}),
(${escapeStr(uuidv7())}, ${escapeStr(user1Id)}, -500, 'ITEM_REDEEM', ${escapeStr(redemption2Id)}, ${now() - (oneDayMs * 2)}, ${now() - (oneDayMs * 2)});
`;

// Redemptions
sql += `\n-- 7. Redemptions\n`;
sql += `INSERT INTO "redemptions" (id, user_id, reward_id, status, created_at, updated_at) VALUES
(${escapeStr(redemption1Id)}, ${escapeStr(user2Id)}, ${escapeStr(storeReward2Id)}, 'COMPLETED', ${now() - (oneDayMs * 10)}, ${now() - (oneDayMs * 10)}),
(${escapeStr(redemption2Id)}, ${escapeStr(user1Id)}, ${escapeStr(storeReward1Id)}, 'PENDING', ${now() - (oneDayMs * 2)}, ${now() - (oneDayMs * 2)});
`;

// Write to file
const outDir = path.resolve(__dirname, "../../");
const outPath = path.join(outDir, "seed.sql");
fs.writeFileSync(outPath, sql);

console.log(`✅ Seed SQL successfully generated at: ${outPath}`);
console.log(`Run 'npm run db:seed' (which executes wrangler d1 execute) to apply it.`);
