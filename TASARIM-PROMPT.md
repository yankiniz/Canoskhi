# ChatGPT Tasarım Promptu — Canoskhi (kopyala-yapıştır)

> Aşağıdaki satırdan itibaren kopyala:

---

# ROL
Sen uzman bir mobil UI tasarımcısısın (Apple Human Interface Guidelines + modern fintech estetiği). Sana mevcut bir web uygulaması veriyorum. SADECE görünümü (HTML yapısı + CSS) yenileyeceksin. JavaScript mantığına DOKUNMAYACAKSIN.

# PROJE: CANOSKHI
Kişisel saha operasyon asistanı: sigortacının müşteri takibi + kendi gelir-gideri + özel hayatı (notlar, abonelikler, hedefler, takvim) tek uygulamada. Dil: Türkçe. Kullanıcı: iPhone + PC. Maskot: "Cano" — siyah hayalet, gökkuşağı vizör gözlüklü, gülümseyen (SVG dosyası mevcut, değiştirme).

# TEKNİK SINIRLAR (KESİN KURALLAR)
1. Build yok, framework yok, npm yok. Sadece 3 dosya: `index.html`, `css/style.css`, `js/*.js` (JS dosyalarına HİÇ dokunma).
2. İnternet OLMADAN da uygulama açılmalı. Google Fonts kullanabilirsin ama `font-family` listesinde mutlaka sistem fontu yedeği olsun.
3. Aşağıdaki element ID'lerinin TAMAMI aynı kalmalı (JS bunlara bağlı, biri değişirse uygulama bozulur): todayLine, greetLine, cloudDot, agendaList, riskLine, sumIncome, sumExpense, sumBalance, birthdayList, expiryList, sdayList, subList, reminderList, search, custCount, customerList, fMaas, fPrim, fEs, phAy, phDurum, phBar, pBekleyen, pHakedis, pIptal, rBiz, rDiger, rYaklasan, financeList, chart, notesList, calMonth, calGrid, goalList, subManage, sdayManage, staskList, cloudStatus, importFile, modal, modalTitle, modalBody, detail, detailTitle, detailBody, printArea. Sekme bölümleri: tab-gunum, tab-musteriler, tab-finans, tab-notlar, tab-takvim, tab-sahsi, tab-ayarlar. Sekme butonları: `nav` içinde `data-tab` attribute'lu `button`lar, aktif olanda `class="active"`, bölümlerde aktif olanda `class="tab active"`.
4. JS'nin ürettiği class'lar aynen stillenmeli: .card, .badge, .pb, .pb-acil, .pb-onemli, .pb-normal, .line, .cell, .today, .empty, .bars, .bar-group, .bar, .in, .out, .thumb, .photo, .prog, .agenda (+li.head), .quick, .modal, .modal-box, .wide, .modal-actions, .primary, .danger, .cal, .hidden, .tab.
5. Yazdırma (PDF) stilleri `@media print` içinde korunmalı: ekranda `#printArea` gizli, yazdırırken sadece o görünür.
6. localStorage ve Supabase senkronuna dokunma.

# TASARIM DİLİ
- Apple "liquid glass": buzlu cam kartlar (backdrop-filter blur + saturate), ince beyaz iç çizgi (inset highlight), yumuşak derin gölgeler, 20-28px köşe yuvarlaklığı.
- Renkler: zemin açık gri (#EDEFF3), mürekkep siyahı (#141414), vurgu lime (#C8F04B), poster sarısı (#FFD60A), alarm kırmızısı (#FF3B30). Koyu yüzeyler neredeyse siyah (#161616).
- Fontlar: başlıklar "Titan One" (poster, tombul), gövde ve rakamlar "Baloo 2" (yuvarlak). İkisi de Google Fonts'ta, Türkçe karakterli.
- iPhone öncelikli: içerik max 480px ortalı sütun, alt kenar güvenli alan (env/safe-area), min 44px dokunma hedefi, alt menü yüzen hap.
- Referans his: koyu hap alt menü (aktif sekme lime hap olur + ikon yaylanır), selamlama kartı (koyu zeminde sarı başlık + maskot), renkli durum hapları (Acil kırmızı / Önemli amber / Normal gri), koyu "radar" özet kartı.

# EKRANLAR (7 sekme, hepsi tek sayfada, sekmeyle geçiliyor)
1. GÜNÜM: selamlama kartı (maskot + saate göre Günaydın/İyi günler) → "Bugünün Öncelikleri" gruplu liste (Gecikenler/Acil/Önemli/Normal başlıklı) → koyu radar kartı → gelir/gider/bakiye kartları → hızlı işlem hap butonları → doğum günleri, vade, özel gün, abonelik, hatırlatma listeleri.
2. MÜŞTERİLER: filtre hapları (Aktif/İptal/Tümü/Liste PDF) + hap arama + müşteri kartları (fotoğraf, isim, segment rozeti Standart/Gümüş/Gold/Private, toplam tutar, ürünler). Kart detayı modal pencerede açılır: fotoğraf, iletişim, ürün tablosu, anapara/güncel/kâr, dokümanlar, notlar, mail geçmişi, işlem butonları.
3. FİNANS: maaş/prim/eş maaş kartları, prim hedefi (ilerleme çubuğlu), bekleyen/hakediş/iptal prim kartları, yenileme sayaçları, hareket listesi, 6 aylık çubuk grafik.
4. NOTLAR: basit liste + ekle.
5. TAKVİM: ay seçici + 7 sütun ızgara, bugün vurgulu, günlerde mini etiketler.
6. ŞAHSİ: birikim hedefleri (ilerleme çubuklu), borç/alacak, abonelikler, özel günler, görevler.
7. AYARLAR: bulut senkron paneli, maskot kartı, yedekleme butonları, örnek veri.

# YAPACAKLARIN
1. `index.html` iskeletini koruyarak estetik HTML'e çevir (SVG ikonlar serbest, emoji başlıklar durabilir).
2. `css/style.css`'i baştan yaz: boşluk ritmi (8px ızgara), tipografi ölçeği, cam efektleri, yay animasyonlu alt menü (cubic-bezier yay), basma hissi (scale .97), maskota lime hale (drop-shadow).
3. Karanlık zeminde siyah maskot kaybolmasın diye arkasına ışık halesi koy.
4. Çıktın SADECE tam `index.html` + tam `css/style.css` dosyaları olsun, açıklama kısa olsun.
5. Atacağım referans görsellerdeki detayları (hap menü, rozet renkleri, kart oranları) birebir uygula.

Başlamadan önce eksik gördüğün bir bilgi varsa TEK seferde sor, sonra üret.

> Kopyalama burada biter.
