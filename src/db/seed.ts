import { uuidv7 } from "uuidv7";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to escape strings for SQL
const escapeStr = (str: string | number | null | undefined) => {
    if (str === null || str === undefined) return "NULL";
    if (typeof str === "number") return str;
    return `'${String(str).replace(/'/g, "''")}'`;
};

// Time helpers
const now = () => Date.now();
const days = (n: number) => n * 24 * 60 * 60 * 1000;
const hours = (n: number) => n * 60 * 60 * 1000;

let sql = `-- Kompak API Database Seed (Extended)
-- Generated on ${new Date().toISOString()}

PRAGMA foreign_keys = OFF;
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
PRAGMA foreign_keys = ON;

`;

const adminHash = bcrypt.hashSync('admin123', 10);
const userHash = bcrypt.hashSync('user123', 10);

// --- 1. Users ---
sql += `-- 1. Users\n`;
const users: any[] = [];
const adminId = uuidv7();
users.push({ id: adminId, name: 'Admin Pusat', phone: '0811000000', email: 'admin@kompak.app', role: 'ADMIN', status: 'ACTIVE', bal: 10000, lp: 0 });

const citizenNames = [
    'Budi Santoso', 'Siti Aminah', 'Andi Pratama', 'Dewi Lestari', 'Agus Setiawan', 
    'Ayu Wandira', 'Hendra Gunawan', 'Rini Yulianti', 'Iwan Fals', 'Maya Sari', 
    'Reza Rahadian', 'Dina Mariana', 'Fajar Sidik', 'Eka Putra', 'Rina Nose', 
    'Tono Suprapto', 'Sari Nila', 'Gilang Dirga', 'Nadia Vega', 'Putra Siregar'
];

for (let i = 0; i < citizenNames.length; i++) {
    const isActive = i < 16; // 16 active, 4 pending
    users.push({
        id: uuidv7(),
        name: citizenNames[i],
        phone: `08120000${String(i).padStart(2, '0')}`,
        email: `citizen${i + 1}@example.com`,
        role: 'CITIZEN',
        status: isActive ? 'ACTIVE' : 'PENDING',
        bal: isActive ? 10000 : 0,
        lp: isActive ? Math.floor(Math.random() * 500) : 0
    });
}

sql += `INSERT INTO "users" (id, name, phone_number, birth_date, email, password, face_embedding_id, balance, leaderboard_points, status, role, created_at, updated_at) VALUES\n`;
sql += users.map(u => `(${escapeStr(u.id)}, ${escapeStr(u.name)}, ${escapeStr(u.phone)}, '1990-01-01', ${escapeStr(u.email)}, ${escapeStr(u.id === adminId ? adminHash : userHash)}, 'face-${u.id}', ${u.bal}, ${u.lp}, ${escapeStr(u.status)}, ${escapeStr(u.role)}, ${now()}, ${now()})`).join(',\n') + ';\n';

// --- 2. Providers ---
sql += `\n-- 2. Providers\n`;
const providers = [
    { id: uuidv7(), name: 'Toko Makmur Jaya', address: 'Jl. Sudirman No.10', lat: -6.200, lng: 106.816, status: 'VERIFIED' },
    { id: uuidv7(), name: 'Warkop Berkah', address: 'Jl. Thamrin No.5', lat: -6.190, lng: 106.820, status: 'VERIFIED' },
    { id: uuidv7(), name: 'Klinik Sehat', address: 'Jl. Gatot Subroto No.8', lat: -6.230, lng: 106.830, status: 'VERIFIED' },
    { id: uuidv7(), name: 'Warung Bu Ani', address: 'Jl. Kemang Raya No.12', lat: -6.260, lng: 106.810, status: 'PENDING' },
    { id: uuidv7(), name: 'Toko Buku Pintar', address: 'Jl. Melawai No.3', lat: -6.240, lng: 106.800, status: 'VERIFIED' }
];

sql += `INSERT INTO "providers" (id, owner_id, name, address, latitude, longitude, status, created_at, updated_at) VALUES\n`;
sql += providers.map(p => `(${escapeStr(p.id)}, ${escapeStr(adminId)}, ${escapeStr(p.name)}, ${escapeStr(p.address)}, ${p.lat}, ${p.lng}, ${escapeStr(p.status)}, ${now()}, ${now()})`).join(',\n') + ';\n';

// --- 3. Events ---
sql += `\n-- 3. Events\n`;
const eventData = [
    { title: 'Kerja Bakti RT 01', offset: -10, status: 'CLOSED', points: 100 },
    { title: 'Senam Pagi Bersama', offset: -5, status: 'CLOSED', points: 50 },
    { title: 'Rapat Warga Bulanan', offset: -2, status: 'CLOSED', points: 25 },
    { title: 'Lomba 17-an', offset: -1, status: 'CLOSED', points: 150 },
    { title: 'Penyuluhan Kesehatan', offset: 0, status: 'PUBLISHED', points: 75 },
    { title: 'Vaksinasi Massal', offset: 1, status: 'PUBLISHED', points: 200 },
    { title: 'Bazar Murah Warga', offset: 3, status: 'PUBLISHED', points: 50 },
    { title: 'Pemilihan Ketua RT', offset: 5, status: 'PUBLISHED', points: 100 },
    { title: 'Donor Darah Rutin', offset: 7, status: 'PUBLISHED', points: 150 },
    { title: 'Pelatihan UMKM', offset: 10, status: 'PUBLISHED', points: 80 },
    { title: 'Jalan Sehat Keluarga', offset: 14, status: 'PUBLISHED', points: 100 },
    { title: 'Siskamling Akbar', offset: 20, status: 'DRAFT', points: 50 },
    { title: 'Renovasi Posyandu', offset: 25, status: 'DRAFT', points: 300 },
    { title: 'Festival Budaya Lokal', offset: 30, status: 'DRAFT', points: 250 },
    { title: 'Lomba Masak Antar RT', offset: 2, status: 'CANCELLED', points: 100 },
];

const events = eventData.map(e => ({
    id: uuidv7(),
    title: e.title,
    desc: 'Deskripsi panjang untuk ' + e.title + '. Kegiatan ini sangat bermanfaat bagi warga sekitar.',
    date: now() + days(e.offset),
    pts: e.points,
    lat: -6.200 + (Math.random() * 0.05),
    lng: 106.816 + (Math.random() * 0.05),
    status: e.status
}));

sql += `INSERT INTO "events" (id, created_by, title, description, event_date, attendance_start_time, attendance_end_time, reward_points, latitude, longitude, radius_meters, status, created_at, updated_at) VALUES\n`;
sql += events.map(e => `(${escapeStr(e.id)}, ${escapeStr(adminId)}, ${escapeStr(e.title)}, ${escapeStr(e.desc)}, ${e.date}, ${e.date - hours(2)}, ${e.date + hours(4)}, ${e.pts}, ${e.lat}, ${e.lng}, 150, ${escapeStr(e.status)}, ${now()}, ${now()})`).join(',\n') + ';\n';

// --- 4. Rewards ---
sql += `\n-- 4. Rewards\n`;
const rewardData = [
    { pIdx: 0, name: 'Voucher Sembako 50rb', pts: 500, stock: 20, type: 'VOUCHER', src: 'POINT_SHOP' },
    { pIdx: 0, name: 'Beras 5kg', pts: 1000, stock: 10, type: 'PRODUCT', src: 'POINT_SHOP' },
    { pIdx: 1, name: 'Kopi Gratis', pts: 100, stock: 50, type: 'VOUCHER', src: 'POINT_SHOP' },
    { pIdx: 1, name: 'Indomie Goreng + Telur', pts: 150, stock: 30, type: 'PRODUCT', src: 'POINT_SHOP' },
    { pIdx: 2, name: 'Cek Tensi Gratis', pts: 200, stock: 100, type: 'SERVICE', src: 'POINT_SHOP' },
    { pIdx: 2, name: 'Vitamin C 1 Botol', pts: 350, stock: 15, type: 'PRODUCT', src: 'POINT_SHOP' },
    { pIdx: 4, name: 'Buku Tulis 1 Lusin', pts: 250, stock: 40, type: 'PRODUCT', src: 'POINT_SHOP' },
    { pIdx: 4, name: 'Pensil Warna', pts: 150, stock: 25, type: 'PRODUCT', src: 'POINT_SHOP' },
    { pIdx: 0, name: 'TV LED 32 Inch', pts: 0, stock: 1, type: 'PRODUCT', src: 'LEADERBOARD', pos: 1 },
    { pIdx: 0, name: 'Sepeda Lipat', pts: 0, stock: 1, type: 'PRODUCT', src: 'LEADERBOARD', pos: 2 },
    { pIdx: 0, name: 'Rice Cooker', pts: 0, stock: 1, type: 'PRODUCT', src: 'LEADERBOARD', pos: 3 },
    { pIdx: 0, name: 'Kipas Angin', pts: 0, stock: 1, type: 'PRODUCT', src: 'LEADERBOARD', pos: 4 },
];

const rewards = rewardData.map(r => ({
    id: uuidv7(),
    providerId: providers[r.pIdx].id,
    name: r.name,
    pts: r.pts,
    stock: r.stock,
    type: r.type,
    src: r.src,
    pos: r.pos || null
}));

sql += `INSERT INTO "rewards" (id, provider_id, name, points_required, stock, type, source, leaderboard_position, status, created_at, updated_at) VALUES\n`;
sql += rewards.map(r => `(${escapeStr(r.id)}, ${escapeStr(r.providerId)}, ${escapeStr(r.name)}, ${r.pts}, ${r.stock}, ${escapeStr(r.type)}, ${escapeStr(r.src)}, ${escapeStr(r.pos)}, 'ACTIVE', ${now()}, ${now()})`).join(',\n') + ';\n';

// --- 5. Attendances & 6. Transactions ---
sql += `\n-- 5. Attendances & 6. Event Transactions\n`;
const attendances: any[] = [];
const transactions: any[] = [];

const closedEvents = events.filter(e => e.status === 'CLOSED');
const activeUsers = users.filter(u => u.status === 'ACTIVE' && u.role === 'CITIZEN');

closedEvents.forEach(evt => {
    // Random 8-15 users attend each past event
    const shuffled = [...activeUsers].sort(() => 0.5 - Math.random());
    const attendees = shuffled.slice(0, 8 + Math.floor(Math.random() * 7));
    
    attendees.forEach(u => {
        const attId = uuidv7();
        attendances.push(`(${escapeStr(attId)}, ${escapeStr(u.id)}, ${escapeStr(evt.id)}, 'PRESENT', ${evt.date}, ${evt.date}, ${evt.date})`);
        transactions.push(`(${escapeStr(uuidv7())}, ${escapeStr(u.id)}, ${escapeStr(attId)}, ${escapeStr(evt.id)}, ${evt.pts}, ${evt.date})`);
    });
});

if (attendances.length > 0) {
    sql += `INSERT INTO "attendances" (id, user_id, event_id, status, verified_at, created_at, updated_at) VALUES\n${attendances.join(',\n')};\n`;
    sql += `INSERT INTO "event_transactions" (id, user_id, attendance_id, event_id, points, created_at) VALUES\n${transactions.join(',\n')};\n`;
}

// --- 7. Reward Redemptions ---
sql += `\n-- 7. Reward Redemptions\n`;
const redemptions: any[] = [];
const shopRewards = rewards.filter(r => r.src === 'POINT_SHOP');

activeUsers.slice(0, 12).forEach((u, i) => {
    const rew = shopRewards[i % shopRewards.length];
    const statuses = ['PENDING', 'COMPLETED', 'REJECTED', 'CANCELLED'];
    const status = statuses[i % statuses.length];
    
    const created = now() - days(Math.random() * 10);
    redemptions.push(`(${escapeStr(uuidv7())}, ${escapeStr(u.id)}, ${escapeStr(rew.id)}, ${escapeStr(rew.providerId)}, ${rew.pts}, 'red-${uuidv7()}', ${escapeStr(status)}, ${status === 'COMPLETED' ? created + hours(2) : 'NULL'}, ${created + days(7)}, ${created}, ${created})`);
});

sql += `INSERT INTO "reward_redemptions" (id, user_id, reward_id, provider_id, points_spent, idempotency_key, status, completed_at, expires_at, created_at, updated_at) VALUES\n${redemptions.join(',\n')};\n`;

// --- 8 & 9. Badges ---
sql += `\n-- 8. Badge Definitions\n`;
const badge1 = uuidv7();
const badge2 = uuidv7();
sql += `INSERT INTO "badge_definitions" (id, name, description, category, criteria, created_at, updated_at) VALUES
(${escapeStr(badge1)}, 'Top 3 Bulan Lalu', 'Masuk ke top 3 leaderboard.', 'LEADERBOARD', 'rank <= 3', ${now()}, ${now()}),
(${escapeStr(badge2)}, 'Warga Aktif', 'Hadir di 5 event berturut-turut.', 'EVENT', 'attendance_count >= 5', ${now()}, ${now()});\n`;

sql += `\n-- 9. Badge Awards\n`;
sql += `INSERT INTO "badge_awards" (id, user_id, badge_definition_id, leaderboard_year, leaderboard_period, reason, awarded_by, awarded_at) VALUES
(${escapeStr(uuidv7())}, ${escapeStr(activeUsers[0].id)}, ${escapeStr(badge1)}, 2026, '06', 'Juara 1', ${escapeStr(adminId)}, ${now() - days(10)}),
(${escapeStr(uuidv7())}, ${escapeStr(activeUsers[1].id)}, ${escapeStr(badge1)}, 2026, '06', 'Juara 2', ${escapeStr(adminId)}, ${now() - days(10)}),
(${escapeStr(uuidv7())}, ${escapeStr(activeUsers[2].id)}, ${escapeStr(badge2)}, NULL, NULL, 'Sangat rajin!', ${escapeStr(adminId)}, ${now() - days(2)});\n`;

// --- 10 & 11. Announcements & Notifications ---
sql += `\n-- 10. Announcements\n`;
sql += `INSERT INTO "announcements" (id, created_by, title, description, created_at, updated_at) VALUES
(${escapeStr(uuidv7())}, ${escapeStr(adminId)}, 'Selamat Datang di KOMPAK!', 'Mari berpartisipasi dalam event warga.', ${now() - days(5)}, ${now() - days(5)}),
(${escapeStr(uuidv7())}, ${escapeStr(adminId)}, 'Pemeliharaan Sistem', 'Aplikasi akan tidak bisa diakses pada tengah malam.', ${now() - hours(2)}, ${now() - hours(2)}),
(${escapeStr(uuidv7())}, ${escapeStr(adminId)}, 'Pengumuman Pemenang Bulan Ini', 'Selamat kepada para peraih posisi Top 3!', ${now() - days(1)}, ${now() - days(1)});\n`;

sql += `\n-- 11. Notifications\n`;
sql += `INSERT INTO "notifications" (id, user_id, title, message, type, is_read, created_at, updated_at) VALUES
(${escapeStr(uuidv7())}, ${escapeStr(activeUsers[0].id)}, 'Poin Bertambah', 'Anda mendapat 100 poin dari Kerja Bakti.', 'EVENT_REWARD', 0, ${now()}, ${now()}),
(${escapeStr(uuidv7())}, ${escapeStr(activeUsers[1].id)}, 'Redemption Sukses', 'Barang Anda bisa diambil di toko Makmur Jaya.', 'REDEMPTION_COMPLETED', 1, ${now() - days(1)}, ${now() - days(1)}),
(${escapeStr(uuidv7())}, ${escapeStr(activeUsers[2].id)}, 'Event Dibatalkan', 'Mohon maaf Lomba Masak dibatalkan.', 'EVENT_CANCELLED', 0, ${now() - hours(12)}, ${now() - hours(12)});\n`;

const outDir = path.resolve(__dirname, "../../");
const outPath = path.join(outDir, "seed.sql");
fs.writeFileSync(outPath, sql);

console.log(`✅ Seed SQL successfully generated with massive data at: ${outPath}`);
