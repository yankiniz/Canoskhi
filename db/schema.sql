-- Saha Operasyon Asistani v2 - DB sema (SQLite uyumlu)
-- localStorage yapisi ile 1:1 eslesir. Ileride SQLite'a birebir tasinabilir.

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ad_soyad TEXT NOT NULL,
  telefon TEXT,
  eposta TEXT,
  dogum_tarihi TEXT,          -- YYYY-MM-DD
  dogum_yeri TEXT,
  notlar TEXT,
  durum TEXT DEFAULT 'aktif', -- aktif / iptal / pasif
  musteri_baslangic TEXT,     -- ilk giris yili (YYYY-MM-DD), bos ise ilk policeden hesaplanir
  foto TEXT,                  -- profil fotografi (dataURL)
  created_at TEXT DEFAULT (date('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ad TEXT NOT NULL UNIQUE,    -- orn: BES, Saglik, Konut Kredisi
  kategori TEXT               -- Sigorta / Kredi / Diger
);

CREATE TABLE IF NOT EXISTS customer_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  tutar REAL DEFAULT 0,       -- guncel sozlesme buyuklugu (elementerde son yil fiyati)
  anapara REAL DEFAULT 0,     -- yatirilan sabit anapara (BES vb), guncelleme ile degismez
  guncel_deger REAL DEFAULT 0,-- bugunku deger, istedigin zaman guncellenir
  guncel_tarih TEXT,
  prim_tutar REAL DEFAULT 0,  -- bu isten beklenen prim
  prim_durumu TEXT DEFAULT 'bekleyen', -- bekleyen / hakedis / odenen / iptal
  baslangic_tarihi TEXT,
  bitis_tarihi TEXT,
  durum TEXT DEFAULT 'aktif', -- aktif / pasif / iptal / yenilendi / digerde
  iptal_tarihi TEXT,
  iptal_nedeni TEXT,
  oto_yenile INTEGER DEFAULT 1,  -- 1: her sene bildir, 0: durduruldu (satti/vazgecti)
  yenileme_kaynagi TEXT          -- biz / diger (son yenileme nereden)
);

CREATE TABLE IF NOT EXISTS incomes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kaynak TEXT NOT NULL,       -- Ben Maas / Prim / Es Maas / Diger
  tutar REAL NOT NULL,
  tarih TEXT NOT NULL,        -- YYYY-MM-DD
  aciklama TEXT,
  customer_id INTEGER REFERENCES customers(id),  -- prim hangi musteriden
  cprod_id INTEGER REFERENCES customer_products(id)
);

CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kategori TEXT NOT NULL,     -- Kira / Mutfak / Ulasim / Diger
  tutar REAL NOT NULL,
  tarih TEXT NOT NULL,
  aciklama TEXT
);

CREATE TABLE IF NOT EXISTS reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  baslik TEXT NOT NULL,
  tarih TEXT,                 -- YYYY-MM-DD (dogum gunu veya gorev tarihi)
  tip TEXT DEFAULT 'is',      -- dogumgunu / is / ozel
  oncelik TEXT DEFAULT 'normal', -- acil / onemli / normal
  customer_id INTEGER REFERENCES customers(id),
  tamamlandi INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  baslik TEXT,
  icerik TEXT,
  tip TEXT DEFAULT 'sahsi',   -- sahsi / is
  customer_id INTEGER REFERENCES customers(id),
  tarih TEXT,
  created_at TEXT DEFAULT (date('now'))
);

CREATE TABLE IF NOT EXISTS mail_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER REFERENCES customers(id),
  eposta TEXT NOT NULL,
  konu TEXT,
  icerik TEXT,
  tarih TEXT,
  durum TEXT DEFAULT 'taslak' -- taslak / gonderildi (mailto ile acildi)
);

CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  ad TEXT NOT NULL,             -- orn: Kimlik fotokopisi, Ikametgah
  tip TEXT DEFAULT 'diger',     -- kimlik / ikametgah / sozlesme / diger
  tarih TEXT,
  notlar TEXT,
  dosya_ad TEXT,                -- yuklenen dosya adi
  dosya_tip TEXT,               -- mime (image/pdf)
  dosya_veri TEXT               -- kucuk dosyalar icin dataURL; buyukse bos + harici arsiv notu
);

-- SAHSI ISLER
CREATE TABLE IF NOT EXISTS savings_goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ad TEXT NOT NULL,             -- orn: Tatil, Araba pesinati
  tip TEXT DEFAULT 'hedef',     -- hedef / borc / alacak
  kisi TEXT,                    -- borc/alacakta karsi taraf
  hedef_tutar REAL DEFAULT 0,   -- hedefte hedef, borcta toplam borc
  biriken REAL DEFAULT 0,       -- hedefte biriken, borcta odenen
  tarih TEXT,                   -- hedef tarihi / vade
  notlar TEXT
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ad TEXT NOT NULL,             -- orn: Aidat, Netflix, Elektrik
  tutar REAL DEFAULT 0,
  odeme_gunu INTEGER DEFAULT 1,-- ayin kaci
  periyot TEXT DEFAULT 'aylik', -- aylik / yillik
  kategori TEXT,
  aktif INTEGER DEFAULT 1,
  son_odeme TEXT
);

CREATE TABLE IF NOT EXISTS special_days (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ad TEXT NOT NULL,             -- orn: Evlilik yildonumu, Annem dogum gunu
  tarih TEXT NOT NULL,          -- YYYY-MM-DD (yillikta gun/ay kullanilir)
  tip TEXT DEFAULT 'diger',     -- evlilik / aile / saglik / arac / diger
  tekrar TEXT DEFAULT 'yillik', -- yillik / tek
  oncelik TEXT DEFAULT 'normal', -- acil / onemli / normal
  tamamlandi INTEGER DEFAULT 0,
  notlar TEXT
);

CREATE TABLE IF NOT EXISTS personal_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  baslik TEXT NOT NULL,
  tarih TEXT,
  oncelik TEXT DEFAULT 'normal',-- normal / onemli / acil
  tamamlandi INTEGER DEFAULT 0
);

-- Hizli bakislar
-- Musteri toplam tutar: SELECT c.ad_soyad, SUM(cp.tutar) FROM customers c LEFT JOIN customer_products cp ON cp.customer_id=c.id GROUP BY c.id;
-- Aylik gelir-gider: SELECT strftime('%Y-%m', tarih) AS ay, SUM(tutar) FROM incomes GROUP BY ay;
