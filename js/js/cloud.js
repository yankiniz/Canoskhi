// Canoskhi bulut senkron — Supabase REST (harici kutuphane gerekmez)
// Mantik: her degisiklikten ~5 sn sonra otomatik Buluta Gonderilir.
// Baska cihazda gormek icin o cihazda "Buluttan Al"a basilir.
// Cihaz bos acilirsa bulut doluysa otomatik cekilir.
const CLOUD = {
  url: "https://aczbcixeolekcjupzptj.supabase.co",
  key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjemJjaXhlb2xla2NqdXB6cHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNzQ4ODYsImV4cCI6MjEwNTY1MDg4Nn0.PuDCNWNX3a-6Pz4aB4bCBdzI3hjHFWNhELtI6iwRofk",
  tables: {customers:'customers',products:'products',cprod:'customer_products',incomes:'incomes',expenses:'expenses',reminders:'reminders',notes:'notes',mails:'mail_logs',docs:'documents',goals:'savings_goals',subs:'subscriptions',sdays:'special_days',stasks:'personal_tasks',pgoal:'prim_goals'},
  cols: {
    customers:['id','ad_soyad','telefon','eposta','dogum_tarihi','dogum_yeri','notlar','durum','musteri_baslangic','foto','created_at'],
    products:['id','ad','kategori'],
    cprod:['id','customer_id','tutar','anapara','guncel_deger','guncel_tarih','prim_tutar','prim_durumu','baslangic_tarihi','bitis_tarihi','durum','iptal_tarihi','iptal_nedeni','oto_yenile','yenileme_kaynagi','product'],
    incomes:['id','kaynak','tutar','tarih','aciklama','customer_id','cprod_id'],
    expenses:['id','kategori','tutar','tarih','aciklama'],
    reminders:['id','baslik','tarih','tip','oncelik','customer_id','tamamlandi'],
    notes:['id','baslik','icerik','tip','customer_id','tarih','created_at'],
    mails:['id','customer_id','eposta','konu','icerik','tarih','durum'],
    docs:['id','customer_id','ad','tip','tarih','notlar','dosya_ad','dosya_tip','dosya_veri'],
    goals:['id','ad','tip','kisi','hedef_tutar','biriken','tarih','notlar'],
    subs:['id','ad','tutar','odeme_gunu','periyot','ay','kategori','aktif','son_odeme'],
    sdays:['id','ad','tarih','tip','tekrar','oncelik','tamamlandi','notlar'],
    stasks:['id','baslik','tarih','oncelik','tamamlandi'],
    pgoal:['id','ay','hedef']
  }
};
let cloudBusy=false, pushTimer=null;
function cloudH(){ return {apikey:CLOUD.key, Authorization:'Bearer '+CLOUD.key, 'Content-Type':'application/json'}; }
function cloudStatus(m){ const e=document.getElementById('cloudStatus'); if(e)e.textContent=m; }
function pick(k,rows){
  const c=CLOUD.cols[k];
  return rows.map(r=>{ const o={}; c.forEach(f=>{ if(r[f]!==undefined)o[f]=r[f]; }); return o; });
}
async function cloudPush(silent){
  if(cloudBusy||!navigator.onLine)return;
  cloudBusy=true; if(!silent)cloudStatus('☁️ Gönderiliyor...');
  // Yazma sirasi: once ebeveynler (FK baglantisi yuzunden)
  const sira=['customers','products','cprod','incomes','expenses','reminders','notes','mails','docs','goals','subs','sdays','stasks','pgoal'];
  try{
    for(const k of [...sira].reverse()){
      const del=await fetch(`${CLOUD.url}/rest/v1/${CLOUD.tables[k]}?id=not.is.null`,{method:'DELETE',headers:cloudH()});
      if(!del.ok)throw new Error('sil '+k);
    }
    for(const k of sira){
      const rows=pick(k,DB.get(k));
      if(!rows.length)continue;
      const ins=await fetch(`${CLOUD.url}/rest/v1/${CLOUD.tables[k]}`,{method:'POST',headers:cloudH(),body:JSON.stringify(rows)});
      if(!ins.ok)throw new Error('yaz '+k);
    }
    cloudStatus('☁️ Eşit '+new Date().toLocaleTimeString('tr-TR'));
  }catch(e){ cloudStatus('☁️ Hata ('+e.message+'): tekrar dene'); }
  cloudBusy=false;
}
async function cloudPull(){
  if(cloudBusy||!navigator.onLine)return alert('İnternet yok');
  if(!confirm('Buluttaki veri bu cihaza yazılacak. Devam?'))return;
  cloudBusy=true; cloudStatus('☁️ Alınıyor...');
  try{
    for(const k in CLOUD.tables){
      const r=await fetch(`${CLOUD.url}/rest/v1/${CLOUD.tables[k]}?select=*`,{headers:cloudH()});
      const rows=await r.json();
      if(Array.isArray(rows))DB.set(k,rows);
    }
    cloudStatus('☁️ Alındı '+new Date().toLocaleTimeString('tr-TR'));
    renderAll();
  }catch(e){ cloudStatus('☁️ Hata: interneti kontrol et'); }
  cloudBusy=false;
}
function schedulePush(){ clearTimeout(pushTimer); pushTimer=setTimeout(()=>cloudPush(true),5000); }
// Cihaz bomboşsa ve bulutta veri varsa otomatik çek
(async function cloudInit(){
  try{
    if(!navigator.onLine)return;
    const dolu=Object.keys(CLOUD.tables).some(k=>DB.get(k).length);
    if(dolu){ cloudStatus('☁️ Hazır'); return; }
    const r=await fetch(`${CLOUD.url}/rest/v1/customers?select=id&limit=1`,{headers:cloudH()});
    const rows=await r.json();
    if(Array.isArray(rows)&&rows.length){
      cloudStatus('☁️ Bulut bulundu, çekiliyor...');
      for(const k in CLOUD.tables){
        const r2=await fetch(`${CLOUD.url}/rest/v1/${CLOUD.tables[k]}?select=*`,{headers:cloudH()});
        const d2=await r2.json();
        if(Array.isArray(d2))DB.set(k,d2);
      }
      cloudStatus('☁️ Eşit');
      renderAll();
    } else cloudStatus('☁️ Hazır (bulut boş)');
  }catch(e){ cloudStatus('☁️ Çevrimdışı mod'); }
})();
