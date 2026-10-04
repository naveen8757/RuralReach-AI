const L=[
 ["Logic Gates & Digital Circuits","Electronics","Dr. Raman","42 min",1,"Chennai"],
 ["Python Functions & Modular Programming","Programming","Prof. Meena","36 min",1,"Coimbatore"],
 ["Introduction to Embedded Systems","Microcontrollers","Dr. Arun","48 min",0,"Madurai"],
 ["Arrays, Searching & Sorting","Data Structures","Prof. Kiran","51 min",0,"Salem"],
 ["Sensors and Microcontroller Projects","Electronics","Dr. Priya","39 min",0,"Trichy"],
 ["HTML, CSS & Responsive Design","Web Development","Prof. Vishal","44 min",0,"Vellore"]
];
let f="all",district="all";
function cached(){return JSON.parse(localStorage.ruralReachCachedLectures||"[]")}
function openDB(){return new Promise((res,rej)=>{const r=indexedDB.open("RuralReachDB",2);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains("content"))d.createObjectStore("content",{keyPath:"id",autoIncrement:true});if(!d.objectStoreNames.contains("students"))d.createObjectStore("students",{keyPath:"id"})};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function getPublished(){try{const db=await openDB();return await new Promise((res,rej)=>{const t=db.transaction("content","readonly").objectStore("content").getAll();t.onsuccess=()=>res(t.result.filter(x=>x.type==="lecture"));t.onerror=()=>rej(t.error)})}catch(e){return []}}
async function getRemoteLectures(){try{const r=await fetch("/api/lectures");if(!r.ok)throw 0;return await r.json()}catch(e){return []}}
function fmtBytes(n){if(!n)return "0 B";const u=["B","KB","MB","GB"];let i=0,x=n;while(x>=1024&&i<u.length-1){x/=1024;i++}return `${x.toFixed(x>=10||i===0?0:1)} ${u[i]}`}
function setSelected(id){localStorage.ruralReachSelectedLectureId=String(id);localStorage.removeItem("ruralReachSelectedLecture")}
function selectBuilt(title){localStorage.ruralReachSelectedLecture=title;localStorage.removeItem("ruralReachSelectedLectureId")}
async function render(){
 let c=cached(),q=searchInput.value.toLowerCase(),pub=await getPublished(),remote=await getRemoteLectures();
 remote.forEach(r=>{if(!pub.some(x=>x.serverId===r.id)) pub.push({...r,serverId:r.id,remote:true,video:r.video?true:false,notes:r.notes?true:false,videoSize:r.video?.size||0,notesSize:r.notes?.size||0,downloaded:false});});
 lectureGrid.innerHTML="";
 let built=L.filter(x=>(f==="all"||(f==="offline"?(x[4]||c.includes(x[0])):x[1]===f))&&x[0].toLowerCase().includes(q)&&(district==="all"||x[5]===district));
 built.forEach(x=>{let off=x[4]||c.includes(x[0]),a=document.createElement("article");a.className="lecture-card";a.innerHTML=`<label>${x[1]}</label><h3>${x[0]}</h3><p>${x[2]} · ${x[3]} · ${x[5]}</p><small>${off?"✓ Offline Ready":"Online Only"}</small><button class="cache-btn ${off?"cached":""}">${off?"✓ Cached":"＋ Cache Offline"}</button>`;a.onclick=e=>{if(e.target.tagName==="BUTTON"){if(!c.includes(x[0])){c.push(x[0]);localStorage.ruralReachCachedLectures=JSON.stringify(c);render()}return}selectBuilt(x[0]);location.href="player.html"};lectureGrid.appendChild(a)});
 pub.filter(x=>district==="all"||x.district===district||x.district==="All Tamil Nadu").filter(x=>x.title.toLowerCase().includes(q)).forEach(x=>{
   let a=document.createElement("article");a.className="lecture-card published-card";
   let hasVideo=!!x.video,hasNotes=!!x.notes,offline=!!x.downloaded || (x.remote && JSON.parse(localStorage.ruralReachRemoteOffline||"[]").includes(String(x.id)));
   a.innerHTML=`<label>FACULTY SHARED · ${x.district}</label><h3>${escapeHTML(x.title)}</h3><p>${escapeHTML(x.professor)} · ${escapeHTML(x.subject)}</p><small>${hasVideo?"🎥 Video":""}${hasVideo&&hasNotes?" · ":""}${hasNotes?"📄 Notes":""} · ${offline?"✓ Offline Ready":"Available on this device"}</small><div class="published-meta">${hasVideo?`<span>${fmtBytes(x.videoSize)}</span>`:""}${hasNotes?`<span>${fmtBytes(x.notesSize)}</span>`:""}</div><button class="cache-btn download-published">${offline?"✓ Saved Offline":"⬇ Save Offline"}</button><button class="cache-btn open-published">▶ Open Lecture</button>`;
   a.querySelector(".download-published").onclick=async e=>{e.stopPropagation();if(x.remote){localStorage.ruralReachRemoteLecture=JSON.stringify(x);localStorage.ruralReachRemoteDownload=true;try{await fetch(`/api/lectures/${x.id}/download`,{method:"POST"})}catch(_){};alert("Remote lecture selected. Open it to stream/download the available media from the central server.");}else{await markOffline(x.id);}render()};
   a.querySelector(".open-published").onclick=e=>{e.stopPropagation();if(x.remote){localStorage.ruralReachRemoteLecture=JSON.stringify(x);localStorage.removeItem("ruralReachSelectedLectureId");}else setSelected(x.id);location.href="player.html"};
   a.onclick=e=>{if(e.target.tagName!=="BUTTON"){setSelected(x.id);location.href="player.html"}};
   lectureGrid.appendChild(a);
 });
 let builtMb=c.length*6,pubMb=pub.filter(x=>x.downloaded).reduce((n,x)=>n+(x.videoSize||0)+(x.notesSize||0),0)/1024/1024;
 let used=builtMb+pubMb;storageText.textContent=`${used<10?used.toFixed(1):Math.round(used)} MB / 500 MB used`;storageFill.style.width=Math.min(100,used/5)+"%";
}

async function cacheRemoteLecture(x){
  const urls=[]; if(x.video?.url) urls.push(x.video.url); if(x.notes?.url) urls.push(x.notes.url);
  if(!urls.length){alert("This lecture has no downloadable media.");return;}
  try{ const cache=await caches.open("ruralreach-remote-v1"); for(const u of urls){const r=await fetch(u);if(r.ok) await cache.put(u,r.clone());} const ids=JSON.parse(localStorage.ruralReachRemoteOffline||"[]"); if(!ids.includes(String(x.id))) ids.push(String(x.id)); localStorage.ruralReachRemoteOffline=JSON.stringify(ids); localStorage.ruralReachRemoteLecture=JSON.stringify(x); alert("✓ Lecture saved for offline use on this device."); }catch(e){alert("Could not save the remote lecture offline. Check the connection and try again.");}
}
async function markOffline(id){
 const db=await openDB();
 await new Promise((res,rej)=>{
   const tx=db.transaction("content","readwrite"), store=tx.objectStore("content");
   const g=store.get(id);
   g.onsuccess=()=>{const x=g.result;if(!x){rej(new Error("Lecture not found"));return}x.downloaded=true;x.downloads=(x.downloads||0)+1;store.put(x)};
   g.onerror=()=>rej(g.error);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error);
 });
}
function escapeHTML(v){return String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c]))}
document.querySelectorAll(".filter").forEach(b=>b.onclick=()=>{document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");f=b.dataset.filter;render()});
searchInput.oninput=render;districtFilter.onchange=()=>{district=districtFilter.value;render()};render();
