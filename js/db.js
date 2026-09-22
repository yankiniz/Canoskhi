// Basit DB katmani: localStorage (ileride SQLite schema.sql ile birebir)
const KEYS = { customers:'soa_v2_customers', products:'soa_v2_products', cprod:'soa_v2_cprod', incomes:'soa_v2_incomes', expenses:'soa_v2_expenses', reminders:'soa_v2_reminders', notes:'soa_v2_notes', mails:'soa_v2_mails', docs:'soa_v2_docs', goals:'soa_v2_goals', subs:'soa_v2_subs', sdays:'soa_v2_sdays', stasks:'soa_v2_stasks', pgoal:'soa_v2_pgoal' };
const DB = {
  get(k){ try{return JSON.parse(localStorage.getItem(KEYS[k])||'[]')}catch{return[]} },
  set(k,v){ localStorage.setItem(KEYS[k], JSON.stringify(v)) },
  add(k,obj){ const a=DB.get(k); obj.id=Date.now()+Math.floor(Math.random()*999); a.push(obj); DB.set(k,a); return obj; },
  del(k,id){ DB.set(k, DB.get(k).filter(x=>x.id!==id)) }
};
function exportJSON(){
  const o={}; for(const k in KEYS) o[k]=DB.get(k);
  const b=new Blob([JSON.stringify(o,null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='saha-asistan-yedek.json'; a.click();
}
function importJSON(e){
  const f=e.target.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload=()=>{ try{ const o=JSON.parse(r.result); for(const k in KEYS) if(o[k]) DB.set(k,o[k]); renderAll(); alert('Yedek yüklendi'); }catch{alert('Dosya hatalı')} };
  r.readAsText(f);
}
function resetAll(){ if(confirm('Tüm veriler silinsin mi?')){ for(const k in KEYS) DB.set(k,[]); renderAll(); } }
function loadSeed(){
  if(DB.get('customers').length){ alert('Zaten veri var'); return; }
  const m1=DB.add('customers',{ad_soyad:'Ahmet Yılmaz',telefon:'0532 111 22 33',eposta:'ahmet@ornek.com',dogum_tarihi:'1990-10-05',dogum_yeri:'Ankara',notlar:'BES + Sağlık',durum:'aktif',musteri_baslangic:'2021-03-10'});
  const m2=DB.add('customers',{ad_soyad:'Ayşe Demir',telefon:'0533 444 55 66',eposta:'ayse@ornek.com',dogum_tarihi:'1985-09-28',dogum_yeri:'İzmir',notlar:'Konut kredisi',durum:'aktif',musteri_baslangic:'2024-06-01'});
  const m3=DB.add('customers',{ad_soyad:'Mehmet İptal',telefon:'0535 000 11 22',eposta:'',dogum_tarihi:'1988-03-12',notlar:'Vazgeçti',durum:'iptal'});
  DB.add('products',{ad:'BES',kategori:'Sigorta'}); DB.add('products',{ad:'Sağlık',kategori:'Sigorta'});
  const p1=DB.add('cprod',{customer_id:m1.id,product:'BES',tutar:65000,anapara:40000,guncel_deger:65000,guncel_tarih:'2026-09-01',prim_tutar:5000,prim_durumu:'hakedis',durum:'aktif',oto_yenile:1,baslangic_tarihi:'2021-03-10',bitis_tarihi:'2026-11-10'});
  DB.add('cprod',{customer_id:m1.id,product:'Sağlık',tutar:15000,prim_tutar:1500,prim_durumu:'odenen',durum:'aktif',oto_yenile:1,baslangic_tarihi:'2026-02-01',bitis_tarihi:'2027-02-01'});
  DB.add('cprod',{customer_id:m2.id,product:'Konut Kredisi',tutar:1200000,prim_tutar:8000,prim_durumu:'bekleyen',durum:'aktif',oto_yenile:1,baslangic_tarihi:'2026-09-01',bitis_tarihi:'2026-10-20'});
  DB.add('cprod',{customer_id:m3.id,product:'BES',tutar:30000,prim_tutar:3000,prim_durumu:'iptal',durum:'iptal',iptal_tarihi:'2026-08-20',iptal_nedeni:'Müşteri vazgeçti'});
  const ay=new Date().toISOString().slice(0,7)+'-15';
  DB.add('incomes',{kaynak:'Ben Maas',tutar:60000,tarih:ay,aciklama:'Maaş'});
  DB.add('incomes',{kaynak:'Prim',tutar:1500,tarih:ay,aciklama:'Ahmet Sağlık primi',customer_id:m1.id,cprod_id:p1.id});
  DB.add('incomes',{kaynak:'Es Maas',tutar:55000,tarih:ay,aciklama:'Eş maaş'});
  DB.add('expenses',{kategori:'Kira',tutar:20000,tarih:ay,aciklama:'Ev kirası'});
  DB.add('expenses',{kategori:'Mutfak',tutar:12000,tarih:ay,aciklama:'Market'});
  DB.add('reminders',{baslik:'Ahmet Yılmaz doğum günü',tarih:'2026-10-05',tip:'dogumgunu',customer_id:m1.id,tamamlandi:0});
  DB.add('docs',{customer_id:m1.id,ad:'Kimlik fotokopisi',tip:'kimlik',tarih:'2021-03-10',notlar:'Arşivden eklendi',dosya_ad:''});
  DB.add('docs',{customer_id:m2.id,ad:'İkametgah',tip:'ikametgah',tarih:'2024-06-01',notlar:'Konut kredisi evrakı',dosya_ad:''});
  DB.add('notes',{baslik:'Şahsi - Sigorta yenileme ara',icerik:'Kendi sağlık poliçemi karşılaştır',tip:'sahsi',tarih:ay});
  DB.add('notes',{baslik:'Ayşe evrak takibi',icerik:'Kimlik + gelir belgesi eksik',tip:'is',customer_id:m2.id,tarih:ay});
  DB.add('goals',{ad:'Tatil birikimi',tip:'hedef',hedef_tutar:100000,biriken:35000,tarih:'2027-06-01',notlar:''});
  DB.add('goals',{ad:'Kardeşe borç',tip:'borc',kisi:'Kardeşim',hedef_tutar:50000,biriken:20000,tarih:'2026-12-31',notlar:''});
  DB.add('subs',{ad:'Aidat',tutar:3500,odeme_gunu:5,periyot:'aylik',kategori:'Ev',aktif:1});
  DB.add('subs',{ad:'Netflix',tutar:230,odeme_gunu:15,periyot:'aylik',kategori:'Eğlence',aktif:1});
  DB.add('sdays',{ad:'Evlilik yıldönümü',tarih:'2015-10-12',tip:'evlilik',tekrar:'yillik',tamamlandi:0});
  DB.add('stasks',{baslik:'Araba bakımı randevusu al',tarih:ay, oncelik:'onemli',tamamlandi:0});
  renderAll();
}
