### 1. Core (Prioritas MVP)

Ini adalah fitur-fitur esensial yang membuktikan bahwa inovasi utama Anda (Face Recognition + Gamifikasi) berjalan dengan baik.

**Fitur Core:**
*   **Sistem Presensi Face Recognition:** Validasi kehadiran warga di kegiatan lingkungan (seperti kerja bakti atau rapat) menggunakan pemindaian wajah.
*   **Validasi Kehadiran Berlapis:** *Backend* memvalidasi apakah warga berada dalam radius lokasi acara (Geolokasi) dan melakukan presensi di dalam jendela waktu yang diizinkan (*Time Window*).
*   **Sistem Poin Ganda:** Pemisahan pencatatan antara `balance` (saldo yang bisa dibelanjakan) dan `leaderboard_points` (skor reputasi murni).
*   **Leaderboard Warga:** Papan peringkat tingkat RT/RW secara *real-time* berdasarkan akumulasi poin reputasi untuk memicu kompetisi sehat antar tetangga.

**Alur Kerja (Flow) Core:**
1.  **Flow Presensi & Gamifikasi (End-to-End):**
    *   Warga membuka aplikasi saat tiba di lokasi kerja bakti.
    *   Warga melakukan pemindaian wajah melalui kamera (*Frontend*).
    *   Sistem Face Recognition memproses wajah, mengenali identitas (*face_embedding_id*), dan mengirim data tersebut beserta koordinat warga ke *Backend* Hono.
    *   *Backend* memvalidasi: Apakah wajah terdaftar? Apakah warga belum presensi sebelumnya? Apakah posisi warga ada di radius acara? Apakah acara sedang berlangsung?
    *   Jika semua valid, *Backend* mencatat kehadiran, menyuntikkan poin reputasi, dan menambahkan poin tersebut ke `balance` sekaligus `leaderboard_points` warga.
2.  **Flow Leaderboard:**
    *   Warga membuka halaman Leaderboard di aplikasi.
    *   *Frontend* menarik data dari *Backend*, menampilkan peringkat warga dari skor tertinggi hingga terendah. Peringkat ini tidak akan turun meskipun warga telah menukarkan poinnya untuk berbelanja.

---

### 2. Secondary (Ditunda / Disederhanakan untuk MVP)

Fitur-fitur ini ada dalam rancangan besar dan skema *database*, tetapi logika *backend* dan antarmukanya tidak perlu diselesaikan secara sempurna untuk tenggat waktu 20 Juli.

**Fitur Secondary:**
*   **Toko Poin (Redemptions):** Sistem penukaran poin (`balance`) dengan *reward* fisik (seperti sembako, potongan iuran, atau voucher).
*   **Sistem Refund:** Pembatalan penukaran barang oleh admin dan pengembalian saldo poin ke warga.
*   **Reward Acara Berupa Barang:** Pemberian insentif presensi berupa barang fisik (kategori `EVENT_BONUS`), bukan hanya poin.
*   **Reset Leaderboard Bulanan:** Penghapusan skor papan peringkat secara berkala untuk menentukan "Warga Teladan Bulan Ini".
*   **Autentikasi Penuh (Auth):** Sistem *login* menggunakan JWT/OAuth (saat ini disederhanakan dengan API Key statis).

**Alur Kerja (Flow) Secondary (Implementasi Nanti):**
1.  **Flow Penukaran Barang (Toko Poin):**
    *   Warga membuka halaman Toko Poin dan memilih paket sembako.
    *   Sistem mengecek apakah `balance` warga mencukupi dan stok barang tersedia.
    *   Jika berhasil, saldo `balance` dikurangi (dicatat di `Point_Transactions`), dan status penukaran dicatat di tabel `Redemptions`. Skor `leaderboard_points` tetap aman dan tidak berkurang.
2.  **Flow Reset Leaderboard:**
    *   Pada akhir bulan, admin menekan tombol "Reset Leaderboard" di *dashboard* admin.
    *   *Backend* mengamankan data juara bulan tersebut, mungkin memberikan hadiah ekstra ke saldo mereka, lalu me-reset seluruh `leaderboard_points` semua warga kembali ke angka 0 untuk memulai musim kompetisi baru.