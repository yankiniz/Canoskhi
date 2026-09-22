let modalType=null, custFilter='aktif', detailId=null;
const fmt=n=>Number(n||0).toLocaleString('tr-TR')+' ₺';
const todayStr=()=>new Date().toISOString().slice(0,10);
// --- ONCELIK: sadece 3 seviye, skor yok
// acil 🔴 / onemli 🟡 / normal ⚪  (yoksa normal sayilir)
function prioRank(o){ return o==='acil'?0:(o==='onemli'?1:2); }
function prioBadge(o){ return o==='acil'?'<span class="pb pb-acil">Acil</span>':(o==='onemli'?'<span class="pb pb-onemli">Önemli</span>':'<span class="pb pb-normal">Normal</span>'); }
// --- SEGMENT: farkli urun sayisina gore (yenileme sayilmaz: ayni urun 4 yil da olsa 1 sayilir)
function tierOf(cid){
  const adlar=[...new Set(DB.get('cprod').filter(p=>p.customer_id===cid&&p.durum==='aktif').map(p=>(p.product||'').toLocaleLowerCase('tr')))];
  const n=adlar.length;
  if(n>=4)return {ad:'Private',ikon:'💎'};
  if(n===3)return {ad:'Gold',ikon:'🥇'};
  if(n===2)return {ad:'Gümüş',ikon:'🥈'};
  if(n===1)return {ad:'Standart',ikon:'⚪'};
  return {ad:'Yeni',ikon:'🌱'};
}
// --- KIDEM: musteri ne zamandir bizde
function tenureOf(c){
  const tarihler=DB.get('cprod').filter(p=>p.customer_id===c.id&&p.baslangic_tarihi).map(p=>p.baslangic_tarihi);
  if(c.musteri_baslangic)tarihler.push(c.musteri_baslangic);
  if(c.created_at)tarihler.push(String(c.created_at).slice(0,10));
  if(!tarihler.length)return '';
  const ilk=tarihler.sort()[0];
  const a=new Date(ilk), b=new Date(); let ay=(b.getFullYear()-a.getFullYear())*12+(b.getMonth()-a.getMonth());
  if(ay<0)ay=0; const y=Math.floor(ay/12), k=ay%12;
  return {ilk,metin:y>0?`${y} yıl ${k} ay`:(k>0?`${k} ay`:'yeni')};
}
// --- KAR: anapara sabit, guncel degisir
function karOf(p){
  const a=Number(p.anapara||0), g=Number(p.guncel_deger||p.tutar||0);
  if(!a)return '';
  const fark=g-a, yuz=Math.round(fark/a*100);
  return `${fark>=0?'+':''}${fmt(fark)} (%${yuz})`;
}

document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('nav button').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); document.getElementById('tab-'+b.dataset.tab).classList.add('active');
});
document.getElementById('todayLine').textContent=new Date().toLocaleDateString('tr-TR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
(function greet(){ const h=new Date().getHours(); const m=h<6?'İyi geceler':(h<12?'Günaydın':(h<18?'İyi günler':'İyi akşamlar')); const e=document.getElementById('greetLine'); if(e)e.textContent=m; })();
function cloudDot(){ const e=document.getElementById('cloudDot'); if(e)e.classList.toggle('on',navigator.onLine); }
document.getElementById('calMonth').value=new Date().toISOString().slice(0,7);

// --- HIZLI İŞLEM ---
function openModal(t, extra){
  modalType=t+(extra?':'+extra:'');
  const T={musteri:'+ Müşteri',gelir:'+ Gelir',gider:'+ Gider',hatirlatma:'+ Hatırlatma',not:'+ Not',urun:'+ Ürün / Poliçe',mail:'✉️ E-posta',dokuman:'+ Doküman',hedef:'+ Birikim Hedefi',borc:'+ Borç / Alacak',abonelik:'+ Abonelik',ozelgun:'+ Özel Gün',sgorev:'+ Görev',primhedef:'🎯 Prim Hedefi'};
  document.getElementById('modalTitle').textContent=T[t]||t;
  const B=document.getElementById('modalBody');
  if(t==='musteri')B.innerHTML=`<input id="f_ad" placeholder="Ad Soyad*"><input id="f_tel" placeholder="Telefon"><input id="f_ep" placeholder="E-posta"><input id="f_dog" type="date"><input id="f_dyer" placeholder="Doğum yeri"><label>Müşteri başlangıcı</label><input id="f_mbas" type="date" value="${todayStr()}"><input id="f_urun" placeholder="İlk ürün (örn: BES)"><input id="f_tutar" type="number" placeholder="Toplam tutar / anapara"><input id="f_prim" type="number" placeholder="Beklenen prim"><label>İlk ürün vade tarihi (varsa)</label><input id="f_vade" type="date"><textarea id="f_not" placeholder="Not"></textarea>`;
  if(t==='gelir')B.innerHTML=`<select id="f_kaynak"><option>Ben Maas</option><option>Prim</option><option>Es Maas</option><option>Diger</option></select><input id="f_tutar" type="number" placeholder="Tutar*"><input id="f_tarih" type="date" value="${todayStr()}"><input id="f_acik" placeholder="Açıklama (prim ise müşteri adı)">`;
  if(t==='gider')B.innerHTML=`<select id="f_kat"><option>Kira</option><option>Mutfak</option><option>Ulasim</option><option>Fatura</option><option>Diger</option></select><input id="f_tutar" type="number" placeholder="Tutar*"><input id="f_tarih" type="date" value="${todayStr()}"><input id="f_acik" placeholder="Açıklama">`;
  if(t==='hatirlatma')B.innerHTML=`<input id="f_bas" placeholder="Başlık*"><input id="f_tarih" type="date" value="${todayStr()}"><select id="f_tip"><option value="is">İş</option><option value="ozel">Özel</option><option value="dogumgunu">Doğum günü</option></select><select id="f_onc"><option value="normal">⚪ Normal</option><option value="onemli">🟡 Önemli</option><option value="acil">🔴 Acil</option></select>`;
  if(t==='not')B.innerHTML=`<input id="f_bas" placeholder="Başlık*"><select id="f_tip"><option value="sahsi">Şahsi</option><option value="is">İş</option></select><input id="f_tarih" type="date" value="${todayStr()}"><textarea id="f_ic" placeholder="Not detayı"></textarea>`;
  if(t==='urun')B.innerHTML=`<input id="f_urun" placeholder="Ürün adı*"><input id="f_tutar" type="number" placeholder="Toplam tutar"><input id="f_prim" type="number" placeholder="Prim"><select id="f_pd"><option value="bekleyen">Prim: bekleyen</option><option value="hakedis">Prim: hakediş</option><option value="odenen">Prim: ödenen</option></select><label>Başlangıç</label><input id="f_bas" type="date" value="${todayStr()}"><label>Bitiş / Vade</label><input id="f_bit" type="date">`;
  if(t==='mail')B.innerHTML=`<input id="f_ep" placeholder="E-posta*" value="${extra||''}"><input id="f_konu" placeholder="Konu"><textarea id="f_ic" placeholder="Mesaj"></textarea><p><small>Kaydet + Aç: varsayılan mail programında açılır (Gmail/Outlook). Kayıt mail_logs'a düşer.</small></p>`;
  if(t==='dokuman')B.innerHTML=`<input id="f_ad" placeholder="Doküman adı* (örn: Kimlik fotokopisi)"><select id="f_tip"><option value="kimlik">Kimlik</option><option value="ikametgah">İkametgah</option><option value="sozlesme">Sözleşme</option><option value="diger">Diğer</option></select><input id="f_tarih" type="date" value="${todayStr()}"><input id="f_dosya" type="file"><textarea id="f_not" placeholder="Not (örn: dolapta 2. raf)"></textarea><p><small>Dosya küçükse uygulamaya gömülür, büyükse sadece adı + notu saklanır.</small></p>`;
  if(t==='hedef')B.innerHTML=`<input id="f_ad" placeholder="Hedef adı* (örn: Tatil)"><input id="f_tutar" type="number" placeholder="Hedef tutar*"><input id="f_biriken" type="number" placeholder="Biriken (varsa)"><input id="f_tarih" type="date"><input id="f_not" placeholder="Not">`;
  if(t==='borc')B.innerHTML=`<select id="f_tip"><option value="borc">Borç (vereceğim)</option><option value="alacak">Alacak (alacağım)</option></select><input id="f_kisi" placeholder="Kişi*"><input id="f_tutar" type="number" placeholder="Tutar*"><input id="f_biriken" type="number" placeholder="Ödenen / alınan"><input id="f_tarih" type="date"><input id="f_not" placeholder="Not">`;
  if(t==='abonelik')B.innerHTML=`<input id="f_ad" placeholder="Ad* (örn: Aidat)"><input id="f_tutar" type="number" placeholder="Tutar*"><label>Ödeme günü (ayın kaçı)</label><input id="f_gun" type="number" min="1" max="31" value="1"><select id="f_per"><option value="aylik">Aylık</option><option value="yillik">Yıllık</option></select><label>Ay (yıllık ise)</label><input id="f_ay" type="number" min="1" max="12" value="${new Date().getMonth()+1}"><input id="f_kat" placeholder="Kategori (Ev, Eğlence...)">`;
  if(t==='ozelgun')B.innerHTML=`<input id="f_ad" placeholder="Ad* (örn: Evlilik yıldönümü)"><input id="f_tarih" type="date" value="${todayStr()}"><select id="f_tip"><option value="evlilik">Evlilik</option><option value="aile">Aile</option><option value="saglik">Sağlık</option><option value="arac">Araç</option><option value="diger">Diğer</option></select><select id="f_tek"><option value="yillik">Her yıl tekrarla</option><option value="tek">Tek seferlik</option></select><input id="f_not" placeholder="Not">`;
  if(t==='sgorev')B.innerHTML=`<input id="f_bas" placeholder="Görev*"><input id="f_tarih" type="date" value="${todayStr()}"><select id="f_tip"><option value="normal">Normal</option><option value="onemli">Önemli</option><option value="acil">Acil</option></select>`;
  if(t==='primhedef')B.innerHTML=`<input id="f_tutar" type="number" placeholder="Bu ay prim hedefi*"><p><small>Tahsil edilen prim + bekleyen/hakediş toplamı hedefe oranlanır.</small></p>`;
  document.getElementById('modal').classList.remove('hidden');
}
function closeModal(){document.getElementById('modal').classList.add('hidden')}
function v(id){return (document.getElementById(id)||{}).value||''}
function saveModal(){
  const [t,extra]=modalType.split(':');
  if(t==='musteri'){
    if(!v('f_ad'))return alert('İsim zorunlu');
    const c=DB.add('customers',{ad_soyad:v('f_ad'),telefon:v('f_tel'),eposta:v('f_ep'),dogum_tarihi:v('f_dog'),dogum_yeri:v('f_dyer'),musteri_baslangic:v('f_mbas')||todayStr(),notlar:v('f_not'),durum:'aktif',created_at:todayStr()});
    if(v('f_urun'))DB.add('cprod',{customer_id:c.id,product:v('f_urun'),tutar:Number(v('f_tutar'))||0,anapara:Number(v('f_tutar'))||0,guncel_deger:Number(v('f_tutar'))||0,guncel_tarih:todayStr(),prim_tutar:Number(v('f_prim'))||0,prim_durumu:'bekleyen',durum:'aktif',oto_yenile:1,baslangic_tarihi:todayStr(),bitis_tarihi:v('f_vade')});
    if(v('f_dog'))DB.add('reminders',{baslik:c.ad_soyad+' doğum günü',tarih:v('f_dog'),tip:'dogumgunu',customer_id:c.id,tamamlandi:0});
  }
  if(t==='gelir')DB.add('incomes',{kaynak:v('f_kaynak'),tutar:Number(v('f_tutar'))||0,tarih:v('f_tarih')||todayStr(),aciklama:v('f_acik')});
  if(t==='gider')DB.add('expenses',{kategori:v('f_kat'),tutar:Number(v('f_tutar'))||0,tarih:v('f_tarih')||todayStr(),aciklama:v('f_acik')});
  if(t==='hatirlatma')DB.add('reminders',{baslik:v('f_bas'),tarih:v('f_tarih'),tip:v('f_tip'),oncelik:v('f_onc')||'normal',customer_id:detailId||undefined,tamamlandi:0});
  if(t==='not')DB.add('notes',{baslik:v('f_bas'),tip:v('f_tip'),tarih:v('f_tarih'),icerik:v('f_ic'),customer_id:detailId||undefined});
  if(t==='urun'&&detailId)DB.add('cprod',{customer_id:detailId,product:v('f_urun'),tutar:Number(v('f_tutar'))||0,anapara:Number(v('f_tutar'))||0,guncel_deger:Number(v('f_tutar'))||0,guncel_tarih:todayStr(),prim_tutar:Number(v('f_prim'))||0,prim_durumu:v('f_pd'),durum:'aktif',baslangic_tarihi:v('f_bas')||todayStr(),bitis_tarihi:v('f_bit')});
  if(t==='dokuman'&&detailId){
    if(!v('f_ad'))return alert('Doküman adı zorunlu');
    const fin=document.getElementById('f_dosya'); const f=fin&&fin.files[0];
    const kayit={customer_id:detailId,ad:v('f_ad'),tip:v('f_tip'),tarih:v('f_tarih')||todayStr(),notlar:v('f_not'),dosya_ad:f?f.name:''};
    if(!f){DB.add('docs',kayit);closeModal();renderAll();openDetail(detailId,true);return;}
    if(f.size>800000){kayit.notlar=(kayit.notlar?kayit.notlar+' | ':'')+'Dosya büyük (>800KB), harici arşivde sakla';DB.add('docs',kayit);closeModal();renderAll();openDetail(detailId,true);alert('Dosya büyük olduğu için gömülmedi, adı + notu kaydedildi.');return;}
    const rd=new FileReader();
    rd.onload=()=>{kayit.dosya_veri=rd.result;kayit.dosya_tip=f.type;DB.add('docs',kayit);closeModal();renderAll();openDetail(detailId,true);};
    rd.readAsDataURL(f); return;
  }
  if(t==='mail'&&detailId){
    DB.add('mails',{customer_id:detailId,eposta:v('f_ep'),konu:v('f_konu'),icerik:v('f_ic'),tarih:todayStr(),durum:'gonderildi'});
    window.location.href=`mailto:${encodeURIComponent(v('f_ep'))}?subject=${encodeURIComponent(v('f_konu'))}&body=${encodeURIComponent(v('f_ic'))}`;
  }
  if(t==='hedef'){ if(!v('f_ad'))return alert('Ad zorunlu'); DB.add('goals',{ad:v('f_ad'),tip:'hedef',hedef_tutar:Number(v('f_tutar'))||0,biriken:Number(v('f_biriken'))||0,tarih:v('f_tarih'),notlar:v('f_not')}); }
  if(t==='borc'){ if(!v('f_kisi'))return alert('Kişi zorunlu'); DB.add('goals',{ad:(v('f_tip')==='borc'?'Borç: ':'Alacak: ')+v('f_kisi'),tip:v('f_tip'),kisi:v('f_kisi'),hedef_tutar:Number(v('f_tutar'))||0,biriken:Number(v('f_biriken'))||0,tarih:v('f_tarih'),notlar:v('f_not')}); }
  if(t==='abonelik'){ if(!v('f_ad'))return alert('Ad zorunlu'); DB.add('subs',{ad:v('f_ad'),tutar:Number(v('f_tutar'))||0,odeme_gunu:Number(v('f_gun'))||1,periyot:v('f_per'),ay:Number(v('f_ay'))||1,kategori:v('f_kat'),aktif:1}); }
  if(t==='ozelgun'){ if(!v('f_ad'))return alert('Ad zorunlu'); DB.add('sdays',{ad:v('f_ad'),tarih:v('f_tarih')||todayStr(),tip:v('f_tip'),tekrar:v('f_tek'),tamamlandi:0,notlar:v('f_not')}); }
  if(t==='sgorev'){ if(!v('f_bas'))return alert('Görev zorunlu'); DB.add('stasks',{baslik:v('f_bas'),tarih:v('f_tarih'),oncelik:v('f_tip'),tamamlandi:0}); }
  if(t==='primhedef'){ if(!v('f_tutar'))return alert('Tutar zorunlu'); DB.set('pgoal',[{ay:monthKey(),hedef:Number(v('f_tutar'))||0}]); }
  closeModal(); renderAll(); if(detailId)openDetail(detailId,true);
}

// --- MÜŞTERİ LİSTE + DETAY ---
function setCustFilter(f){custFilter=f;renderCustomers()}
function custTotal(id){return DB.get('cprod').filter(p=>p.customer_id===id&&p.durum==='aktif').reduce((s,p)=>s+Number(p.tutar||0),0)}
function renderCustomers(){
  const q=(document.getElementById('search').value||'').toLocaleLowerCase('tr');
  const cs=DB.get('customers'), cp=DB.get('cprod');
  let rows=cs.map(c=>({c,urs:cp.filter(p=>p.customer_id===c.id),top:custTotal(c.id)}));
  if(custFilter!=='all')rows=rows.filter(r=>(r.c.durum||'aktif')===custFilter);
  rows=rows.filter(r=>!q||r.c.ad_soyad.toLocaleLowerCase('tr').includes(q)||(r.c.telefon||'').includes(q)||(r.c.eposta||'').toLocaleLowerCase().includes(q)||r.urs.some(u=>(u.product||'').toLocaleLowerCase('tr').includes(q)));
  document.getElementById('custCount').textContent=`(${rows.length})`;
  document.getElementById('customerList').innerHTML=rows.map(r=>{
    const ipt=r.c.durum==='iptal'?' ⛔ İPTAL':'';
    const t=tierOf(r.c.id);
    const foto=r.c.foto?`<img src="${r.c.foto}" class="thumb">`:'';
    return `<li>${foto}<b><a href="#" onclick="openDetail(${r.c.id});return false">${r.c.ad_soyad}</a></b>${ipt} <span class="badge">${t.ikon} ${t.ad}</span> <span class="badge">${fmt(r.top)}</span><br>📞 ${r.c.telefon||'-'} | 🎂 ${r.c.dogum_tarihi||'-'}<br>📦 ${r.urs.filter(u=>u.durum==='aktif').map(u=>u.product).join(', ')||'ürün yok'}</li>`;
  }).join('')||'<li>Kayıt yok</li>';
}
function openDetail(id,keep){
  detailId=id;
  const c=DB.get('customers').find(x=>x.id===id); if(!c)return;
  const urs=DB.get('cprod').filter(p=>p.customer_id===id);
  const top=custTotal(id), primTop=urs.filter(p=>p.durum==='aktif').reduce((s,p)=>s+Number(p.prim_tutar||0),0);
  const notes=DB.get('notes').filter(n=>n.customer_id===id);
  const mails=DB.get('mails').filter(m=>m.customer_id===id);
  document.getElementById('detailTitle').textContent=c.ad_soyad+(c.durum==='iptal'?' ⛔ İPTAL':'');
  const t=tierOf(id), kidem=tenureOf(c);
  const docs=DB.get('docs').filter(d=>d.customer_id===id);
  document.getElementById('detailBody').innerHTML=`
    ${c.foto?`<img src="${c.foto}" class="photo">`:''}
    <p><b>${t.ikon} ${t.ad} Müşteri</b>${kidem?` | ⏳ ${kidem.metin} bizimle (ilk: ${kidem.ilk})`:''}</p>
    <p>📞 ${c.telefon||'-'} | ✉️ ${c.eposta||'-'}</p>
    <p>🎂 ${c.dogum_tarihi||'-'}${c.dogum_yeri?' | 📍 '+c.dogum_yeri:''}</p>
    <p>📝 ${c.notlar||''}</p>
    <p><b>Toplam: ${fmt(top)}</b> | <b>Prim beklentisi: ${fmt(primTop)}</b></p>
    <div class="quick"><input id="photoUp" type="file" accept="image/*" hidden onchange="uploadPhoto(${c.id})"><button onclick="document.getElementById('photoUp').click()">📷 Fotoğraf (kimlikten)</button></div>
    <h4>Ürünler / Poliçeler</h4>
    ${urs.map(u=>{
      if(u.durum==='yenilendi')return `<div class="line">📦 <b>${u.product}</b> — ${fmt(u.tutar)} <span class="badge">geçen dönem (bizde yenilendi)</span> <small>${u.baslangic_tarihi||''} → ${u.bitis_tarihi||''}</small></div>`;
      if(u.durum==='digerde')return `<div class="line">📦 <b>${u.product}</b> — ${fmt(u.tutar)} <span class="badge">başka yerde (bu sene bizde değil)</span> <small>${u.bitis_tarihi||''}</small> ${u.oto_yenile===0?'':`<button onclick="remindOffer(${u.id})">Seneye Teklif Hatırlat</button>`}</div>`;
      if(u.durum==='iptal')return `<div class="line">📦 <b>${u.product}</b> ⛔ İPTAL <small>${u.iptal_tarihi||''} ${u.iptal_nedeni||''}</small> <button onclick="restoreProduct(${u.id})">Geri Al</button></div>`;
      const otoKapali=u.oto_yenile===0;
      const kar=u.anapara?`<br>💰 Anapara: ${fmt(u.anapara)} (sabit) | Güncel: ${fmt(u.guncel_deger||u.tutar)} (${u.guncel_tarih||'-'}) | Kâr: <b>${karOf(u)}</b>`:'';
      return `<div class="line">📦 <b>${u.product}</b> — ${fmt(u.tutar)} | prim ${fmt(u.prim_tutar)} (${u.prim_durumu}) | ${u.durum} ${u.bitis_tarihi?`<br>⏰ Vade: ${u.bitis_tarihi} (${vadeKalan(u.bitis_tarihi)})`:''}${kar}${otoKapali?'<br><span class="badge">oto yenileme kapalı</span>':''}
      <br><button onclick="cancelProduct(${u.id})">İptal Et</button> <button onclick="setPrim(${u.id},'odenen')">Prim Ödendi</button> <button onclick="updateDeger(${u.id})">💰 Değer Güncelle</button>
      <br>🔁 <button onclick="renewBiz(${u.id})">✅ Biz Yeniledik</button> <button onclick="renewDiger(${u.id})">↗️ Başka Yerden Yapmış</button>
      ${otoKapali?`<button onclick="startRenew(${u.id})">🔔 Yenileme Bildirimini Aç</button>`:`<button onclick="stopRenew(${u.id})">⛔ Yenilemeyi Durdur</button>`}
      ${u.bitis_tarihi?`<button onclick="remindExpiry(${u.id})">Hatırlat</button>`:''}
    </div>`}).join('')||'Ürün yok'}
    <div class="quick"><button onclick="openModal('urun')">+ Ürün Ekle</button>
    <button onclick="openModal('hatirlatma')">+ Hatırlatma</button>
    <button onclick="openModal('not')">+ Not</button>
    <button onclick="openModal('dokuman')">+ Doküman</button>
    <button onclick="openModal('mail','${c.eposta||''}')">✉️ E-posta</button>
    <button onclick="waOpen('${(c.telefon||'').replace(/'/g,'')}','Merhaba ${c.ad_soyad},')">💬 WhatsApp</button></div>
    <h4>Notlar</h4>${notes.map(n=>`<div class="line">📝 ${n.baslik} <small>${n.tarih||''}</small><br>${n.icerik||''}</div>`).join('')||'Not yok'}
    <h4>Dokümanlar</h4>${docs.map(d=>`<div class="line">📄 <b>${d.ad}</b> <span class="badge">${d.tip}</span> <small>${d.tarih||''}</small><br>${d.notlar||''}${d.dosya_veri?`<br><a href="${d.dosya_veri}" download="${d.dosya_ad||'dosya'}">📎 ${d.dosya_ad||'dosyayı aç'}</a>`:(d.dosya_ad?`<br><small>📎 ${d.dosya_ad} (harici arşivde)</small>`:'')} <button onclick="DB.del('docs',${d.id});renderAll();openDetail(${c.id},true)">Sil</button></div>`).join('')||'Doküman yok'}
    <h4>Mail geçmişi</h4>${mails.map(m=>`<div class="line">✉️ ${m.konu||'(konusuz)'} → ${m.eposta} <small>${m.tarih}</small></div>`).join('')||'Mail yok'}
    <hr><div class="quick">
      ${c.durum!=='iptal'?`<button onclick="cancelCustomer(${c.id})">⛔ Müşteriyi İptal Et</button>`:`<button onclick="restoreCustomer(${c.id})">✅ Aktife Al</button>`}
      <button onclick="delCust(${c.id})">Sil</button>
    </div>`;
  if(!keep)document.getElementById('detail').classList.remove('hidden');
}
function closeDetail(){document.getElementById('detail').classList.add('hidden');detailId=null}
function cancelProduct(pid){
  const n=prompt('İptal nedeni:'); if(n===null)return;
  const a=DB.get('cprod');const p=a.find(x=>x.id===pid);
  p.durum='iptal';p.prim_durumu='iptal';p.iptal_tarihi=todayStr();p.iptal_nedeni=n;
  DB.set('cprod',a);renderAll();openDetail(detailId,true);
}
function restoreProduct(pid){const a=DB.get('cprod');const p=a.find(x=>x.id===pid);p.durum='aktif';p.prim_durumu='bekleyen';DB.set('cprod',a);renderAll();openDetail(detailId,true)}
function setPrim(pid,d){const a=DB.get('cprod');const p=a.find(x=>x.id===pid);p.prim_durumu=d;DB.set('cprod',a);
  if(d==='odenen'){const c=DB.get('customers').find(x=>x.id===p.customer_id);DB.add('incomes',{kaynak:'Prim',tutar:Number(p.prim_tutar)||0,tarih:todayStr(),aciklama:(c?c.ad_soyad+' ':'')+p.product+' primi',customer_id:p.customer_id,cprod_id:p.id});}
  renderAll();openDetail(detailId,true);
}
function cancelCustomer(id){if(!confirm('Müşteri iptal durumuna alınsın mı? (Ürünler de iptal olur)'))return;
  const a=DB.get('customers');a.find(x=>x.id===id).durum='iptal';DB.set('customers',a);
  const cp=DB.get('cprod');cp.filter(p=>p.customer_id===id&&p.durum!=='iptal').forEach(p=>{p.durum='iptal';p.prim_durumu='iptal';p.iptal_tarihi=todayStr()});DB.set('cprod',cp);
  renderAll();openDetail(id,true);
}
function restoreCustomer(id){const a=DB.get('customers');a.find(x=>x.id===id).durum='aktif';DB.set('customers',a);renderAll();openDetail(id,true)}
function delCust(id){if(!confirm('Müşteri tamamen silinsin mi?'))return;DB.del('customers',id);DB.set('cprod',DB.get('cprod').filter(p=>p.customer_id!==id));closeDetail();renderAll()}

// --- GÜNÜM / FİNANS / NOT / TAKVİM ---
function monthKey(){return new Date().toISOString().slice(0,7)}
function renderAll(){ensureExpiryReminders();renderGunum();renderCustomers();renderFinance();renderNotes();renderCalendar();renderChart();renderSahsi();cloudDot();if(typeof schedulePush==='function')schedulePush()}
// Otomatik vade bildirimi: 30 gun icinde bitecek aktif + oto acik urun icin hatirlatma yoksa kur.
// Bitirdigin (✓) hatirlatma bir daha canlanmaz; mukerrer kayit uretmez.
function ensureExpiryReminders(){
  const rems=DB.get('reminders'); let eklendi=false;
  DB.get('cprod').filter(p=>p.bitis_tarihi&&p.durum==='aktif'&&p.oto_yenile!==0).forEach(p=>{
    const g=vadeGun(p.bitis_tarihi); if(g===null||g<0||g>30)return;
    const varMi=rems.some(r=>r.customer_id===p.customer_id&&(r.baslik||'').includes(p.product)&&(r.baslik||'').includes(p.bitis_tarihi));
    if(!varMi){
      const c=DB.get('customers').find(x=>x.id===p.customer_id);
      rems.push({id:Date.now()+Math.floor(Math.random()*999),baslik:(c?c.ad_soyad+' — ':'')+p.product+' vade: '+p.bitis_tarihi,tarih:p.bitis_tarihi,tip:'is',customer_id:p.customer_id,tamamlandi:0});
      eklendi=true;
    }
  });
  if(eklendi)DB.set('reminders',rems);
}
function renderGunum(){
  renderAgenda();
  // Radar: geciken + 14 gun vade + 14 gun dogum gunu ozeti
  const n=new Date(); n.setHours(0,0,0,0);
  const gec=DB.get('reminders').filter(r=>!r.tamamlandi&&r.tarih&&new Date(r.tarih)<n).length
    + DB.get('stasks').filter(t=>!t.tamamlandi&&t.tarih&&new Date(t.tarih)<n).length;
  const vad=DB.get('cprod').filter(p=>p.bitis_tarihi&&p.durum==='aktif'&&p.oto_yenile!==0&&(()=>{const g=vadeGun(p.bitis_tarihi);return g!==null&&g>=0&&g<=14})()).length;
  const rl=document.getElementById('riskLine');
  if(rl)rl.textContent=gec+vad===0?'Her şey yolunda 🎉':`${gec?gec+' geciken ⛔ ':''}${vad?vad+' vade ⏰':''}`.trim();
  const mk=monthKey();
  const inc=DB.get('incomes').filter(i=>(i.tarih||'').startsWith(mk)).reduce((s,i)=>s+Number(i.tutar),0);
  const exp=DB.get('expenses').filter(i=>(i.tarih||'').startsWith(mk)).reduce((s,i)=>s+Number(i.tutar),0);
  document.getElementById('sumIncome').textContent=fmt(inc);
  document.getElementById('sumExpense').textContent=fmt(exp);
  document.getElementById('sumBalance').textContent=fmt(inc-exp);
  const custs=DB.get('customers').filter(c=>c.dogum_tarihi&&(c.durum||'aktif')!=='iptal');
  const now=new Date(); const list=[];
  custs.forEach(c=>{const d=new Date(c.dogum_tarihi);const ty=new Date(now.getFullYear(),d.getMonth(),d.getDate());let diff=(ty-now)/864e5;if(diff<0)diff+=365;if(diff<=30)list.push({c,diff:Math.round(diff)})});
  list.sort((a,b)=>a.diff-b.diff);
  document.getElementById('birthdayList').innerHTML=list.length?list.map(x=>`<li>🎂 <a href="#" onclick="openDetail(${x.c.id});return false">${x.c.ad_soyad}</a> — ${new Date(x.c.dogum_tarihi).toLocaleDateString('tr-TR')} <span class="badge">${x.diff} gün</span> <button onclick="celebrateBirthday(${x.c.id})">🎉 Kutla</button> <button onclick="waBirthday(${x.c.id})">💬</button></li>`).join(''):'<li>Yaklaşan doğum günü yok</li>';
  // Vade uyarilari: 60 gun icinde biten, oto yenilemesi acik AKTIF policeler
  // (Durdurulanlar ve gecmis donemler burada gorunmez; bildirim her sene otomatik gelir)
  const exps=DB.get('cprod').filter(p=>p.bitis_tarihi&&p.durum==='aktif'&&p.oto_yenile!==0).map(p=>{
    const c=DB.get('customers').find(x=>x.id===p.customer_id); return {p,c,g:vadeGun(p.bitis_tarihi)};
  }).filter(x=>x.g!==null&&x.g<=60).sort((a,b)=>a.g-b.g);
  document.getElementById('expiryList').innerHTML=exps.length?exps.map(x=>`<li>⏰ <a href="#" onclick="openDetail(${x.p.customer_id});return false">${x.c?x.c.ad_soyad:'?'}</a> — ${x.p.product} <span class="badge">${vadeKalan(x.p.bitis_tarihi)}</span> <small>${x.p.bitis_tarihi}</small> <button onclick="remindExpiry(${x.p.id})">Hatırlat</button> <button onclick="waVade(${x.p.id})">💬</button></li>`).join(''):'<li>Vadesi yaklaşan poliçe yok</li>';
  const rems=DB.get('reminders').filter(r=>!r.tamamlandi).sort((a,b)=>prioRank(a.oncelik)-prioRank(b.oncelik)||((a.tarih||'')<(b.tarih||'')?-1:1)).slice(0,20);
  document.getElementById('reminderList').innerHTML=rems.length?rems.map(r=>`<li>${r.tip==='ozel'?'🏠':'📌'} ${r.baslik} ${prioBadge(r.oncelik)} <span class="badge">${r.tarih||''}</span> <button onclick="doneRem(${r.id})">✓</button></li>`).join(''):'<li>Hatırlatma yok</li>';
}
// --- BIRLESIK GUNDEM: skorsuz, 4 grup (geciken / acil / onemli / normal), her grup kendi icinde tarih sirali
function renderAgenda(){
  const G={geciken:[],acil:[],onemli:[],normal:[]};
  const gunfark=t=>{ if(!t)return null; const n=new Date(); n.setHours(0,0,0,0); return Math.round((new Date(t)-n)/864e5); };
  const koy=(seviye,tarih,item)=>{
    const g=gunfark(tarih);
    if(g!==null&&g<0){ item.alt='GECİKTİ ('+(tarih||'')+')'; G.geciken.push(item); }
    else G[seviye].push(item);
  };
  DB.get('reminders').filter(r=>!r.tamamlandi).forEach(r=>{
    if(gunfark(r.tarih)!==null&&gunfark(r.tarih)<-30)return;
    koy(r.oncelik||'normal',r.tarih,{ikon:r.tip==='ozel'?'🏠':'📌',metin:r.baslik,seviye:prioBadge(r.oncelik),act:`doneRem(${r.id})`,actAd:'✓'});
  });
  DB.get('cprod').filter(p=>p.bitis_tarihi&&p.durum==='aktif'&&p.oto_yenile!==0).forEach(p=>{
    const g=vadeGun(p.bitis_tarihi); if(g===null||g>60)return;
    const c=DB.get('customers').find(x=>x.id===p.customer_id);
    koy(g<=3?'acil':(g<=30?'onemli':'normal'),p.bitis_tarihi,{ikon:'⏰',metin:`${c?c.ad_soyad+' — ':''}${p.product} vade`,seviye:'',act:`openDetail(${p.customer_id})`,actAd:'Aç'});
  });
  DB.get('customers').filter(c=>c.dogum_tarihi&&(c.durum||'aktif')!=='iptal').forEach(c=>{
    const d=new Date(c.dogum_tarihi), now=new Date(), ty=new Date(now.getFullYear(),d.getMonth(),d.getDate());
    let g=Math.round((ty-now)/864e5); if(g<0)g+=365; if(g>14)return;
    koy(g<=7?'onemli':'normal',ty.toISOString().slice(0,10),{ikon:'🎂',metin:c.ad_soyad+' doğum günü',seviye:'',act:`celebrateBirthday(${c.id})`,actAd:'🎉'});
  });
  DB.get('subs').filter(s=>s.aktif).forEach(s=>{
    const d=subDue(s); if(d.gun>7)return;
    koy(d.gun<=3?'acil':'onemli',d.tarih,{ikon:'🔁',metin:`${s.ad} — ${fmt(s.tutar)}`,seviye:'',act:`subPaid(${s.id})`,actAd:'Ödendi'});
  });
  DB.get('sdays').forEach(s=>{
    const nx=sdayNext(s); if(!nx||nx.gun<0||nx.gun>14)return;
    koy(nx.gun<=7?'onemli':'normal',nx.tarih,{ikon:'💍',metin:s.ad,seviye:'',act:`dayDone(${s.id})`,actAd:'🎉'});
  });
  DB.get('stasks').filter(t=>!t.tamamlandi).forEach(t=>{
    koy(t.oncelik||'normal',t.tarih,{ikon:'✅',metin:t.baslik,seviye:prioBadge(t.oncelik),act:`taskToggle(${t.id})`,actAd:'✓'});
  });
  Object.values(G).forEach(l=>l.sort((a,b)=>((a.alt||'')<(b.alt||'')?-1:1)));
  const baslik={geciken:'⛔ Gecikenler',acil:'🔴 Acil',onemli:'🟡 Önemli',normal:'⚪ Normal'};
  let html='';
  ['geciken','acil','onemli','normal'].forEach(k=>{
    if(!G[k].length)return;
    html+=`<li class="head">${baslik[k]} (${G[k].length})</li>`;
    G[k].slice(0,8).forEach(x=>{ html+=`<li>${x.ikon} ${x.metin} ${x.seviye||''} <span class="badge">${x.alt||''}</span> <button onclick="${x.act}">${x.actAd}</button></li>`; });
  });
  document.getElementById('agendaList').innerHTML=html||'<li>Bugün öncelikli iş yok — keyfine bak ☕</li>';
}
function doneRem(id){const a=DB.get('reminders');const r=a.find(x=>x.id===id);if(r){r.tamamlandi=1;DB.set('reminders',a);renderAll()}}
// --- VADE TAKİBİ ---
function vadeGun(bitis){ if(!bitis)return null; const n=new Date(); n.setHours(0,0,0,0); return Math.round((new Date(bitis)-n)/864e5); }
function vadeKalan(bitis){ const g=vadeGun(bitis); if(g===null)return ''; if(g<0)return Math.abs(g)+' gün geçti ⛔'; if(g===0)return 'bugün!'; return g+' gün kaldı'; }
function remindExpiry(pid){
  const p=DB.get('cprod').find(x=>x.id===pid); if(!p)return;
  const c=DB.get('customers').find(x=>x.id===p.customer_id);
  DB.add('reminders',{baslik:(c?c.ad_soyad+' — ':'')+p.product+' vade: '+(p.bitis_tarihi||''),tarih:p.bitis_tarihi||todayStr(),tip:'is',customer_id:p.customer_id,tamamlandi:0});
  renderAll(); alert('Hatırlatmaya eklendi');
}
// --- YENİLEME: biz / başka yer / durdur ---
function addYear(ds){ if(!ds)return ''; const d=new Date(ds); d.setFullYear(d.getFullYear()+1); return d.toISOString().slice(0,10); }
function addDays(ds,n){ if(!ds)return ''; const d=new Date(ds); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); }
function renewBiz(pid){
  const a=DB.get('cprod'); const p=a.find(x=>x.id===pid); if(!p)return;
  const yeniTutar=prompt(`"${p.product}" yeni dönem tutarı/fiyatı (geçen dönem: ${fmt(p.tutar)}):`,String(p.tutar||''));
  if(yeniTutar===null)return;
  const yeniPrim=prompt(`Yeni dönem primi (geçen dönem: ${fmt(p.prim_tutar)}):`,String(p.prim_tutar||''));
  if(yeniPrim===null)return;
  p.durum='yenilendi'; p.yenileme_kaynagi='biz';
  const yeniBas=p.bitis_tarihi?addDays(p.bitis_tarihi,1):todayStr();
  DB.add('cprod',{customer_id:p.customer_id,product:p.product,tutar:Number(yeniTutar)||0,anapara:Number(p.anapara||p.tutar)||0,guncel_deger:Number(yeniTutar)||0,guncel_tarih:todayStr(),prim_tutar:Number(yeniPrim)||0,prim_durumu:'bekleyen',durum:'aktif',oto_yenile:1,yenileme_kaynagi:'biz',baslangic_tarihi:yeniBas,bitis_tarihi:p.bitis_tarihi?addYear(p.bitis_tarihi):''});
  DB.set('cprod',a); renderAll(); openDetail(detailId,true);
}
// --- GUNCEL DEGER: anapara sabit kalir, bugunku deger guncellenir + nota islenir
function updateDeger(pid){
  const a=DB.get('cprod'); const p=a.find(x=>x.id===pid); if(!p)return;
  const eski=Number(p.guncel_deger||p.tutar||0);
  const y=prompt(`"${p.product}" güncel değeri (anapara: ${fmt(p.anapara)} sabit, şu an: ${fmt(eski)}):`,String(eski));
  if(y===null||y==='')return;
  p.guncel_deger=Number(y)||0; p.guncel_tarih=todayStr(); p.tutar=Number(y)||0;
  DB.set('cprod',a);
  const c=DB.get('customers').find(x=>x.id===p.customer_id);
  DB.add('notes',{baslik:p.product+' değer güncelleme',icerik:`${fmt(eski)} → ${fmt(p.guncel_deger)} (anapara ${fmt(p.anapara)}, kar ${karOf(p)})`,tip:'is',customer_id:p.customer_id,tarih:todayStr()});
  renderAll(); openDetail(detailId,true);
}
function renewDiger(pid){
  const a=DB.get('cprod'); const p=a.find(x=>x.id===pid); if(!p)return;
  if(!confirm(`"${p.product}" başka yerden yapılmış olarak işlensin mi? Bu sene satışına eklenmez, seneye teklif için hatırlatma kurulur.`))return;
  p.durum='digerde'; p.yenileme_kaynagi='diger'; p.oto_yenile=1;
  DB.set('cprod',a);
  const c=DB.get('customers').find(x=>x.id===p.customer_id);
  const teklifTarihi=p.bitis_tarihi?addDays(addYear(p.bitis_tarihi),-30):addDays(todayStr(),335);
  const varMi=DB.get('reminders').some(r=>r.customer_id===p.customer_id&&!r.tamamlandi&&(r.baslik||'').includes(p.product+' teklifi'));
  if(!varMi)DB.add('reminders',{baslik:(c?c.ad_soyad+' — ':'')+p.product+' teklifi (geçen sene başka yerdeydi)',tarih:teklifTarihi,tip:'is',customer_id:p.customer_id,tamamlandi:0});
  renderAll(); openDetail(detailId,true);
}
function remindOffer(pid){
  const p=DB.get('cprod').find(x=>x.id===pid); if(!p)return;
  const c=DB.get('customers').find(x=>x.id===p.customer_id);
  const t=p.bitis_tarihi?addDays(addYear(p.bitis_tarihi),-30):addDays(todayStr(),335);
  DB.add('reminders',{baslik:(c?c.ad_soyad+' — ':'')+p.product+' teklifi',tarih:t,tip:'is',customer_id:p.customer_id,tamamlandi:0});
  renderAll(); alert('Seneye teklif hatırlatması kuruldu: '+t);
}
function stopRenew(pid){
  const n=prompt('Yenileme neden durdurulsun? (örn: arabayı sattı, evi sattı)','sattı'); if(n===null)return;
  const a=DB.get('cprod'); const p=a.find(x=>x.id===pid); if(!p)return;
  p.oto_yenile=0; p.iptal_nedeni=n; DB.set('cprod',a); renderAll(); openDetail(detailId,true);
}
function startRenew(pid){ const a=DB.get('cprod'); const p=a.find(x=>x.id===pid); if(!p)return; p.oto_yenile=1; DB.set('cprod',a); renderAll(); openDetail(detailId,true); }
// --- FOTOGRAF: kimlik fotosunu kucultup profile isler
function uploadPhoto(cid){
  const f=(document.getElementById('photoUp')||{}).files?.[0]; if(!f)return;
  const rd=new FileReader();
  rd.onload=()=>{
    const img=new Image();
    img.onload=()=>{
      const S=160, cv=document.createElement('canvas'); const k=Math.min(1,S/Math.max(img.width,img.height));
      cv.width=Math.round(img.width*k); cv.height=Math.round(img.height*k);
      cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);
      const a=DB.get('customers'); const c=a.find(x=>x.id===cid);
      c.foto=cv.toDataURL('image/jpeg',0.8); DB.set('customers',a);
      renderAll(); openDetail(cid,true);
    };
    img.src=rd.result;
  };
  rd.readAsDataURL(f);
}
// --- DOGUM GUNU KUTLA: hatirlatmayi kapat + nota isle
function celebrateBirthday(cid){
  const a=DB.get('customers'); const c=a.find(x=>x.id===cid); if(!c)return;
  const rs=DB.get('reminders'); let kapat=0;
  rs.forEach(r=>{ if(!r.tamamlandi&&r.customer_id===cid&&(r.tip==='dogumgunu'||(r.baslik||'').toLocaleLowerCase('tr').includes('doğum'))){r.tamamlandi=1;kapat++;} });
  DB.set('reminders',rs);
  DB.add('notes',{baslik:'🎉 Doğum günü kutlandı',icerik:c.ad_soyad+' — '+todayStr()+' tarihinde kutlandı',tip:'ozel',customer_id:cid,tarih:todayStr()});
  renderAll(); alert('Doğum günü kutlandı olarak işlendi 🎉');
}
function renderFinance(){
  const mk=monthKey();
  const inc=DB.get('incomes').filter(i=>(i.tarih||'').startsWith(mk));
  const s=k=>inc.filter(i=>i.kaynak===k).reduce((a,i)=>a+Number(i.tutar),0);
  document.getElementById('fMaas').textContent=fmt(s('Ben Maas'));
  document.getElementById('fPrim').textContent=fmt(s('Prim'));  document.getElementById('fEs').textContent=fmt(s('Es Maas'));
  // Prim hedefi: tahsil + bekleyen/hattaki toplam hedefe oranlanir
  const pg=(DB.get('pgoal')[0]||{});
  const tahsil=s('Prim');
  if(pg.hedef&&pg.ay===mk){
    const hat=ps('bekleyen')+ps('hakedis');
    const yuz=Math.min(100,Math.round(tahsil/pg.hedef*100));
    document.getElementById('phAy').textContent='Bu ay hedefi: '+fmt(pg.hedef);
    document.getElementById('phDurum').textContent=`${fmt(tahsil)} tahsil (%${yuz}) + hatta ${fmt(hat)}`;
    document.getElementById('phBar').style.width=yuz+'%';
  } else {
    document.getElementById('phAy').textContent='Bu ay';
    document.getElementById('phDurum').textContent='Hedef yok — belirle';
    document.getElementById('phBar').style.width='0%';
  }
  const cp=DB.get('cprod').filter(p=>p.durum==='aktif');
  const ps=d=>cp.filter(p=>p.prim_durumu===d).reduce((a,p)=>a+Number(p.prim_tutar||0),0);
  document.getElementById('pBekleyen').textContent=fmt(ps('bekleyen'));
  document.getElementById('pHakedis').textContent=fmt(ps('hakedis'));
  const ipt=DB.get('cprod').filter(p=>p.durum==='iptal').reduce((a,p)=>a+Number(p.prim_tutar||0),0);
  document.getElementById('pIptal').textContent=fmt(ipt);
  // Yenileme ozeti
  const bizN=DB.get('cprod').filter(p=>p.durum==='aktif'&&p.yenileme_kaynagi==='biz'&&(p.baslangic_tarihi||'').startsWith(mk));
  document.getElementById('rBiz').textContent=bizN.length+' ('+fmt(bizN.reduce((a,p)=>a+Number(p.tutar||0),0))+')';
  const diger=DB.get('cprod').filter(p=>p.durum==='digerde');
  document.getElementById('rDiger').textContent=diger.length+' ('+fmt(diger.reduce((a,p)=>a+Number(p.tutar||0),0))+')';
  const yak=DB.get('cprod').filter(p=>p.bitis_tarihi&&p.durum==='aktif'&&p.oto_yenile!==0&&(()=>{const g=vadeGun(p.bitis_tarihi);return g!==null&&g<=60})());
  document.getElementById('rYaklasan').textContent=yak.length;
  const all=[...inc.map(i=>({t:'🟢 '+i.kaynak+' — '+fmt(i.tutar),d:i.tarih+' '+(i.aciklama||'')})),...DB.get('expenses').filter(e=>(e.tarih||'').startsWith(mk)).map(e=>({t:'🔴 '+e.kategori+' — '+fmt(e.tutar),d:e.tarih+' '+(e.aciklama||'')}))];
  document.getElementById('financeList').innerHTML=all.map(x=>`<li>${x.t}<br><small>${x.d}</small></li>`).join('')||'<li>Bu ay hareket yok</li>';
}
function renderNotes(){
  const ns=DB.get('notes').slice().reverse();
  document.getElementById('notesList').innerHTML=ns.map(n=>`<li>${n.tip==='is'?'💼':'🏠'} <b>${n.baslik}</b> <span class="badge">${n.tarih||''}</span><br>${n.icerik||''} <button onclick="DB.del('notes',${n.id});renderAll()">Sil</button></li>`).join('')||'<li>Not yok</li>';
}
// Son 6 ay gelir/gider cubuk grafigi (kutuphanesiz, saf CSS)
function renderChart(){
  const months=[]; const now=new Date();
  for(let i=5;i>=0;i--){ const d=new Date(now.getFullYear(),now.getMonth()-i,1); months.push(d.toISOString().slice(0,7)); }
  const data=months.map(mk=>({
    mk,
    ad:mk.slice(5),
    inc:DB.get('incomes').filter(x=>(x.tarih||'').startsWith(mk)).reduce((s,x)=>s+Number(x.tutar||0),0),
    exp:DB.get('expenses').filter(x=>(x.tarih||'').startsWith(mk)).reduce((s,x)=>s+Number(x.tutar||0),0)
  }));
  const max=Math.max(1,...data.map(d=>Math.max(d.inc,d.exp)));
  document.getElementById('chart').innerHTML=data.map(d=>`
    <div class="bar-group">
      <div style="display:flex;gap:2px;align-items:flex-end;justify-content:center;height:100px">
        <div class="bar in" title="Gelir ${fmt(d.inc)}" style="height:${Math.round(d.inc/max*100)}px;width:14px"></div>
        <div class="bar out" title="Gider ${fmt(d.exp)}" style="height:${Math.round(d.exp/max*100)}px;width:14px"></div>
      </div>${d.ad}<br><small>${d.inc?'🟢':''}${d.exp?'🔴':''}</small>
    </div>`).join('')+`<div class="bar-legend"><span>🟢 Gelir</span><span>🔴 Gider</span></div>`;
}
function renderCalendar(){
  const mk=document.getElementById('calMonth').value||monthKey();
  const [y,m]=mk.split('-').map(Number);
  const first=new Date(y,m-1,1).getDay(); const days=new Date(y,m,0).getDate();
  const rems=DB.get('reminders').filter(r=>(r.tarih||'').startsWith(mk));
  const notes=DB.get('notes').filter(n=>(n.tarih||'').startsWith(mk));
  const vades=DB.get('cprod').filter(p=>(p.bitis_tarihi||'').startsWith(mk)&&p.durum==='aktif'&&p.oto_yenile!==0);
  const ozel=DB.get('sdays').filter(s=>{const nx=sdayNext(s);return nx&&nx.tarih.startsWith(mk)});
  const gorev=DB.get('stasks').filter(t=>(t.tarih||'').startsWith(mk)&&!t.tamamlandi);
  let html='';
  for(let i=0;i<(first+6)%7;i++)html+='<div class="cell empty"></div>';
  for(let d=1;d<=days;d++){
    const ds=`${mk}-${String(d).padStart(2,'0')}`;
    const items=[...rems.filter(r=>r.tarih===ds).map(r=>'📌 '+r.baslik),...notes.filter(n=>n.tarih===ds).map(n=>'📝 '+n.baslik),...vades.filter(p=>p.bitis_tarihi===ds).map(p=>'⏰ '+p.product+' vade'),...ozel.filter(s=>sdayNext(s).tarih===ds).map(s=>'💍 '+s.ad),...gorev.filter(t=>t.tarih===ds).map(t=>'✅ '+t.baslik)];
    html+=`<div class="cell ${ds===todayStr()?'today':''}"><b>${d}</b><br><small>${items.join('<br>')}</small></div>`;
  }
  document.getElementById('calGrid').innerHTML=html;
}
// --- SAHSI ISLER ---
function subDue(s){
  const n=new Date(); n.setHours(0,0,0,0);
  let d;
  if(s.periyot==='yillik'){ d=new Date(n.getFullYear(),(s.ay||1)-1,s.odeme_gunu||1); if(d<n)d.setFullYear(d.getFullYear()+1); }
  else{ d=new Date(n.getFullYear(),n.getMonth(),s.odeme_gunu||1); if(d<n)d.setMonth(d.getMonth()+1); }
  return {tarih:d.toISOString().slice(0,10),gun:Math.round((d-n)/864e5)};
}
function sdayNext(s){
  const n=new Date(); n.setHours(0,0,0,0);
  const mdy=(s.tarih||'').slice(5); if(!mdy)return null;
  let d=new Date(n.getFullYear()+'-'+mdy);
  if(s.tekrar==='yillik'){ if(d<n)d.setFullYear(d.getFullYear()+1); }
  else{ d=new Date(s.tarih); if(d<n&&s.tamamlandi)return null; }
  return {tarih:d.toISOString().slice(0,10),gun:Math.round((d-n)/864e5)};
}
function renderSahsi(){
  // Hedefler + borc/alacak
  const gs=DB.get('goals');
  document.getElementById('goalList').innerHTML=gs.map(g=>{
    const yuz=g.hedef_tutar?Math.min(100,Math.round(Number(g.biriken||0)/Number(g.hedef_tutar)*100)):0;
    const kalan=Number(g.hedef_tutar||0)-Number(g.biriken||0);
    const etiket=g.tip==='hedef'?'💰':(g.tip==='borc'?'🔴 Borç':'🟢 Alacak');
    const alt=g.tip==='hedef'?`${fmt(g.biriken)} / ${fmt(g.hedef_tutar)}`:`Kalan: ${fmt(kalan)} (toplam ${fmt(g.hedef_tutar)})`;
    return `<li>${etiket} <b>${g.ad}</b> <span class="badge">%${yuz}</span><br><div class="prog"><div style="width:${yuz}%"></div></div><small>${alt}${g.tarih?' | '+g.tarih:''}</small><br><button onclick="goalAdd(${g.id})">${g.tip==='hedef'?'+ Para Ekle':'+ Ödeme'}</button> <button onclick="DB.del('goals',${g.id});renderAll()">Sil</button></li>`;
  }).join('')||'<li>Kayıt yok</li>';
  // Abonelikler
  document.getElementById('subManage').innerHTML=DB.get('subs').map(s=>{
    const d=subDue(s);
    return `<li>🔁 <b>${s.ad}</b> — ${fmt(s.tutar)} <span class="badge">${s.periyot} / her ayın ${s.odeme_gunu}. günü</span> ${s.aktif?'':"<span class='badge'>pasif</span>"}<br><small>Sonraki: ${d.tarih} (${d.gun} gün)${s.son_odeme?' | son ödeme: '+s.son_odeme:''}</small><br><button onclick="subPaid(${s.id})">Ödendi (gidere işle)</button> <button onclick="subToggle(${s.id})">${s.aktif?'Pasife Al':'Aktife Al'}</button> <button onclick="DB.del('subs',${s.id});renderAll()">Sil</button></li>`;
  }).join('')||'<li>Abonelik yok</li>';
  // Ozel gunler
  document.getElementById('sdayManage').innerHTML=DB.get('sdays').map(s=>{
    const nx=sdayNext(s);
    return `<li>💍 <b>${s.ad}</b> <span class="badge">${s.tip}</span> <small>${nx?('sıradaki: '+nx.tarih+' ('+nx.gun+' gün)'):'tamamlandı'}</small><br><button onclick="dayDone(${s.id})">🎉 Kutla / Yapıldı</button> <button onclick="DB.del('sdays',${s.id});renderAll()">Sil</button></li>`;
  }).join('')||'<li>Özel gün yok</li>';
  // Gorevler
  const ts=DB.get('stasks').filter(t=>!t.tamamlandi).concat(DB.get('stasks').filter(t=>t.tamamlandi));
  document.getElementById('staskList').innerHTML=ts.map(t=>`<li>${t.tamamlandi?'✅':'⬜'} <b>${t.baslik}</b> ${prioBadge(t.oncelik)} <small>${t.tarih||''}</small> ${t.tamamlandi?'':`<button onclick="taskToggle(${t.id})">✓</button>`} <button onclick="DB.del('stasks',${t.id});renderAll()">Sil</button></li>`).join('')||'<li>Görev yok</li>';
  // Gunum ozetleri
  const sd=DB.get('sdays').map(s=>({s,nx:sdayNext(s)})).filter(x=>x.nx&&x.nx.gun>=0&&x.nx.gun<=30).sort((a,b)=>a.nx.gun-b.nx.gun);
  document.getElementById('sdayList').innerHTML=sd.map(x=>`<li>💍 ${x.s.ad} <span class="badge">${x.nx.gun} gün</span> <small>${x.nx.tarih}</small> <button onclick="dayDone(${x.s.id})">🎉</button></li>`).join('')||'<li>Yaklaşan özel gün yok</li>';
  const sb=DB.get('subs').filter(s=>s.aktif).map(s=>({s,d:subDue(s)})).filter(x=>x.d.gun<=7).sort((a,b)=>a.d.gun-b.d.gun);
  document.getElementById('subList').innerHTML=sb.map(x=>`<li>🔁 ${x.s.ad} — ${fmt(x.s.tutar)} <span class="badge">${x.d.gun} gün</span> <small>${x.d.tarih}</small> <button onclick="subPaid(${x.s.id})">Ödendi</button></li>`).join('')||'<li>Yaklaşan ödeme yok</li>';
}
function goalAdd(id){
  const a=DB.get('goals'); const g=a.find(x=>x.id===id); if(!g)return;
  const y=prompt(`${g.ad} — miktar gir:`, ''); if(y===null||y==='')return;
  g.biriken=Number(g.biriken||0)+Number(y); DB.set('goals',a); renderAll();
}
function subPaid(id){
  const a=DB.get('subs'); const s=a.find(x=>x.id===id); if(!s)return;
  s.son_odeme=todayStr(); DB.set('subs',a);
  DB.add('expenses',{kategori:s.kategori||'Abonelik',tutar:Number(s.tutar)||0,tarih:todayStr(),aciklama:s.ad+' ödemesi'});
  renderAll();
}
function subToggle(id){ const a=DB.get('subs'); const s=a.find(x=>x.id===id); s.aktif=s.aktif?0:1; DB.set('subs',a); renderAll(); }
function dayDone(id){
  const a=DB.get('sdays'); const s=a.find(x=>x.id===id); if(!s)return;
  if(s.tekrar==='yillik'){ const d=new Date(s.tarih); d.setFullYear(d.getFullYear()+1); s.tarih=d.toISOString().slice(0,10); }
  else s.tamamlandi=1;
  DB.set('sdays',a);
  DB.add('notes',{baslik:'🎉 '+s.ad,tarih:todayStr(),icerik:todayStr()+' tarihinde kutlandı/yapıldı',tip:'sahsi'});
  renderAll();
}
function taskToggle(id){ const a=DB.get('stasks'); a.find(x=>x.id===id).tamamlandi=1; DB.set('stasks',a); renderAll(); }
// --- WHATSAPP: numarayi toparla + hazir mesajla ac
function waOpen(tel,msg){
  let d=String(tel||'').replace(/\D/g,'');
  if(!d)return alert('Bu müşteride telefon yok');
  if(d.startsWith('0'))d='90'+d.slice(1);
  window.open('https://wa.me/'+d+'?text='+encodeURIComponent(msg),'_blank');
}
function waBirthday(cid){
  const c=DB.get('customers').find(x=>x.id===cid); if(!c)return;
  waOpen(c.telefon,`Merhaba ${c.ad_soyad}, doğum gününüz kutlu olsun! 🎉 Nice sağlıklı yıllara.`);
}
function waVade(pid){
  const p=DB.get('cprod').find(x=>x.id===pid); if(!p)return;
  const c=DB.get('customers').find(x=>x.id===p.customer_id);
  waOpen(c?c.telefon:'',`Merhaba ${c?c.ad_soyad:''}, ${p.product} poliçenizin vadesi (${p.bitis_tarihi||''}) yaklaşıyor. Yenileme için size uygun bir teklif hazırlayayım mı?`);
}
// --- PDF RAPOR (yazdir -> PDF olarak kaydet) ---
function doPrint(html){ document.getElementById('printArea').innerHTML=html; window.print(); }
function printCustomer(id){
  const c=DB.get('customers').find(x=>x.id===id); if(!c)return;
  const urs=DB.get('cprod').filter(p=>p.customer_id===id);
  const aktif=urs.filter(p=>p.durum==='aktif');
  const top=aktif.reduce((s,p)=>s+Number(p.tutar||0),0);
  const prim=aktif.reduce((s,p)=>s+Number(p.prim_tutar||0),0);
  const notes=DB.get('notes').filter(n=>n.customer_id===id);
  const docs=DB.get('docs').filter(d=>d.customer_id===id);
  const t=new Date().toLocaleDateString('tr-TR');
  const tg=tierOf(id), kidem=tenureOf(c);
  doPrint(`<h2>Müşteri Raporu — ${c.ad_soyad} (${tg.ikon} ${tg.ad})</h2><p>Rapor tarihi: ${t} | Durum: ${c.durum||'aktif'}${kidem?` | Kıdem: ${kidem.metin} (ilk: ${kidem.ilk})`:''}</p>
  ${c.foto?`<img src="${c.foto}" style="width:110px;border-radius:8px">`:''}
  <p>📞 ${c.telefon||'-'} | ✉️ ${c.eposta||'-'} | 🎂 ${c.dogum_tarihi||'-'}${c.dogum_yeri?' | 📍 '+c.dogum_yeri:''}</p>
  <p>📝 ${c.notlar||''}</p>
  <h3>Aktif Ürünler (Toplam: ${fmt(top)} | Prim beklentisi: ${fmt(prim)})</h3>
  <table><tr><th>Ürün</th><th>Tutar</th><th>Anapara</th><th>Güncel</th><th>Kâr</th><th>Prim durumu</th><th>Vade</th></tr>
  ${aktif.map(p=>`<tr><td>${p.product}</td><td>${fmt(p.tutar)}</td><td>${p.anapara?fmt(p.anapara):'-'}</td><td>${p.guncel_deger?fmt(p.guncel_deger)+' ('+(p.guncel_tarih||'')+')':'-'}</td><td>${karOf(p)||'-'}</td><td>${p.prim_durumu}</td><td>${p.bitis_tarihi||''}</td></tr>`).join('')||'<tr><td colspan="7">Aktif ürün yok</td></tr>'}</table>
  <h3>Geçmiş (yenilenen / başka yerde / iptal)</h3>
  <table><tr><th>Ürün</th><th>Tutar</th><th>Durum</th><th>Detay</th></tr>
  ${urs.filter(p=>p.durum!=='aktif').map(p=>`<tr><td>${p.product}</td><td>${fmt(p.tutar)}</td><td>${p.durum}</td><td>${p.iptal_nedeni||p.yenileme_kaynagi||''} ${p.iptal_tarihi||''}</td></tr>`).join('')||'<tr><td colspan="4">Kayıt yok</td></tr>'}</table>
  <h3>Notlar</h3>${notes.map(n=>`<p><b>${n.baslik}</b> (${n.tarih||''}): ${n.icerik||''}</p>`).join('')||'<p>Not yok</p>'}
  <h3>Dokümanlar</h3>${docs.map(d=>`<p>📄 <b>${d.ad}</b> (${d.tip}, ${d.tarih||''})${d.dosya_ad?' — '+d.dosya_ad:''}${d.notlar?' — '+d.notlar:''}</p>`).join('')||'<p>Doküman yok</p>'}`);
}
function printCustomers(){
  const q=(document.getElementById('search').value||'').toLocaleLowerCase('tr');
  const cs=DB.get('customers'), cp=DB.get('cprod');
  let rows=cs.map(c=>({c,urs:cp.filter(p=>p.customer_id===c.id&&p.durum==='aktif'),top:custTotal(c.id)}));
  if(custFilter!=='all')rows=rows.filter(r=>(r.c.durum||'aktif')===custFilter);
  rows=rows.filter(r=>!q||r.c.ad_soyad.toLocaleLowerCase('tr').includes(q));
  const t=new Date().toLocaleDateString('tr-TR');
  const gTop=rows.reduce((s,r)=>s+Number(r.top||0),0);
  doPrint(`<h2>Müşteri Listesi — ${rows.length} kayıt (Toplam: ${fmt(gTop)})</h2><p>Rapor tarihi: ${t} | Filtre: ${custFilter}${q?' | Arama: '+q:''}</p>
  <table><tr><th>Müşteri</th><th>Segment</th><th>Telefon</th><th>Durum</th><th>Ürünler</th><th>Toplam</th></tr>
  ${rows.map(r=>{const tg=tierOf(r.c.id);return `<tr><td>${r.c.ad_soyad}</td><td>${tg.ad}</td><td>${r.c.telefon||'-'}</td><td>${r.c.durum||'aktif'}</td><td>${r.urs.map(u=>u.product+' ('+fmt(u.tutar)+')').join(', ')||'-'}</td><td>${fmt(r.top)}</td></tr>`}).join('')||'<tr><td colspan="6">Kayıt yok</td></tr>'}</table>`);
}
function printMonthly(){  const mk=monthKey();
  const inc=DB.get('incomes').filter(i=>(i.tarih||'').startsWith(mk));
  const exp=DB.get('expenses').filter(i=>(i.tarih||'').startsWith(mk));
  const gSum=a=>a.reduce((s,x)=>s+Number(x.tutar||0),0);
  const byK=k=>gSum(inc.filter(i=>i.kaynak===k));
  const expBy={}; exp.forEach(e=>{expBy[e.kategori]=(expBy[e.kategori]||0)+Number(e.tutar||0)});
  const cp=DB.get('cprod').filter(p=>p.durum==='aktif');
  const primB=cp.filter(p=>p.prim_durumu==='bekleyen').reduce((s,p)=>s+Number(p.prim_tutar||0),0);
  const primH=cp.filter(p=>p.prim_durumu==='hakedis').reduce((s,p)=>s+Number(p.prim_tutar||0),0);
  const bizN=DB.get('cprod').filter(p=>p.durum==='aktif'&&p.yenileme_kaynagi==='biz'&&(p.baslangic_tarihi||'').startsWith(mk));
  const diger=DB.get('cprod').filter(p=>p.durum==='digerde');
  const ayAd=new Date(mk+'-01').toLocaleDateString('tr-TR',{month:'long',year:'numeric'});
  const pgm=(DB.get('pgoal')[0]||{});
  const pgAy=(pgm.hedef&&pgm.ay===mk)?`Hedef ${fmt(pgm.hedef)} — tahsil ${fmt(byK('Prim'))} (%${Math.min(100,Math.round(byK('Prim')/pgm.hedef*100))})`:'Hedef belirlenmedi';
  doPrint(`<h2>Aylık Özet — ${ayAd}</h2>
  <h3>Gelirler (Toplam: ${fmt(gSum(inc))})</h3>
  <table><tr><th>Kaynak</th><th>Tutar</th></tr>
  <tr><td>Maaşım</td><td>${fmt(byK('Ben Maas'))}</td></tr>
  <tr><td>Prim (tahsil)</td><td>${fmt(byK('Prim'))}</td></tr>
  <tr><td>Eş Maaş</td><td>${fmt(byK('Es Maas'))}</td></tr>
  <tr><td>Diğer</td><td>${fmt(byK('Diger'))}</td></tr></table>
  ${inc.filter(i=>i.kaynak==='Prim').map(i=>`<p>• Prim: ${fmt(i.tutar)} — ${i.aciklama||''} (${i.tarih})</p>`).join('')}
  <h3>Giderler (Toplam: ${fmt(gSum(exp))})</h3>
  <table><tr><th>Kategori</th><th>Tutar</th></tr>
  ${Object.keys(expBy).map(k=>`<tr><td>${k}</td><td>${fmt(expBy[k])}</td></tr>`).join('')||'<tr><td colspan="2">Gider yok</td></tr>'}</table>
  <h3>Bakiye: ${fmt(gSum(inc)-gSum(exp))}</h3>
  <h3>Prim hedefi</h3><p>${pgAy}</p>
  <h3>Prim hattı</h3><p>Bekleyen: ${fmt(primB)} | Hakediş: ${fmt(primH)}</p>
  <h3>Yenileme</h3><p>Bu ay bizde yenilenen: ${bizN.length} (${fmt(bizN.reduce((s,p)=>s+Number(p.tutar||0),0))}) | Başka yere giden: ${diger.length}</p>`);
}
renderAll();
