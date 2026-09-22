# Canoskhi 

Çift tıklayla çalışan, kurulum gerektirmeyen kişisel asistan iskeleti.

## Açılış
`index.html` dosyasına çift tıkla. Hepsi bu. İnternet gerekmez.

## Neler var?
- **Günüm:** bugünkü bakiye (bu ay gelir/gider), hızlı işlem butonları, 30 gün içindeki doğum günleri, hatırlatmalar
- **Hızlı İşlem:** Müşteri / Gelir / Gider / Hatırlatma tek tıkla ekle
- **Müşteriler:** isim + telefon + doğum günü + kullandığı ürünler + toplam tutar, arama
- **Gelir-Gider:** Maaşım / Prim / Eş Maaş ayrı kartlar + son hareketler
- **Ayarlar:** JSON yedek al/yükle, örnek veri

## Veri nerede?
Tarayıcıda `localStorage` içinde (`soa_v2_*`). Silinmez, sende kalır.
Gerçek veritabanına geçince kullanılacak şema: `db/schema.sql` (SQLite ile birebir).

## Klasör
```
index.html      -> uygulama
css/style.css   -> tasarım
js/db.js        -> veri katmanı + yedek/örnek veri
js/app.js       -> Günüm + Hızlı İşlem mantığı
db/schema.sql   -> SQLite şeması (müşteri, ürün, gelir, gider, hatırlatma)
```

## Sıradaki adım (öneri)
1. Örnek veriyi yükle (Ayarlar sekmesi), akışı test et
2. Gerçek müşterilerini gir
3. Maaş/prim/eş maaş kalemlerini Finans'a işle
4. Sonra: Python kurulu bir PC'de SQLite + grafik + PDF rapor ekleriz
