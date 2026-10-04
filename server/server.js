const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'network.json');
const PORT = process.env.PORT || 8080;

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ lectures: [], students: [], downloads: [], classrooms: {}, chat: {}, attendance: {} }, null, 2));

function readDB(){ try { const d=JSON.parse(fs.readFileSync(DB_FILE,'utf8')); d.classrooms ||= {}; d.chat ||= {}; d.attendance ||= {}; d.rtc ||= {}; d.classes ||= []; d.assignments ||= []; d.submissions ||= []; d.notifications ||= []; d.announcements ||= []; d.messages ||= []; d.learning ||= {}; d.assessmentResults ||= []; d.projects ||= []; return d; } catch { return {lectures:[],students:[],downloads:[],classrooms:{},chat:{},attendance:{},classes:[],assignments:[],submissions:[],notifications:[],announcements:[],messages:[],learning:{},assessmentResults:[],projects:[]}; } }
function writeDB(db){ fs.writeFileSync(DB_FILE, JSON.stringify(db,null,2)); }
function rtcClean(d,code){ d.rtc[code] ||= {peers:{},messages:[]}; const now=Date.now(); for(const [id,p] of Object.entries(d.rtc[code].peers)){if(now-p.lastSeen>35000) delete d.rtc[code].peers[id];} d.rtc[code].messages=d.rtc[code].messages.slice(-500); return d.rtc[code]; }
function send(res,status,data,type='application/json'){ res.writeHead(status, {'Content-Type':type,'Access-Control-Allow-Origin':'*','Cache-Control':'no-store'}); res.end(type==='application/json'?JSON.stringify(data):data); }
function body(req){ return new Promise((resolve,reject)=>{ let raw=''; req.on('data',c=>{raw+=c;if(raw.length>120*1024*1024){req.destroy();reject(new Error('Payload too large'));}}); req.on('end',()=>{try{resolve(raw?JSON.parse(raw):{});}catch(e){reject(e)}}); req.on('error',reject); }); }
function safeFileName(name='file'){ return path.basename(name).replace(/[^a-zA-Z0-9._-]/g,'_'); }
function saveDataUrl(dataUrl, name){
  if(typeof dataUrl!=='string' || !dataUrl.startsWith('data:')) return null;
  const m=dataUrl.match(/^data:([^;,]+);base64,(.*)$/s); if(!m) return null;
  const ext=path.extname(safeFileName(name)) || '.bin';
  const id=crypto.randomUUID()+ext;
  const out=path.join(DATA_DIR,id);
  fs.writeFileSync(out,Buffer.from(m[2],'base64'));
  return {id,name:safeFileName(name),type:m[1],size:fs.statSync(out).size,url:`/api/files/${id}`};
}
function decodePdfLiteral(raw){
  return raw.replace(/\\([\\()\\\\])/g,'$1').replace(/\\n/g,' ').replace(/\\r/g,' ').replace(/\\t/g,' ');
}
function extractPdfText(filePath){
  try{
    const buf=fs.readFileSync(filePath);
    let text='';
    const chunks=[];
    const source=buf.toString('latin1');
    const streamRe=/stream\r?\n([\s\S]*?)\r?\nendstream/g;
    let m;
    while((m=streamRe.exec(source))){
      const raw=Buffer.from(m[1],'latin1');
      let data=raw;
      try{ data=zlib.inflateSync(raw); }catch{}
      const str=data.toString('latin1');
      if(/\b(BT|Tj|TJ|Tf)\b/.test(str)) chunks.push(str);
    }
    if(!chunks.length) chunks.push(source);
    for(const str of chunks){
      const blocks=str.match(/BT[\s\S]*?ET/g)||[str];
      for(const block of blocks){
        let x;
        const tj=/\((?:\\.|[^\)])*\)\s*Tj/g;
        while((x=tj.exec(block))){ const m2=x[0].match(/^\((.*)\)\s*Tj$/s); if(m2) text+=' '+decodePdfLiteral(m2[1]); }
        const tjs=/\[(.*?)\]\s*TJ/gs;
        while((x=tjs.exec(block))){ const parts=x[1].match(/\((?:\\.|[^\)])*\)/g)||[]; text+=' '+parts.map(v=>decodePdfLiteral(v.slice(1,-1))).join(' '); }
      }
    }
    return text.replace(/\s+/g,' ').trim().slice(0,200000);
  }catch{return ''}
}
function extractTextFile(filePath,type,name){
  try{
    if(type==='application/pdf' || /\.pdf$/i.test(name)) return extractPdfText(filePath);
    if(/\.(txt|md|vtt|srt)$/i.test(name) || /^text\//i.test(type)){
      return fs.readFileSync(filePath,'utf8').replace(/\r/g,' ').replace(/\s+/g,' ').trim().slice(0,200000);
    }
  }catch{}
  return '';
}
function splitChunks(text,size=900,overlap=120){
  const clean=String(text||'').replace(/\s+/g,' ').trim(); if(!clean)return [];
  const out=[]; let start=0;
  while(start<clean.length && out.length<300){ out.push(clean.slice(start,start+size)); start += size-overlap; }
  return out;
}
function retrieveContext(lecture,q){
  const text=String(lecture.contextText||'').trim();
  if(!text)return [];
  const chunks=lecture.contextChunks?.length?lecture.contextChunks:splitChunks(text);
  const terms=String(q||'').toLowerCase().split(/[^a-z0-9\u0B80-\u0BFF\u0900-\u097F]+/i).filter(w=>w.length>2).slice(0,20);
  return chunks.map((c,i)=>({c,i,score:terms.reduce((n,t)=>n+(c.toLowerCase().includes(t)?1:0),0)})).sort((a,b)=>b.score-a.score).slice(0,3).map(x=>({chunk:x.c,score:x.score,index:x.i+1}));
}
function mime(p){ return {'html':'text/html','js':'text/javascript','css':'text/css','json':'application/json','svg':'image/svg+xml','png':'image/png','jpg':'image/jpeg','jpeg':'image/jpeg','webp':'image/webp','ico':'image/x-icon','mp4':'video/mp4','webm':'video/webm','ogg':'video/ogg','mp3':'audio/mpeg','wav':'audio/wav','pdf':'application/pdf'}[path.extname(p).slice(1)] || 'application/octet-stream'; }

const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,`http://${req.headers.host}`);
  if(req.method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'});return res.end();}
  try{
    if(url.pathname==='/api/health') return send(res,200,{ok:true,service:'RuralReach Central Lecture Network',version:'6.0',time:new Date().toISOString()});
    if(url.pathname==='/api/rtc/join' && req.method==='POST'){ const x=await body(req); const code=String(x.code||'').slice(0,40); const peerId=String(x.peerId||'').slice(0,100); if(!code||!peerId)return send(res,400,{error:'code and peerId required'}); const d=readDB(); const room=rtcClean(d,code); const now=Date.now(); const existing=room.peers[peerId]; room.peers[peerId]={id:peerId,role:x.role==='host'?'host':'student',name:String(x.name||'Participant').slice(0,80),studentId:String(x.studentId||''),photo:String(x.photo||''),lastSeen:now}; if(x.role!=='host'){ for(const [id,p] of Object.entries(room.peers)){ if(p.role==='host' && id!==peerId) room.messages.push({id:crypto.randomUUID(),code,to:id,from:peerId,type:'join',payload:room.peers[peerId],at:now}); } } writeDB(d); return send(res,200,{ok:true,peerId,role:room.peers[peerId].role}); }
    if(url.pathname==='/api/rtc/heartbeat' && req.method==='POST'){ const x=await body(req); const d=readDB(); const room=rtcClean(d,String(x.code||'')); if(room.peers[x.peerId]) room.peers[x.peerId].lastSeen=Date.now(); writeDB(d); return send(res,200,{ok:true}); }
    if(url.pathname==='/api/rtc/messages/' && req.method==='GET') return send(res,404,{error:'use /api/rtc/messages/:code/:peerId'});
    if(url.pathname.startsWith('/api/rtc/messages/') && req.method==='GET'){ const parts=url.pathname.split('/'); const code=decodeURIComponent(parts[4]||''); const peerId=decodeURIComponent(parts[5]||''); const since=Number(url.searchParams.get('since')||0); const d=readDB(); const room=rtcClean(d,code); if(room.peers[peerId]) room.peers[peerId].lastSeen=Date.now(); const messages=room.messages.filter(m=>(m.to===peerId||m.to==='*') && m.at>since); writeDB(d); return send(res,200,{now:Date.now(),messages}); }
    if(url.pathname==='/api/rtc/send' && req.method==='POST'){ const x=await body(req); const d=readDB(); const code=String(x.code||''); const room=rtcClean(d,code); if(!room.peers[x.from])return send(res,404,{error:'sender not joined'}); room.peers[x.from].lastSeen=Date.now(); room.messages.push({id:crypto.randomUUID(),code,to:String(x.to||'*'),from:String(x.from),type:String(x.type||''),payload:x.payload||{},at:Date.now()}); writeDB(d); return send(res,201,{ok:true}); }
    if(url.pathname==='/api/rtc/leave' && req.method==='POST'){ const x=await body(req); const d=readDB(); const code=String(x.code||''); const room=rtcClean(d,code); const peerId=String(x.peerId||''); if(room.peers[peerId]){delete room.peers[peerId];room.messages.push({id:crypto.randomUUID(),code,to:'*',from:peerId,type:'leave',payload:{},at:Date.now()});} writeDB(d); return send(res,200,{ok:true}); }
    if(url.pathname.startsWith('/api/rtc/peers/') && req.method==='GET'){ const code=decodeURIComponent(url.pathname.split('/')[4]||''); const d=readDB(); const room=rtcClean(d,code); writeDB(d); return send(res,200,Object.values(room.peers)); }

    if(url.pathname==='/api/learning/event' && req.method==='POST'){ const x=await body(req); const sid=String(x.studentId||'guest').slice(0,100); const d=readDB(); d.learning[sid] ||= []; d.learning[sid].push({type:String(x.type||'study'),subject:String(x.subject||'general'),percent:Number(x.percent||0),minutes:Number(x.minutes||0),at:Number(x.at||Date.now())}); d.learning[sid]=d.learning[sid].slice(-500); writeDB(d); return send(res,201,{ok:true,total:d.learning[sid].length}); }
    if(url.pathname==='/api/learning/summary' && req.method==='GET'){ const sid=String(url.searchParams.get('studentId')||'guest'); const d=readDB(); const events=d.learning[sid]||[]; const quizzes=events.filter(e=>e.type==='quiz'); return send(res,200,{events,quizCount:quizzes.length,averageQuiz:quizzes.length?Math.round(quizzes.reduce((a,e)=>a+e.percent,0)/quizzes.length):0,studyMinutes:events.reduce((a,e)=>a+Number(e.minutes||0),0)}); }
    if(url.pathname==='/api/learning/class-summary' && req.method==='GET'){ const d=readDB(); const all=Object.values(d.learning||{}).flat(); const quizzes=all.filter(e=>e.type==='quiz'); return send(res,200,{students:Object.keys(d.learning||{}).length,events:all.length,quizzes:quizzes.length,averageQuiz:quizzes.length?Math.round(quizzes.reduce((a,e)=>a+e.percent,0)/quizzes.length):0}); }
    if(url.pathname==='/api/stats' && req.method==='GET') { const d=readDB(); return send(res,200,{lectures:d.lectures.length,students:d.students.length,downloads:d.downloads.length,districts:[...new Set(d.lectures.map(x=>x.district).filter(Boolean))].length}); }
    if(url.pathname.startsWith('/api/classrooms/') && req.method==='GET'){ const code=decodeURIComponent(url.pathname.split('/')[3]||''); const d=readDB(); return send(res,200,d.classrooms[code]||{code,status:'idle',title:'',professor:'',quality:'720p Adaptive',startedAt:null}); }
    if(url.pathname.startsWith('/api/classrooms/') && req.method==='POST'){ const code=decodeURIComponent(url.pathname.split('/')[3]||''); const x=await body(req); const d=readDB(); d.classrooms[code]={code,title:String(x.title||''),professor:String(x.professor||''),status:String(x.status||'live'),quality:String(x.quality||'720p Adaptive'),startedAt:x.startedAt||Date.now(),updated:Date.now()}; writeDB(d); return send(res,200,d.classrooms[code]); }
    if(url.pathname.startsWith('/api/chat/') && req.method==='GET'){ const code=decodeURIComponent(url.pathname.split('/')[3]||''); const d=readDB(); return send(res,200,d.chat[code]||[]); }
    if(url.pathname.startsWith('/api/chat/') && req.method==='POST'){ const code=decodeURIComponent(url.pathname.split('/')[3]||''); const x=await body(req); if(!x.text)return send(res,400,{error:'message required'}); const d=readDB(); d.chat[code] ||= []; const m={id:crypto.randomUUID(),name:String(x.name||'Participant'),text:String(x.text).slice(0,240),at:Date.now()}; d.chat[code].push(m); d.chat[code]=d.chat[code].slice(-100); writeDB(d); return send(res,201,m); }
    if(url.pathname.startsWith('/api/attendance/') && req.method==='GET'){ const code=decodeURIComponent(url.pathname.split('/')[3]||''); const d=readDB(); return send(res,200,d.attendance[code]||{}); }
    if(url.pathname.startsWith('/api/attendance/') && req.method==='POST'){ const code=decodeURIComponent(url.pathname.split('/')[3]||''); const x=await body(req); if(!x.studentId)return send(res,400,{error:'studentId required'}); const d=readDB(); d.attendance[code] ||= {}; d.attendance[code][String(x.studentId)]={present:!!x.present,at:Date.now(),name:String(x.name||'')}; writeDB(d); return send(res,200,d.attendance[code][String(x.studentId)]); }
    if(url.pathname==='/api/classes' && req.method==='GET'){ const d=readDB(); return send(res,200,d.classes||[]); }
    if(url.pathname==='/api/classes' && req.method==='POST'){ const x=await body(req); const d=readDB(); d.classes ||= []; const code=String(x.code||('RR-'+Date.now().toString(36).slice(-6))).toUpperCase(); if(d.classes.some(c=>c.code===code)) return send(res,409,{error:'class code already exists'}); const c={code,title:String(x.title||'Untitled Class'),subject:String(x.subject||''),professor:String(x.professor||''),district:String(x.district||'All Tamil Nadu'),schedule:x.schedule||null,status:'scheduled',created:Date.now(),students:Array.isArray(x.students)?x.students:[],sessions:0}; d.classes.push(c); writeDB(d); return send(res,201,c); }
    if(url.pathname.startsWith('/api/classes/') && req.method==='DELETE'){ const code=decodeURIComponent(url.pathname.split('/')[3]||''); const d=readDB(); d.classes=(d.classes||[]).filter(c=>c.code!==code); writeDB(d); return send(res,200,{ok:true}); }
    if(url.pathname.startsWith('/api/classes/') && req.method==='POST'){ const code=decodeURIComponent(url.pathname.split('/')[3]||''); const x=await body(req); const d=readDB(); d.classes ||= []; const c=d.classes.find(v=>v.code===code); if(!c)return send(res,404,{error:'class not found'}); Object.assign(c,{title:x.title!==undefined?String(x.title):c.title,subject:x.subject!==undefined?String(x.subject):c.subject,professor:x.professor!==undefined?String(x.professor):c.professor,district:x.district!==undefined?String(x.district):c.district,schedule:x.schedule!==undefined?x.schedule:c.schedule,status:x.status!==undefined?String(x.status):c.status,students:Array.isArray(x.students)?x.students:c.students,updated:Date.now()}); if(x.status==='live')c.sessions=(c.sessions||0)+1; writeDB(d); return send(res,200,c); }
    if(url.pathname==='/api/assignments' && req.method==='GET'){ const d=readDB(); return send(res,200,d.assignments||[]); }
    if(url.pathname==='/api/assignments' && req.method==='POST'){ const x=await body(req); if(!x.title||!x.professor)return send(res,400,{error:'title and professor are required'}); const d=readDB(); d.assignments ||= []; const a={id:'AS-'+Date.now().toString(36).toUpperCase(),title:String(x.title),subject:String(x.subject||'General'),description:String(x.description||''),dueDate:x.dueDate||null,professor:String(x.professor),classCode:String(x.classCode||''),created:Date.now(),submissions:0}; d.assignments.push(a); d.notifications ||= []; d.notifications.push({id:crypto.randomUUID(),type:'assignment',title:'New assignment',message:`${a.title} was posted by ${a.professor}.`,classCode:a.classCode,at:Date.now()}); writeDB(d); return send(res,201,a); }
    if(url.pathname.startsWith('/api/assignments/') && req.method==='DELETE'){ const id=url.pathname.split('/')[3]; const d=readDB(); d.assignments=(d.assignments||[]).filter(a=>a.id!==id); writeDB(d); return send(res,200,{ok:true}); }
    if(url.pathname==='/api/submissions' && req.method==='GET'){ const studentId=String(url.searchParams.get('studentId')||''); const d=readDB(); return send(res,200,(d.submissions||[]).filter(s=>!studentId||s.studentId===studentId)); }
    if(url.pathname==='/api/submissions' && req.method==='POST'){ const x=await body(req); if(!x.assignmentId||!x.studentId)return send(res,400,{error:'assignmentId and studentId required'}); const d=readDB(); d.submissions ||= []; let sub=d.submissions.find(s=>s.assignmentId===String(x.assignmentId)&&s.studentId===String(x.studentId)); if(!sub){sub={id:crypto.randomUUID(),assignmentId:String(x.assignmentId),studentId:String(x.studentId),studentName:String(x.studentName||''),status:'submitted',completedAt:null,updated:Date.now()};d.submissions.push(sub); const a=d.assignments.find(a=>a.id===sub.assignmentId); if(a)a.submissions=(a.submissions||0)+1;} Object.assign(sub,{status:String(x.status||'submitted'),completedAt:x.completedAt||Date.now(),score:x.score??sub.score,updated:Date.now()}); writeDB(d); return send(res,200,sub); }
    if(url.pathname==='/api/notifications' && req.method==='GET'){ const studentId=String(url.searchParams.get('studentId')||''); const d=readDB(); const list=(d.notifications||[]).filter(n=>!n.recipientId||n.recipientId==='*'||n.recipientId===studentId); return send(res,200,list.slice(-80).reverse()); }
    if(url.pathname==='/api/notifications/read' && req.method==='POST'){ const x=await body(req); const d=readDB(); d.notifications ||= []; for(const n of d.notifications){ if(n.id===x.id && (!n.recipientId||n.recipientId===x.studentId||n.recipientId==='*')) n.readBy ||= []; if(n.id===x.id){n.readBy ||= []; if(x.studentId && !n.readBy.includes(x.studentId)) n.readBy.push(x.studentId);} } writeDB(d); return send(res,200,{ok:true}); }
    if(url.pathname==='/api/announcements' && req.method==='GET'){ const d=readDB(); const classCode=String(url.searchParams.get('classCode')||''); const list=(d.announcements||[]).filter(a=>!classCode||!a.classCode||a.classCode===classCode); return send(res,200,list.slice(-50).reverse()); }
    if(url.pathname==='/api/announcements' && req.method==='POST'){ const x=await body(req); if(!x.title||!x.message||!x.professor)return send(res,400,{error:'title, message and professor are required'}); const d=readDB(); d.announcements ||= []; const a={id:'AN-'+Date.now().toString(36).toUpperCase(),title:String(x.title).slice(0,120),message:String(x.message).slice(0,1000),professor:String(x.professor).slice(0,100),classCode:String(x.classCode||''),priority:String(x.priority||'normal'),created:Date.now()}; d.announcements.push(a); d.notifications ||= []; const recipients=(d.students||[]).filter(st=>!a.classCode || (d.classes||[]).some(c=>c.code===a.classCode && (!c.students?.length || c.students.includes(st.id)))); if(recipients.length){ for(const st of recipients) d.notifications.push({id:crypto.randomUUID(),type:'announcement',title:a.title,message:a.message,recipientId:st.id,classCode:a.classCode,at:a.created}); } else d.notifications.push({id:crypto.randomUUID(),type:'announcement',title:a.title,message:a.message,recipientId:'*',classCode:a.classCode,at:a.created}); writeDB(d); return send(res,201,a); }
    if(url.pathname==='/api/messages' && req.method==='GET'){ const studentId=String(url.searchParams.get('studentId')||''); const d=readDB(); const list=(d.messages||[]).filter(m=>m.to==='*'||m.to===studentId||m.from===studentId); return send(res,200,list.slice(-100).reverse()); }
    if(url.pathname==='/api/messages' && req.method==='POST'){ const x=await body(req); if(!x.text||!x.from)return send(res,400,{error:'from and text are required'}); const d=readDB(); d.messages ||= []; const m={id:crypto.randomUUID(),from:String(x.from),fromName:String(x.fromName||'Professor'),to:String(x.to||'*'),text:String(x.text).slice(0,500),classCode:String(x.classCode||''),at:Date.now()}; d.messages.push(m); d.notifications ||= []; if(m.to!=='*') d.notifications.push({id:crypto.randomUUID(),type:'message',title:'New message from '+m.fromName,message:m.text,recipientId:m.to,classCode:m.classCode,at:m.at}); writeDB(d); return send(res,201,m); }
    if(url.pathname==='/api/progress' && req.method==='GET'){ const studentId=String(url.searchParams.get('studentId')||''); const d=readDB(); return send(res,200,(d.submissions||[]).filter(s=>s.studentId===studentId)); }
    if(url.pathname==='/api/assignments/summary' && req.method==='GET'){ const d=readDB(); return send(res,200,{assignments:(d.assignments||[]).length,submissions:(d.submissions||[]).length,pending:(d.assignments||[]).length-(d.submissions||[]).length}); }
    if(url.pathname==='/api/professor-analytics' && req.method==='GET'){
      const d=readDB();
      const students=d.students||[];
      const classes=d.classes||[];
      const learning=d.learning||{};
      const submissions=d.submissions||[];
      const assignments=d.assignments||[];
      const attendance=d.attendance||{};
      const lectures=d.lectures||[];
      const downloads=d.downloads||[];
      const classByCode=Object.fromEntries(classes.map(c=>[c.code,c]));
      const subjectStats={};
      const studentRows=students.map(st=>{
        const events=learning[st.id]||[];
        const quiz=events.filter(e=>e.type==='quiz');
        const study=events.filter(e=>e.type==='study');
        const subj={};
        for(const e of events){ if(!e.subject||e.subject==='mixed'||e.subject==='planned') continue; const a=subj[e.subject] ||= []; a.push(Number(e.percent||0)); }
        for(const [sub,vals] of Object.entries(subj)){ subjectStats[sub] ||= []; subjectStats[sub].push(...vals); }
        const mastery=Object.values(subj).length ? Math.round(Object.values(subj).reduce((sum,v)=>sum+v.reduce((a,b)=>a+b,0)/v.length,0)/Object.values(subj).length) : 0;
        const subRows=submissions.filter(x=>x.studentId===st.id);
        const assigned=assignments.filter(a=>!a.classCode || classes.some(c=>c.code===a.classCode && (!c.students?.length || c.students.includes(st.id))));
        const submitted=new Set(subRows.map(x=>x.assignmentId));
        const attendanceRows=Object.values(attendance).flatMap(rows=>Object.entries(rows).filter(([id])=>id===st.id).map(([,v])=>v));
        const attPct=attendanceRows.length?Math.round(attendanceRows.filter(x=>x.present).length/attendanceRows.length*100):0;
        const avgQuiz=quiz.length?Math.round(quiz.reduce((a,e)=>a+Number(e.percent||0),0)/quiz.length):0;
        const engagement=Math.min(100,Math.round((Math.min(60,study.reduce((a,e)=>a+Number(e.minutes||0),0))/60*50)+(Math.min(quiz.length,5)/5*30)+(attPct/100*20)));
        const weak=Object.entries(subj).map(([k,v])=>[k,Math.round(v.reduce((a,b)=>a+b,0)/v.length)]).sort((a,b)=>a[1]-b[1])[0];
        const risk=mastery<50 || (assigned.length>0 && submitted.size/assigned.length<0.5) || (attendanceRows.length>=2 && attPct<70);
        return {id:st.id,name:st.name,college:st.college,district:st.district,course:st.course,year:st.year,mastery,avgQuiz,studyMinutes:study.reduce((a,e)=>a+Number(e.minutes||0),0),assignments:assigned.length,submitted:subRows.length,assignmentRate:assigned.length?Math.round(subRows.length/assigned.length*100):0,attendance:attPct,engagement,weakSubject:weak?weak[0]:'Not enough data',risk};
      });
      const subjectRows=Object.entries(subjectStats).map(([subject,vals])=>({subject,average:Math.round(vals.reduce((a,b)=>a+b,0)/vals.length),events:vals.length})).sort((a,b)=>a.average-b.average);
      const totalDownloads=downloads.length;
      const lectureEngagement=lectures.map(l=>({id:l.id,title:l.title,subject:l.subject||'General',downloads:Number(l.downloads||0),district:l.district||'All Tamil Nadu'})).sort((a,b)=>b.downloads-a.downloads);
      const sessionQuality=Object.values(d.classrooms||{}).map(c=>({code:c.code,quality:c.quality||'Unknown',status:c.status||'idle',title:c.title||''}));
      const qualityCounts={}; for(const x of sessionQuality) qualityCounts[x.quality]=(qualityCounts[x.quality]||0)+1;
      const allAtt=Object.values(attendance).flatMap(rows=>Object.values(rows));
      const attendancePct=allAtt.length?Math.round(allAtt.filter(x=>x.present).length/allAtt.length*100):0;
      const avgMastery=studentRows.length?Math.round(studentRows.reduce((a,s)=>a+s.mastery,0)/studentRows.length):0;
      const avgEngagement=studentRows.length?Math.round(studentRows.reduce((a,s)=>a+s.engagement,0)/studentRows.length):0;
      const recommendations=[];
      const weak=subjectRows.slice(0,3).filter(x=>x.average<70);
      if(weak.length) recommendations.push({level:'high',title:'Target weak subjects',text:`Prioritize ${weak.map(x=>x.subject).join(', ')} with short revision lectures and quizzes.`});
      const atRisk=studentRows.filter(s=>s.risk);
      if(atRisk.length) recommendations.push({level:'high',title:'Follow up with at-risk students',text:`${atRisk.length} student${atRisk.length>1?'s':''} show low mastery, attendance, assignment completion, or engagement.`});
      if(attendancePct<75) recommendations.push({level:'medium',title:'Improve attendance',text:'Send a class reminder before the next live session and provide an offline lecture for students who miss it.'});
      if(totalDownloads<Math.max(1,lectures.length)) recommendations.push({level:'medium',title:'Increase offline coverage',text:'Encourage students to download lectures before weak-connectivity periods.'});
      if(!recommendations.length) recommendations.push({level:'low',title:'Learning is on track',text:'Keep monitoring mastery and engagement, and publish targeted revision content when scores fall.'});
      return send(res,200,{generatedAt:Date.now(),overview:{students:students.length,classes:classes.length,lectures:lectures.length,downloads:totalDownloads,attendance:attendancePct,avgMastery,avgEngagement,atRisk:atRisk.length},students:studentRows,subjects:subjectRows,lectures:lectureEngagement,network:{sessions:sessionQuality,qualityCounts},recommendations});
    }
    if(url.pathname==='/api/assessment-results' && req.method==='GET'){ const studentId=String(url.searchParams.get('studentId')||''); const d=readDB(); return send(res,200,(d.assessmentResults||[]).filter(x=>!studentId||x.studentId===studentId).slice(-100).reverse()); }
    if(url.pathname==='/api/assessment-results' && req.method==='POST'){ const x=await body(req); if(!x.studentId||!x.subject||x.percent===undefined)return send(res,400,{error:'studentId, subject and percent are required'}); const d=readDB(); d.assessmentResults ||= []; const r={id:String(x.id||crypto.randomUUID()),studentId:String(x.studentId),studentName:String(x.studentName||'Student'),subject:String(x.subject),score:Number(x.score||0),percent:Number(x.percent||0),topics:x.topics||{},questions:Number(x.questions||0),at:Number(x.at||Date.now())}; d.assessmentResults.push(r); d.assessmentResults=d.assessmentResults.slice(-1000); writeDB(d); return send(res,201,r); }
    if(url.pathname==='/api/projects' && req.method==='GET'){ const studentId=String(url.searchParams.get('studentId')||''); const d=readDB(); return send(res,200,(d.projects||[]).filter(x=>!studentId||x.studentId===studentId).slice(-100).reverse()); }
    if(url.pathname==='/api/projects' && req.method==='POST'){ const x=await body(req); if(!x.studentId||!x.topic)return send(res,400,{error:'studentId and topic are required'}); const d=readDB(); d.projects ||= []; const project={id:String(x.id||crypto.randomUUID()),studentId:String(x.studentId),topic:String(x.topic).slice(0,140),track:String(x.track||'General'),difficulty:String(x.difficulty||'Intermediate'),goal:String(x.goal||'').slice(0,1000),features:Array.isArray(x.features)?x.features.slice(0,12):[],stack:Array.isArray(x.stack)?x.stack.slice(0,12):[],milestones:Array.isArray(x.milestones)?x.milestones.slice(0,12):[],created:Number(x.created||Date.now())}; d.projects.push(project); d.projects=d.projects.slice(-1000); writeDB(d); return send(res,201,project); }
    if(url.pathname==='/api/analytics' && req.method==='GET'){ const d=readDB(); const attendance=d.attendance||{}; const attendanceSessions=Object.entries(attendance).map(([code,rows])=>({code,total:Object.keys(rows).length,present:Object.values(rows).filter(v=>v.present).length})); const classes=d.classes||[]; return send(res,200,{classes:classes.length,liveClasses:classes.filter(c=>c.status==='live').length,students:d.students.length,lectures:d.lectures.length,downloads:d.downloads.length,chatMessages:Object.values(d.chat||{}).reduce((n,a)=>n+a.length,0),attendanceSessions}); }
    if(url.pathname==='/api/lectures' && req.method==='GET') { const d=readDB(); return send(res,200,d.lectures.map(({videoData,notesData,...x})=>x)); }
    if(url.pathname==='/api/lectures/full' && req.method==='GET') { const d=readDB(); return send(res,200,d.lectures); }
    if(url.pathname==='/api/lectures' && req.method==='POST') {
      const x=await body(req); if(!x.title||!x.professor) return send(res,400,{error:'title and professor are required'});
      const d=readDB(); const id='RR-'+Date.now().toString(36).toUpperCase();
      let video= x.videoData ? saveDataUrl(x.videoData,x.videoName) : null;
      let notes= x.notesData ? saveDataUrl(x.notesData,x.notesName) : null;
      let transcript= x.transcriptData ? saveDataUrl(x.transcriptData,x.transcriptName||'transcript.txt') : null;
      let contextText=String(x.transcriptText||'').trim();
      if(!contextText && notes?.id) contextText=extractTextFile(path.join(DATA_DIR,notes.id),notes.type,notes.name);
      if(!contextText && transcript?.id) contextText=extractTextFile(path.join(DATA_DIR,transcript.id),transcript.type,transcript.name);
      const lecture={id,type:'lecture',title:String(x.title),subject:String(x.subject||'General'),district:String(x.district||'All Tamil Nadu'),professor:String(x.professor),description:String(x.description||''),video,notes,transcript,contextText:contextText.slice(0,200000),contextChunks:splitChunks(contextText),contextSource:contextText?'lecture notes / transcript':'metadata only',created:Date.now(),downloads:0};
      d.lectures.push(lecture); writeDB(d); return send(res,201,lecture);
    }
    if(url.pathname.startsWith('/api/lectures/') && url.pathname.endsWith('/context') && req.method==='GET'){
      const id=decodeURIComponent(url.pathname.split('/')[3]||''); const d=readDB(); const l=d.lectures.find(v=>v.id===id);
      if(!l)return send(res,404,{error:'lecture not found'});
      const q=url.searchParams.get('q')||''; const hits=retrieveContext(l,q);
      return send(res,200,{id:l.id,title:l.title,subject:l.subject,professor:l.professor,source:l.contextSource||'metadata only',hasContext:!!l.contextText,characters:(l.contextText||'').length,chunks:(l.contextChunks||[]).length,hits});
    }
    if(url.pathname.startsWith('/api/lectures/') && url.pathname.endsWith('/reindex') && req.method==='POST'){
      const id=decodeURIComponent(url.pathname.split('/')[3]||''); const d=readDB(); const l=d.lectures.find(v=>v.id===id);
      if(!l)return send(res,404,{error:'lecture not found'});
      if(l.notes?.id){ const t=extractTextFile(path.join(DATA_DIR,l.notes.id),l.notes.type,l.notes.name); if(t) l.contextText=t; }
      if(!l.contextText && l.transcript?.id){ const t=extractTextFile(path.join(DATA_DIR,l.transcript.id),l.transcript.type,l.transcript.name); if(t) l.contextText=t; }
      l.contextChunks=splitChunks(l.contextText); l.contextSource=l.contextText?'lecture notes / transcript':'metadata only'; writeDB(d);
      return send(res,200,{ok:true,source:l.contextSource,characters:(l.contextText||'').length,chunks:l.contextChunks.length});
    }
    if(url.pathname.startsWith('/api/files/') && req.method==='GET') { const id=path.basename(url.pathname); const f=path.join(DATA_DIR,id); if(!fs.existsSync(f)) return send(res,404,{error:'file not found'}); res.writeHead(200,{'Content-Type':mime(f),'Access-Control-Allow-Origin':'*','Cache-Control':'public,max-age=31536000'}); return fs.createReadStream(f).pipe(res); }
    if(url.pathname==='/api/students' && req.method==='GET'){ const d=readDB(); return send(res,200,d.students.map(({password,...s})=>s)); }
    if(url.pathname==='/api/students' && req.method==='POST'){ const x=await body(req); if(!x.id||!x.name)return send(res,400,{error:'student id and name required'}); const d=readDB(); if(d.students.some(s=>s.id===x.id))return send(res,409,{error:'student id already exists'}); const s={id:String(x.id),name:String(x.name),college:String(x.college||''),district:String(x.district||''),course:String(x.course||''),year:String(x.year||''),password:String(x.password||'1234'),photo:x.photo||'',created:Date.now()}; d.students.push(s);writeDB(d);const {password,...safe}=s;return send(res,201,safe); }
    if(url.pathname==='/api/sync/ping' && req.method==='GET') return send(res,200,{ok:true,serverTime:Date.now(),service:'RuralReach Sync Gateway'});
    if(url.pathname==='/api/sync/batch' && req.method==='POST'){
      const x=await body(req); const items=Array.isArray(x.items)?x.items.slice(0,50):[]; const d=readDB(); const results=[];
      for(const raw of items){ const item=raw||{}; const type=String(item.type||'');
        try{
          if(type==='learning'){ const sid=String(item.studentId||'guest').slice(0,100); d.learning[sid] ||= []; d.learning[sid].push({type:String(item.eventType||item.type||'study'),subject:String(item.subject||'general'),percent:Number(item.percent||0),minutes:Number(item.minutes||0),at:Number(item.at||Date.now())}); d.learning[sid]=d.learning[sid].slice(-500); results.push({id:item.id,ok:true}); }
          else if(type==='submission'){ if(!item.assignmentId||!item.studentId) throw new Error('assignmentId and studentId required'); d.submissions ||= []; let sub=d.submissions.find(s=>s.assignmentId===String(item.assignmentId)&&s.studentId===String(item.studentId)); if(!sub){sub={id:crypto.randomUUID(),assignmentId:String(item.assignmentId),studentId:String(item.studentId),studentName:String(item.studentName||''),status:'submitted',completedAt:null,updated:Date.now()};d.submissions.push(sub); const a=d.assignments.find(a=>a.id===sub.assignmentId); if(a)a.submissions=(a.submissions||0)+1;} Object.assign(sub,{status:String(item.status||'submitted'),completedAt:item.completedAt||Date.now(),score:item.score??sub.score,updated:Date.now()}); results.push({id:item.id,ok:true}); }
          else if(type==='message'){ if(!item.text||!item.from) throw new Error('from and text are required'); d.messages ||= []; d.messages.push({id:crypto.randomUUID(),from:String(item.from),fromName:String(item.fromName||'Student'),to:String(item.to||'*'),text:String(item.text).slice(0,500),classCode:String(item.classCode||''),at:Number(item.at||Date.now())}); results.push({id:item.id,ok:true}); }
          else { results.push({id:item.id,ok:false,error:'Unsupported sync item'}); }
        }catch(e){ results.push({id:item.id,ok:false,error:e.message||'sync failed'}); }
      }
      writeDB(d); return send(res,200,{ok:true,results,serverTime:Date.now()});
    }
    if(url.pathname.startsWith('/api/lectures/') && url.pathname.endsWith('/download') && req.method==='POST'){ const id=url.pathname.split('/')[3]; const d=readDB();const x=d.lectures.find(v=>v.id===id);if(!x)return send(res,404,{error:'lecture not found'});x.downloads=(x.downloads||0)+1;d.downloads.push({lectureId:id,at:Date.now()});writeDB(d);return send(res,200,{ok:true,downloads:x.downloads}); }

    let file=url.pathname==='/'?'login.html':url.pathname.replace(/^\//,'');
    const full=path.resolve(ROOT,file); if(!full.startsWith(ROOT) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) return send(res,404,'Not found','text/plain');
    res.writeHead(200,{'Content-Type':mime(full),'Cache-Control':'no-cache'}); fs.createReadStream(full).pipe(res);
  }catch(e){ console.error(e); send(res,500,{error:e.message||'server error'}); }
});
server.listen(PORT,()=>console.log(`RuralReach Central Network running at http://localhost:${PORT}`));
