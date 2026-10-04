let state = "strong";
let manualDemo = false;
let professorStream = null;
let cameraOn = false;
let micOn = false;
let classCode = "RR-2048";
let attendance = {};
let chat = [];

const modes = {
  strong: ["STRONG", "4.8 Mbps", "720p · Adaptive", "Smart Saver is reducing video quality automatically to protect student data.", "3.2 MB", "68%", 5, "720p Adaptive", "ON"],
  weak: ["WEAK", "480 Kbps", "360p · Low Data", "Weak network detected. Switching to compressed video and fewer frames.", "1.1 MB", "88%", 3, "360p Low Data", "ON"],
  offline: ["OFFLINE", "0 Kbps", "Audio + Slides", "Internet unavailable. Continuing with cached audio, slides and notes.", "0 MB", "100%", 1, "Audio + Slides", "MAX"]
};

const $ = id => document.getElementById(id);
function setBars(level) { document.querySelectorAll("#networkBars i").forEach((bar,index)=>bar.classList.toggle("active",index<level)); }
function setNet(){
  const d=modes[state];
  $("networkText").textContent=d[0]; $("sideNetwork").textContent=d[0]; $("networkSpeed").textContent=d[1]; $("qualityLabel").textContent=d[2];
  $("adaptBanner").textContent=d[3]; $("dataUsed").textContent=d[4]; $("saving").textContent=d[5]; $("dataRate").textContent=state==="strong"?"480 KB/min":state==="weak"?"120 KB/min":"0 KB/min";
  $("networkDot").style.background=state==="offline"?"#f59e0b":state==="weak"?"#fbbf24":"#22c55e"; setBars(d[6]);
  $("networkSimulator").textContent=state==="strong"?"Simulate Weak Network":state==="weak"?"Go Offline":"Restore Connection";
  $("connectionMode").textContent=state==="offline"?"Offline":"Online"; $("videoProfile").textContent=d[7]; $("dataSaverState").textContent=d[8];
}
function applyAutomaticNetwork(detail){
  if(manualDemo)return; state=detail.state;
  $("networkDetection").textContent="Automatic"; $("networkLatency").textContent=detail.rtt?`${detail.rtt} ms`:"Not available"; setNet();
}
$("networkSimulator").onclick=()=>{manualDemo=true;state=state==="strong"?"weak":state==="weak"?"offline":"strong";$("networkDetection").textContent="Demo Simulator";$("networkLatency").textContent="Demo";setNet();};
document.querySelectorAll(".quality").forEach(button=>button.onclick=()=>{document.querySelectorAll(".quality").forEach(x=>x.classList.remove("active"));button.classList.add("active"); if(button.dataset.q==="low") {state="weak";setNet();} if(button.dataset.q==="audio"){state="offline";setNet();} if(button.dataset.q==="smart"){manualDemo=false;window.ruralReachNetwork?.refresh();}});
window.addEventListener("ruralreach:network",e=>applyAutomaticNetwork(e.detail));

async function toggleCamera(){
  if(cameraOn){ professorStream?.getVideoTracks().forEach(t=>t.stop()); $("professorVideo").hidden=true; $("cameraPlaceholder").hidden=false; cameraOn=false; $("cameraBtn").textContent="📷 Camera"; $("cameraBadge").textContent="📷 Camera Off"; return; }
  try{
    professorStream=await navigator.mediaDevices.getUserMedia({video:true,audio:micOn});
    $("professorVideo").srcObject=professorStream; $("professorVideo").hidden=false; $("cameraPlaceholder").hidden=true; cameraOn=true;
    $("cameraBtn").textContent="📷 Stop Camera"; $("cameraBadge").textContent="📷 Camera On";
  }catch(e){ alert("Camera access was not available. Allow camera permission and open the class from localhost or HTTPS."); }
}
async function toggleMic(){
  if(!professorStream){
    try{ professorStream=await navigator.mediaDevices.getUserMedia({video:false,audio:true}); }
    catch(e){alert("Microphone access was not available. Allow microphone permission and try again.");return;}
  }
  const tracks=professorStream.getAudioTracks();
  if(!tracks.length){
    try{const s=await navigator.mediaDevices.getUserMedia({audio:true});s.getAudioTracks().forEach(t=>professorStream.addTrack(t));}catch(e){alert("Microphone permission was not granted.");return;}
  }
  const track=professorStream.getAudioTracks()[0]; micOn=!micOn; track.enabled=micOn; $("audioBtn").textContent=micOn?"🎤 Mic On":"🔇 Mic Off";
}
$("cameraBtn").onclick=toggleCamera; $("audioBtn").onclick=toggleMic;
$("pauseBtn").onclick=()=>$("pauseBtn").textContent=$("pauseBtn").textContent.includes("Pause")?"▶ Resume":"Ⅱ Pause";
$("fullscreenBtn").onclick=()=>$("videoStage").requestFullscreen?.();

function initials(name){return String(name||"S").split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase();}
function escapeText(v){return String(v||"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c]));}
function db(){return new Promise((res,rej)=>{const r=indexedDB.open("RuralReachDB",2);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
async function getStudents(){const d=await db();return new Promise((res,rej)=>{if(!d.objectStoreNames.contains("students")){res([]);return;}const q=d.transaction("students","readonly").objectStore("students").getAll();q.onsuccess=()=>res(q.result||[]);q.onerror=()=>rej(q.error);});}

async function loadClassParticipants(){
  const students=await getStudents().catch(()=>[]); window.classStudents=students.slice(0,40);
  // In demo mode all enrolled profiles can appear as connected/absent; attendance is persisted per class session.
  if(!students.length){$("participantGrid").innerHTML='<p class="muted">Add students from Professor Hub to show class participants.</p>';renderAttendance([]);return;}
  if(!Object.keys(attendance).length) students.forEach((s,i)=>attendance[s.id]=i<Math.min(4,students.length));
  renderParticipants(students); renderAttendance(students);
}
function renderParticipants(students){
  const present=students.filter(s=>attendance[s.id]).length; $("liveCount").textContent=`${present} present`;
  $("participantGrid").innerHTML=students.slice(0,18).map(s=>`<div class="participant" title="${escapeText(s.name)}"><div class="participant-avatar">${s.photo?`<img src="${s.photo}" alt="">`:`<span>${initials(s.name)}</span>`}</div><small>${escapeText(s.name)}</small></div>`).join("");
}
function renderAttendance(students){
  const present=students.filter(s=>attendance[s.id]).length; const total=students.length; $("presentCount").textContent=present; $("absentCount").textContent=Math.max(0,total-present); $("attendancePct").textContent=total?Math.round(present/total*100)+"%":"0%";
  $("attendanceList").innerHTML=students.map(s=>`<div class="attendance-row" data-student-att="${escapeText(s.id)}" title="Click to toggle attendance"><div class="attendance-person">${s.photo?`<img src="${s.photo}" alt="">`:`<div class="attendance-avatar">${initials(s.name)}</div>`}<span>${escapeText(s.name)}</span></div><span class="presence ${attendance[s.id]?"present":"absent"}">${attendance[s.id]?"Present":"Not joined"}</span></div>`).join("");
}
$("markAllBtn").onclick=()=>{(window.classStudents||[]).forEach(s=>attendance[s.id]=true);renderParticipants(window.classStudents||[]);renderAttendance(window.classStudents||[]);saveAttendance();syncAllAttendance();};
$("attendanceList").addEventListener("click",async e=>{const row=e.target.closest("[data-student-att]");if(!row)return;const id=row.dataset.studentAtt;attendance[id]=!attendance[id];renderParticipants(window.classStudents||[]);renderAttendance(window.classStudents||[]);saveAttendance();const s=(window.classStudents||[]).find(x=>x.id===id);await syncAttendance(s);});
async function syncAttendance(s){if(!s)return;try{await fetch(`/api/attendance/${encodeURIComponent(classCode)}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({studentId:s.id,name:s.name,present:!!attendance[s.id]})});}catch(e){}}
async function syncAllAttendance(){for(const s of (window.classStudents||[])) await syncAttendance(s);}

function saveAttendance(){localStorage.setItem(`rr_attendance_${classCode}`,JSON.stringify({attendance,updated:Date.now()}));}
function loadAttendance(){try{const x=JSON.parse(localStorage.getItem(`rr_attendance_${classCode}`)||"null");if(x?.attendance)attendance=x.attendance;}catch(e){}}

function addChatMessage(name,text,me=false,time=Date.now()){
  chat.push({name,text,me,time}); if(chat.length>80)chat.shift(); renderChat(); localStorage.setItem(`rr_chat_${classCode}`,JSON.stringify(chat));
}
function renderChat(){const box=$("chatMessages");box.innerHTML=chat.map(m=>`<div class="chat-msg ${m.me?"me":""}"><b>${escapeText(m.name)} · ${new Date(m.time).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</b><span>${escapeText(m.text)}</span></div>`).join("");box.scrollTop=box.scrollHeight;}
function loadChat(){try{chat=JSON.parse(localStorage.getItem(`rr_chat_${classCode}`)||"[]");}catch(e){chat=[];}if(!chat.length)chat=[{name:"Dr. Raman",text:"Welcome to today's Digital Electronics class!",me:false,time:Date.now()}];renderChat();syncChatFromServer();}
async function syncChatFromServer(){try{const r=await fetch(`/api/chat/${encodeURIComponent(classCode)}`);if(!r.ok)return;const remote=await r.json();if(remote.length){chat=remote.map(m=>({name:m.name,text:m.text,me:false,time:m.at}));localStorage.setItem(`rr_chat_${classCode}`,JSON.stringify(chat));renderChat();}}catch(e){}}
setInterval(syncChatFromServer,5000);
$("chatForm").onsubmit=e=>{e.preventDefault();const input=$("chatInput");const text=input.value.trim();if(!text)return;const u=JSON.parse(localStorage.ruralReachUser||"{}");addChatMessage(u.name||"Professor",text,true);input.value="";};

window.addEventListener("beforeunload",()=>{professorStream?.getTracks().forEach(t=>t.stop());});
loadAttendance(); loadClassParticipants(); loadChat(); setNet();

// Phase 6: multi-device WebRTC host mode
let rtcHost=null;
const hostBtn=$('hostClassBtn');
const hostState=$('hostState');
const rtcStatus=$('rtcStatus');
function removeRemoteTile(peerId){const el=document.getElementById(`remote-${peerId}`);if(el)el.remove();}
function addRemoteTile(peerId,stream,meta){
  let wrap=document.getElementById(`remote-${peerId}`);
  if(!wrap){wrap=document.createElement('div');wrap.className='remote-tile';wrap.id=`remote-${peerId}`;wrap.innerHTML=`<video autoplay playsinline></video><div class="remote-name"></div>`;$('participantGrid').prepend(wrap);}
  const v=wrap.querySelector('video');if(v.srcObject!==stream)v.srcObject=stream;wrap.querySelector('.remote-name').textContent=`🟢 ${meta?.name||'Student'}`;
}
async function startHostClass(){
  if(rtcHost){await rtcHost.stop();rtcHost=null;hostBtn.textContent='🔴 Start Live Network Class';hostState.textContent='Not broadcasting to remote students';rtcStatus.textContent='Signaling offline';return;}
  const u=rrJsonUser();
  rtcHost=new RuralReachRTC({code:classCode,role:'host',name:u.name||'Dr. Raman',photo:u.photo||'',onRemoteStream:addRemoteTile,onPeerJoin:async(peer,meta)=>{
    hostState.textContent=`Live · ${meta?.name||'Student'} joined`;rtcStatus.textContent='Live network active';
    const s=(window.classStudents||[]).find(x=>x.id===meta?.studentId||x.name===meta?.name);
    if(s){attendance[s.id]=true;renderParticipants(window.classStudents||[]);renderAttendance(window.classStudents||[]);saveAttendance();syncAttendance(s);}
  },onPeerLeave:(peer)=>{removeRemoteTile(peer);renderParticipants(window.classStudents||[]);},onStatus:(msg)=>{rtcStatus.textContent=msg;}});
  try{await rtcHost.start();hostBtn.textContent='⏹ Stop Live Network Class';hostState.textContent='Waiting for students…';
    if(professorStream)rtcHost.addLocalTracks(professorStream);
    // announce current class metadata
    fetch(`/api/classrooms/${classCode}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:'Logic Gates & Digital Circuits',professor:u.name||'Dr. Raman',status:'live',quality:$('videoProfile').textContent,startedAt:Date.now()})}).catch(()=>{});
  }catch(e){rtcHost=null;alert('Could not start the network classroom. Start the RuralReach server first.');}
}
if(hostBtn)hostBtn.onclick=startHostClass;
const oldToggleCamera=toggleCamera;
// Wrap camera/mic controls so new WebRTC peers receive updated tracks.
toggleCamera=async function(){await oldToggleCamera();if(rtcHost&&professorStream)rtcHost.addLocalTracks(professorStream);};
const oldToggleMic=toggleMic;
toggleMic=async function(){await oldToggleMic();if(rtcHost&&professorStream)rtcHost.addLocalTracks(professorStream);};

// Send chat to the central classroom API as well as the local demo history.
const oldChatSubmit=$('chatForm')?.onsubmit;
if($('chatForm')) $('chatForm').onsubmit=async e=>{e.preventDefault();const input=$('chatInput');const text=input.value.trim();if(!text)return;const u=rrJsonUser();addChatMessage(u.name||'Professor',text,true);input.value='';try{await fetch(`/api/chat/${encodeURIComponent(classCode)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:u.name||'Professor',text})});}catch{} };
window.addEventListener('beforeunload',()=>rtcHost?.stop());

// Phase 7: browser lecture recording
let mediaRecorder=null, recordedChunks=[];
const recordBtn=document.getElementById('recordBtn'), recordingStatus=document.getElementById('recordingStatus'), recordingDownload=document.getElementById('recordingDownload');
if(recordBtn){ recordBtn.onclick=async()=>{
  if(mediaRecorder && mediaRecorder.state==='recording'){ mediaRecorder.stop(); return; }
  if(!professorStream){ try{professorStream=await navigator.mediaDevices.getUserMedia({video:true,audio:true}); $('professorVideo').srcObject=professorStream; $('professorVideo').hidden=false; $('cameraPlaceholder').hidden=true; cameraOn=true; micOn=true; }catch(e){alert('Start camera/microphone first, then record the lecture.');return;} }
  if(!window.MediaRecorder){alert('Lecture recording is not supported by this browser.');return;}
  recordedChunks=[]; let mime='video/webm'; if(MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) mime='video/webm;codecs=vp9,opus';
  mediaRecorder=new MediaRecorder(professorStream,{mimeType:mime}); mediaRecorder.ondataavailable=e=>{if(e.data.size)recordedChunks.push(e.data)}; mediaRecorder.onstop=()=>{const blob=new Blob(recordedChunks,{type:mime});const url=URL.createObjectURL(blob);recordingDownload.href=url;recordingDownload.download=`RuralReach-${classCode}-${new Date().toISOString().slice(0,10)}.webm`;recordingDownload.hidden=false;recordingStatus.textContent=`Recording ready · ${(blob.size/1024/1024).toFixed(1)} MB. Download it for offline lecture distribution.`;recordBtn.textContent='⏺ Record Again';}; mediaRecorder.start(); recordingStatus.textContent='Recording live lecture…';recordBtn.textContent='⏹ Stop Recording';
}; }
