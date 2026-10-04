let rtc=null, localStream=null, studentMic=false, studentCamera=false, classCode='RR-2048';
const $=id=>document.getElementById(id);
function user(){try{return JSON.parse(localStorage.ruralReachUser||'{}')}catch{return {}}}
function escapeText(v){return String(v||'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function addMsg(name,text,me=false){const box=$('studentChatMessages');const el=document.createElement('div');el.className='chat-msg'+(me?' me':'');el.innerHTML=`<b>${escapeText(name)}</b><span>${escapeText(text)}</span>`;box.appendChild(el);box.scrollTop=box.scrollHeight;}
async function loadChat(){try{const r=await fetch(`/api/chat/${encodeURIComponent(classCode)}`);if(r.ok){const a=await r.json();$('studentChatMessages').innerHTML='';a.slice(-60).forEach(m=>addMsg(m.name,m.text,false));}}catch{}}
async function join(){
  classCode=$('joinCode').value.trim()||'RR-2048'; const u=user(); const name=$('joinName').value.trim()||u.name||'Student';
  $('joinCode').value=classCode;$('studentCodeLabel').textContent=classCode;$('profileInfo').textContent=name;$('joinBtn').disabled=true;
  try{
    const room=await fetch(`/api/classrooms/${encodeURIComponent(classCode)}`).then(r=>r.ok?r.json():null); if(room?.title){$('studentClassTitle').textContent=room.title;$('studentClassMeta').textContent=`${room.professor||'Professor'} · ${classCode}`;}
    rtc=new RuralReachRTC({code:classCode,role:'student',name,studentId:u.id||'',photo:u.photo||'',onRemoteStream:(peer,stream,meta)=>{const v=$('teacherVideo');v.srcObject=stream;$('waiting').hidden=true;$('joinStatus').textContent='Live with professor';$('joinDot').classList.add('live');},onStatus:msg=>{$('joinStatus').textContent=msg;}});
    await rtc.start();$('joinStatus').textContent='Joined · waiting for professor';$('joinDot').classList.add('live');$('studentClassMeta').textContent=`Connected as ${name} · ${classCode}`;await loadChat();
  }catch(e){alert('Could not join. Check the class code and make sure the RuralReach server is running.');$('joinBtn').disabled=false;}
}
$('joinBtn').onclick=join;
$('studentMic').onclick=async()=>{if(!localStream){localStream=await navigator.mediaDevices.getUserMedia({audio:true,video:false});}studentMic=!studentMic;localStream.getAudioTracks().forEach(t=>t.enabled=studentMic);$('studentMic').textContent=studentMic?'🎤 Mic On':'🎤 Mic Off';if(rtc)rtc.addLocalTracks(localStream);};
$('studentCamera').onclick=async()=>{if(!localStream){localStream=await navigator.mediaDevices.getUserMedia({audio:false,video:true});}else if(!localStream.getVideoTracks().length){const s=await navigator.mediaDevices.getUserMedia({video:true});s.getVideoTracks().forEach(t=>localStream.addTrack(t));}studentCamera=!studentCamera;localStream.getVideoTracks().forEach(t=>t.enabled=studentCamera);$('studentCamera').textContent=studentCamera?'📷 Camera On':'📷 Camera Off';if(rtc)rtc.addLocalTracks(localStream);};
$('studentLeave').onclick=async()=>{if(rtc)await rtc.stop();localStream?.getTracks().forEach(t=>t.stop());location.href='dashboard.html';};
$('studentChatForm').onsubmit=async e=>{e.preventDefault();const input=$('studentChatInput');const text=input.value.trim();if(!text)return;const u=user();addMsg(u.name||'Student',text,true);input.value='';try{await fetch(`/api/chat/${encodeURIComponent(classCode)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:u.name||'Student',text})});}catch{}};
setInterval(loadChat,5000);
window.addEventListener('ruralreach:network',e=>{const d=e.detail;$('studentQuality').textContent=d.state==='strong'?'720p Adaptive':d.state==='weak'?'360p Low Data':'Audio + Slides';$('studentData').textContent=d.state==='strong'?'Strong connection':d.state==='weak'?'Weak connection · data saver active':'Offline · use cached lecture materials';});
$('joinName').value=user().name||'';
