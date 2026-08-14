-- Non-destructive local Point Shop seed.
-- Keeps existing users, events, attendances, and other local data intact.

INSERT INTO "providers" (
    id,
    owner_id,
    name,
    address,
    latitude,
    longitude,
    status,
    logo_url,
    store_photo_url
)
SELECT
    '00000000-0000-7000-8000-000000000101',
    id,
    'Koperasi Warga Kompak',
    'Sekretariat RT 04, Jakarta',
    -6.175392,
    106.827153,
    'VERIFIED',
    NULL,
    NULL
FROM "users"
WHERE role = 'ADMIN' AND status = 'ACTIVE'
ORDER BY created_at ASC
LIMIT 1
ON CONFLICT(id) DO UPDATE SET
    owner_id = excluded.owner_id,
    name = excluded.name,
    address = excluded.address,
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    status = excluded.status,
    updated_at = unixepoch() * 1000;

INSERT INTO "rewards" (
    id,
    provider_id,
    name,
    description,
    points_required,
    stock,
    is_featured,
    validity_days,
    type,
    source,
    leaderboard_position,
    status,
    image_url
) VALUES
(
    '00000000-0000-7000-8000-000000000201',
    '00000000-0000-7000-8000-000000000101',
    'Paket Sembako Kompak',
    'Paket berisi beras, minyak goreng, dan gula untuk kebutuhan rumah tangga.',
    500,
    20,
    1,
    7,
    'PRODUCT',
    'POINT_SHOP',
    NULL,
    'ACTIVE',
    NULL
),
(
    '00000000-0000-7000-8000-000000000202',
    '00000000-0000-7000-8000-000000000101',
    'Voucher Belanja Rp25.000',
    'Voucher belanja yang dapat digunakan di Koperasi Warga Kompak.',
    250,
    40,
    1,
    14,
    'VOUCHER',
    'POINT_SHOP',
    NULL,
    'ACTIVE',
    NULL
),
(
    '00000000-0000-7000-8000-000000000203',
    '00000000-0000-7000-8000-000000000101',
    'Laundry Gratis 3 Kg',
    'Layanan laundry reguler maksimal tiga kilogram.',
    300,
    15,
    0,
    10,
    'SERVICE',
    'POINT_SHOP',
    NULL,
    'ACTIVE',
    NULL
),
(
    '00000000-0000-7000-8000-000000000204',
    '00000000-0000-7000-8000-000000000101',
    'Token Listrik Rp20.000',
    'Token listrik prabayar senilai dua puluh ribu rupiah.',
    450,
    25,
    0,
    7,
    'VOUCHER',
    'POINT_SHOP',
    NULL,
    'ACTIVE',
    NULL
),
(
    '00000000-0000-7000-8000-000000000205',
    '00000000-0000-7000-8000-000000000101',
    'Tote Bag Warga',
    'Tote bag kanvas edisi Kompak untuk aktivitas dan belanja harian.',
    200,
    30,
    0,
    30,
    'PRODUCT',
    'POINT_SHOP',
    NULL,
    'ACTIVE',
    NULL
),
(
    '00000000-0000-7000-8000-000000000206',
    '00000000-0000-7000-8000-000000000101',
    'Pemeriksaan Kesehatan Dasar',
    'Pemeriksaan tekanan darah dan konsultasi kesehatan singkat.',
    150,
    12,
    0,
    14,
    'SERVICE',
    'POINT_SHOP',
    NULL,
    'ACTIVE',
    NULL
)
ON CONFLICT(id) DO UPDATE SET
    provider_id = excluded.provider_id,
    name = excluded.name,
    description = excluded.description,
    points_required = excluded.points_required,
    stock = excluded.stock,
    is_featured = excluded.is_featured,
    validity_days = excluded.validity_days,
    type = excluded.type,
    source = excluded.source,
    leaderboard_position = excluded.leaderboard_position,
    status = excluded.status,
    image_url = excluded.image_url,
    updated_at = unixepoch() * 1000;

-- Give active local accounts enough test points without reducing larger balances.
UPDATE "users"
SET
    balance = 2500,
    updated_at = unixepoch() * 1000
WHERE status = 'ACTIVE' AND balance < 2500;
