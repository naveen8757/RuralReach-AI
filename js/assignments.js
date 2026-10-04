const user=(()=>{try{return JSON.parse(localStorage.ruralReachUser||'{}')}catch{return {}}})();
let selectedId=localStorage.ruralReachAssignmentId||'';
const $=id=>document.getElementById(id);
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
async function api(u,o){const r=await fetch(u,o);if(!r.ok)throw new Error('Request failed');return r.json()}
async function load(){
  let assignments=[]; try{assignments=await api('/api/assignments')}catch{}
  const submissions=await (async()=>{try{return await api('/api/submissions?studentId='+encodeURIComponent(user.id||''))}catch{return []}})();
  const submitted=new Set(submissions.map(s=>s.assignmentId));
  document.querySelector('.assignment-grid').innerHTML=assignments.length?assignments.map(a=>`<article class="assignment-card"><div class="assignment-icon">📝</div><label>${esc(a.subject)}</label><h2>${esc(a.title)}</h2><p>${esc(a.description||'Professor-assigned coursework')} · ${a.dueDate?'Due '+esc(a.dueDate):'No due date'}</p><span class="badge ${submitted.has(a.id)?'green':'yellow'}">${submitted.has(a.id)?'Submitted':'Sync Online'}</span><button class="btn assignment-btn" data-id="${esc(a.id)}">${submitted.has(a.id)?'View Submission':'Start Assignment →'}</button></article>`).join(''):'<div class="empty-state">No central assignments yet. Your professor can publish coursework from the Professor Hub.</div>';
  document.querySelectorAll('.assignment-btn').forEach(b=>b.onclick=()=>{selectedId=b.dataset.id;localStorage.ruralReachAssignmentId=selectedId;localStorage.ruralReachAssignmentDone=submitted.has(selectedId)?'1':'0';renderStatus(assignments.find(a=>a.id===selectedId),submitted.has(selectedId))});
  if(selectedId)renderStatus(assignments.find(a=>a.id===selectedId),submitted.has(selectedId));
}
function renderStatus(a,done=false){$('assignmentStatus').textContent=a?a.title:'No assignment started';$('assignmentHint').textContent=a?(done?'✓ Submitted to the central network.':'Work can be started offline; completion syncs when online.'):'Choose an assignment above.';$('assignmentProgress').style.width=done?'100%':'0%'}
$('completeAssignment').onclick=async()=>{if(!selectedId){alert('Choose an assignment first.');return}localStorage.ruralReachAssignmentDone='1';try{await api('/api/submissions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({assignmentId:selectedId,studentId:user.id||'RRSTU001',studentName:user.name||'Student',status:'submitted',completedAt:Date.now()})});renderStatus({title:document.getElementById('assignmentStatus').textContent},true)}catch{renderStatus({title:document.getElementById('assignmentStatus').textContent},true);alert('Saved locally. Start the server or reconnect to sync later.')}};
load();
