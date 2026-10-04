let p=+(localStorage.ruralReachLectureProgress||0), selectedId=localStorage.ruralReachSelectedLectureId, builtTitle=localStorage.ruralReachSelectedLecture||"Digital Electronics";
const title= builtTitle;
playerTitle.textContent=title;
function updateProgress(){playerProgressFill.style.width=p+"%";progressText.textContent=p+"%";localStorage.ruralReachLectureProgress=p;slideTitle.textContent=p>=100?"Lecture Completed 🎉":"Learning in progress...";slideText.textContent=p>=100?"You finished this lesson.":"Your progress is saved on this device."}
playBtn.onclick=()=>{p=Math.min(100,p+10);updateProgress()};nextBtn.onclick=()=>{p=Math.min(100,p+20);updateProgress()};previousBtn.onclick=()=>{p=Math.max(0,p-20);updateProgress()};
const noteKey="notes_"+(selectedId||builtTitle);notes.value=localStorage.getItem(noteKey)||"";saveNotes.onclick=()=>{localStorage.setItem(noteKey,notes.value);localStorage.ruralReachLectureNotes="1";noteSaved.textContent=" ✓ Saved locally";setTimeout(()=>noteSaved.textContent="",1500)};
function openDB(){return new Promise((res,rej)=>{const r=indexedDB.open("RuralReachDB",2);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains("content"))d.createObjectStore("content",{keyPath:"id",autoIncrement:true});if(!d.objectStoreNames.contains("students"))d.createObjectStore("students",{keyPath:"id"})};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function loadPublished(){if(!selectedId)return;try{const db=await openDB();const x=await new Promise((res,rej)=>{const t=db.transaction("content","readonly").objectStore("content").get(Number(selectedId));t.onsuccess=()=>res(t.result);t.onerror=()=>rej(t.error)});if(!x){return}
 playerTitle.textContent=x.title;description.textContent=x.description||"Faculty-shared lecture";faculty.textContent=`${x.professor||"Professor"} · ${x.subject||"General"} · ${x.district||"All Tamil Nadu"}`;
 if(x.video){const url=URL.createObjectURL(x.video);videoWrap.hidden=false;video.src=url;video.onloadedmetadata=()=>{if(x.videoSize)fileInfo.textContent=`Video stored offline · ${fmtBytes(x.videoSize)}`};video.onended=()=>{p=100;updateProgress()}}
 if(x.notes){notesFileWrap.hidden=false;notesFileName.textContent=x.notesName||"Lecture notes";downloadNotes.onclick=()=>{const u=URL.createObjectURL(x.notes);const a=document.createElement("a");a.href=u;a.download=x.notesName||"lecture-notes";a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}}
 offlineBadge.textContent=x.downloaded?"✓ Offline Ready":"Local Faculty Content";
 }catch(e){console.error(e)}}
function fmtBytes(n){if(!n)return "";const u=["B","KB","MB","GB"];let i=0,x=n;while(x>=1024&&i<u.length-1){x/=1024;i++}return `${x.toFixed(x>=10||i===0?0:1)} ${u[i]}`}
updateProgress();


async function loadRemote(){
 const raw=localStorage.ruralReachRemoteLecture; if(!raw)return false; let x; try{x=JSON.parse(raw)}catch{return false};
 playerTitle.textContent=x.title||"Remote Lecture"; description.textContent=x.description||"Faculty-shared lecture"; faculty.textContent=`${x.professor||"Professor"} · ${x.subject||"General"} · ${x.district||"All Tamil Nadu"}`;
 const offlineIds=JSON.parse(localStorage.ruralReachRemoteOffline||"[]"); const isOffline=offlineIds.includes(String(x.id));
 async function mediaURL(obj){ if(!obj?.url)return ""; if(isOffline){try{const c=await caches.open("ruralreach-remote-v1"),r=await c.match(obj.url);if(r)return URL.createObjectURL(await r.blob())}catch(_){}} return obj.url; }
 if(x.video){const url=await mediaURL(x.video); if(url){videoWrap.hidden=false;video.src=url;fileInfo.textContent=`${isOffline?"Offline saved":"Central network stream"} · ${fmtBytes(x.video.size||0)}`;video.onended=()=>{p=100;updateProgress()}}}
 if(x.notes){notesFileWrap.hidden=false;notesFileName.textContent=x.notes.name||"Lecture notes";downloadNotes.onclick=async()=>{const url=await mediaURL(x.notes);if(url){const a=document.createElement("a");a.href=url;a.download=x.notes.name||"lecture-notes";a.click()}}}
 offlineBadge.textContent=isOffline?"✓ Offline Ready":"☁ Central Network"; offlineBadge2.textContent=isOffline?"OFFLINE SAVED":"CENTRAL NETWORK"; slideText.textContent=isOffline?"This faculty lecture is saved on your device.":"This lecture is being served by the RuralReach central network.";
 return true;
}
const originalLoadPublished=loadPublished;
loadPublished=async function(){ if(await loadRemote()) return; await originalLoadPublished(); };
loadPublished();
