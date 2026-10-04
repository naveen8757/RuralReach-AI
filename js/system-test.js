(() => {
  const $ = id => document.getElementById(id);
  const API = [
    ['/api/health','Backend Health'],['/api/stats','Platform Stats'],['/api/students','Students'],['/api/classes','Classes'],['/api/assignments','Assignments'],['/api/submissions','Submissions'],['/api/notifications','Notifications'],['/api/announcements','Announcements'],['/api/messages','Messages'],['/api/progress?studentId=RRSTU001','Student Progress'],['/api/analytics','Analytics'],['/api/professor-analytics','Professor Analytics'],['/api/assessment-results?studentId=RRSTU001','Assessment Results'],['/api/projects?studentId=RRSTU001','Projects'],['/api/lectures','Lectures'],['/api/lectures/full','Full Lectures'],['/api/sync/ping','Offline Sync Ping']
  ];
  const PAGES = ['login.html','index.html','dashboard.html','professor-control.html','teacher-dashboard.html','student-classroom.html','classroom.html','lectures.html','assignments.html','assistant.html','ai-learning.html','lecture-ai.html','smart-learning.html','player.html','communication.html','professor-analytics.html','offline-center.html','voice-tutor.html','exam.html','career.html','project-lab.html','system-test.html'];
  let results=[];
  function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function row(title,status,detail){ const cls=status==='PASS'?'pass':status==='WARN'?'warn':'fail'; return `<div class="test-row"><div class="test-icon ${cls}">${status==='PASS'?'✓':status==='WARN'?'!':'×'}</div><div class="test-main"><b>${esc(title)}</b><small>${esc(detail)}</small></div><span class="test-badge ${cls}">${status}</span></div>`; }
  function render(id,items){$(id).innerHTML=items.map(x=>row(x.title,x.status,x.detail)).join('') || '<div class="empty-state">No tests run.</div>';}
  function add(title,status,detail,group='misc'){results.push({title,status,detail,group});}
  async function apiTest(path,label){
    const t=performance.now();
    try{ const r=await fetch(path,{cache:'no-store'}); const ms=Math.round(performance.now()-t); let data=null; try{data=await r.json();}catch{}
      if(r.ok) { add(label,'PASS',`${r.status} OK · ${ms} ms`,'api'); return data; }
      add(label,'FAIL',`${r.status} ${r.statusText||''} · ${ms} ms`,'api');
    }catch(e){ add(label,'FAIL',`Connection failed: ${e.message}. Start node server/server.js.`,'api'); }
  }
  async function pageTest(path){
    const t=performance.now();
    try{const r=await fetch(path,{cache:'no-store'}); const ms=Math.round(performance.now()-t); if(r.ok) add(path,'PASS',`${r.status} OK · ${ms} ms`,'page'); else add(path,'FAIL',`${r.status} ${r.statusText||''}`,'page');}
    catch(e){add(path,'FAIL',`Page request failed: ${e.message}`,'page');}
  }
  function localTests(){
    try{localStorage.setItem('__rr_test__','1');localStorage.removeItem('__rr_test__');add('LocalStorage','PASS','Read/write test succeeded.','local');}catch(e){add('LocalStorage','FAIL',e.message,'local');}
    try{sessionStorage.setItem('__rr_test__','1');sessionStorage.removeItem('__rr_test__');add('SessionStorage','PASS','Read/write test succeeded.','local');}catch(e){add('SessionStorage','FAIL',e.message,'local');}
    if('indexedDB' in window)add('IndexedDB','PASS','Browser IndexedDB API is available.','local');else add('IndexedDB','WARN','Browser does not expose IndexedDB.','local');
    if('caches' in window)add('Cache Storage','PASS','Cache API is available for offline resources.','local');else add('Cache Storage','WARN','Cache API unavailable in this browser.','local');
    if('serviceWorker' in navigator)add('Service Worker','PASS','Service Worker API is available.','local');else add('Service Worker','WARN','Service Worker API unavailable.','local');
  }
  function browserTests(){
    if(navigator.onLine)add('Internet Status','PASS','Browser reports online.','browser');else add('Internet Status','WARN','Browser reports offline.','browser');
    if(navigator.mediaDevices?.getUserMedia)add('Camera/Microphone API','PASS','Media permission API is available.','browser');else add('Camera/Microphone API','WARN','Media capture API unavailable.','browser');
    if('speechSynthesis' in window)add('Text-to-Speech','PASS','Speech synthesis is available.','browser');else add('Text-to-Speech','WARN','Speech synthesis unavailable.','browser');
    if('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)add('Speech Recognition','PASS','Voice recognition API is available.','browser');else add('Speech Recognition','WARN','Voice recognition is browser-dependent; text tutor remains available.','browser');
    if(window.RTCPeerConnection)add('WebRTC','PASS','RTCPeerConnection is available.','browser');else add('WebRTC','WARN','WebRTC API unavailable.','browser');
    if('serviceWorker' in navigator && location.protocol!=='file:')add('PWA Context','PASS','Served from a browser context suitable for service workers.','browser');else add('PWA Context','WARN','Use http://localhost:8080 for full PWA/offline testing.','browser');
  }
  function diagnostics(){
    const issues=results.filter(x=>x.status!=='PASS');
    $('diagnosticCount').textContent=`${issues.length} ISSUE${issues.length===1?'':'S'}`;$('diagnosticCount').className=`test-badge ${issues.length?'warn':'pass'}`;
    $('diagnostics').innerHTML=issues.length?issues.map(x=>`<div class="diagnostic ${x.status==='FAIL'?'danger':''}"><b>${x.status==='FAIL'?'🔴':'🟡'} ${esc(x.title)}</b><span>${esc(x.detail)}</span></div>`).join(''):'<div class="success-box"><b>🟢 No detected issues.</b><p>All automated checks passed. Browser-dependent features should still be manually demonstrated once.</p></div>';
  }
  function summary(){
    const total=results.length,pass=results.filter(x=>x.status==='PASS').length,warn=results.filter(x=>x.status==='WARN').length,fail=results.filter(x=>x.status==='FAIL').length;
    $('totalTests').textContent=total;$('passedTests').textContent=pass;$('warningTests').textContent=warn;$('failedTests').textContent=fail;
    const api=results.filter(x=>x.group==='api'),pages=results.filter(x=>x.group==='page');
    const apiFail=api.some(x=>x.status==='FAIL'),pageFail=pages.some(x=>x.status==='FAIL');
    $('backendBadge').textContent=apiFail?'FAIL':api.length?'PASS':'NOT TESTED';$('backendBadge').className=`test-badge ${apiFail?'fail':api.length?'pass':'pending'}`;
    $('pageBadge').textContent=pageFail?'FAIL':pages.length?'PASS':'NOT TESTED';$('pageBadge').className=`test-badge ${pageFail?'fail':pages.length?'pass':'pending'}`;
    $('lastRun').textContent='Last run: '+new Date().toLocaleString();
    render('apiTests',api);render('pageTests',pages);render('localTests',results.filter(x=>x.group==='local'));render('browserTests',results.filter(x=>x.group==='browser'));diagnostics();
  }
  async function runAll(){
    results=[];render('apiTests',[]);render('pageTests',[]);$('runAll').disabled=true;$('runAll').textContent='⏳ Testing...';
    for(const [path,label] of API) await apiTest(path,label);
    for(const p of PAGES) await pageTest(p);
    localTests();browserTests();summary();$('runAll').disabled=false;$('runAll').textContent='▶ Run All Tests';
  }
  $('runAll').addEventListener('click',runAll);$('clearResults').addEventListener('click',()=>{results=[];summary();});
  summary();
})();
