const user=(()=>{try{return JSON.parse(localStorage.ruralReachUser||'{}')}catch{return {}}})();
const $=id=>document.getElementById(id); const uid=user.id||'RRSTU001';
const BANK={
 programming:[
  ['Variables','Which keyword declares a block-scoped variable in JavaScript?',['var','let','print','define'],1],
  ['Functions','What does a function return when it has no return statement in JavaScript?',['0','false','undefined','null'],2],
  ['Arrays','What is the index of the first element in a C array?',['0','1','-1','Depends on size'],0],
  ['Loops','Which loop is best when the number of repetitions is known?',['while','for','do-while','switch'],1],
  ['Python','What does len([10,20,30]) return?',['2','3','30','0'],1],
  ['Algorithms','Binary search requires the data to be:',['Random','Sorted','Duplicated','Encrypted'],1],
  ['Complexity','The average lookup in a hash table is commonly described as:',['O(n²)','O(log n)','O(1)','O(n!)'],2],
  ['DSA','Which structure follows FIFO order?',['Stack','Queue','Tree','Graph'],1],
  ['Recursion','A recursive function must have a condition that stops further calls. What is it called?',['Iterator','Base case','Pointer','Compiler'],1]
 ],
 digital:[
  ['Logic Gates','Which gate outputs 1 only when both inputs are 1?',['OR','XOR','AND','NOT'],2],
  ['Logic Gates','What is the output of NOT 0?',['0','1','2','Undefined'],1],
  ['Boolean Algebra','A + 0 simplifies to:',['0','1','A','A̅'],2],
  ['Flip-Flops','Which flip-flop is commonly used to store one bit?',['D','OR','XOR','Decoder'],0],
  ['Combinational','A multiplexer selects:',['One of many inputs','Many clocks','One power source','Only analog signals'],0],
  ['Counters','A binary counter with 3 flip-flops can represent how many states?',['3','6','8','16'],2],
  ['Number Systems','Binary 1010 is decimal:',['8','10','12','14'],1],
  ['Digital IC','A decoder generally converts n input lines into up to:',['n outputs','2n outputs','n² outputs','2ⁿ outputs'],3],
  ['Karnaugh Map','K-map simplification is mainly used to reduce:',['Code size','Boolean expressions','Clock frequency','Battery voltage'],1]
 ],
 embedded:[
  ['Arduino','Which function runs once when an Arduino sketch starts?',['loop()','start()','setup()','mainLoop()'],2],
  ['Sensors','A temperature sensor measures:',['Light','Temperature','Distance only','Voltage only'],1],
  ['Microcontrollers','GPIO stands for:',['General Purpose Input/Output','Global Program Input Output','Graphical Port Interface','General Power Input'],0],
  ['Communication','UART is commonly used for:',['Serial communication','Image compression','Database indexing','Mechanical control'],0],
  ['IoT','MQTT is designed primarily for:',['Lightweight messaging','Video editing','3D rendering','Spreadsheet formulas'],0],
  ['ESP32','ESP32 is best described as a:',['Microcontroller with wireless connectivity','Desktop CPU','Database server','Web browser'],0],
  ['PWM','PWM can be used to control:',['LED brightness','Only text files','Database rows','Compiler warnings'],0],
  ['Real Time','An RTC module is mainly used to keep:',['Accurate time/date','Wi-Fi passwords','Program source','Battery chemistry'],0],
  ['Embedded Safety','A watchdog timer helps a system recover from:',['Software hangs','Low screen brightness','Correct calculations','Normal shutdown'],0]
 ]
};
let subject='programming', questions=[], pos=0, score=0, selected=-1, level=1, answered=[];
function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
function start(){subject=$('subject').value;const count=$('mode').value==='practice'?6:8;questions=shuffle(BANK[subject]).slice(0,count);pos=score=0;level=1;selected=-1;answered=[];$('setup').hidden=true;$('result').hidden=true;$('test').hidden=false;render()}
function render(){const q=questions[pos];selected=-1;$('progressLabel').textContent=`QUESTION ${pos+1} OF ${questions.length}`;$('questionTitle').textContent=q[0]+': '+q[1];$('difficulty').textContent=`Adaptive difficulty: ${level<=1?'Foundation':level===2?'Core':'Challenge'}`;$('score').textContent=Math.round((score/Math.max(1,pos))*100)+'%';$('progressBar').style.width=(pos/questions.length*100)+'%';$('options').innerHTML=shuffle(q[2].map((text,i)=>({text,i}))).map(o=>`<button class="quiz-option" data-i="${o.i}">${o.text}</button>`).join('');$('options').querySelectorAll('button').forEach(b=>b.onclick=()=>{selected=Number(b.dataset.i);$('options').querySelectorAll('button').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');$('next').disabled=false});$('next').textContent=pos===questions.length-1?'Finish Assessment →':'Lock Answer →';}
$('start').onclick=start;
$('next').onclick=()=>{if(selected<0)return;const q=questions[pos],correct=selected===q[3];if(correct){score++;level=Math.min(3,level+1)}else level=Math.max(1,level-1);answered.push({topic:q[0],correct,question:q[1]});pos++;if(pos<questions.length)render();else finish()};
function finish(){ $('test').hidden=true;$('result').hidden=false; const pct=Math.round(score/questions.length*100);$('score').textContent=pct+'%';$('resultTitle').textContent=pct>=80?'Excellent adaptive performance!':pct>=60?'Good progress — a few topics need reinforcement.':'Let’s strengthen the foundations and try again.';$('resultSummary').textContent=`You scored ${score}/${questions.length} (${pct}%). The engine analyzed ${[...new Set(answered.map(x=>x.topic))].length} topics and generated a focused revision plan.`;
 const map={};answered.forEach(x=>(map[x.topic] ||= []).push(x.correct));$('topics').innerHTML=Object.entries(map).map(([t,v])=>{const p=Math.round(v.filter(Boolean).length/v.length*100);return `<div class="mastery-row"><div><b>${t}</b><span>${p}%</span></div><div class="mastery-bar"><i style="width:${p}%"></i></div></div>`}).join('');
 const weak=Object.entries(map).map(([t,v])=>({t,p:v.filter(Boolean).length/v.length})).sort((a,b)=>a.p-b.p);let rec=weak.slice(0,3).map(x=>`<div class="recommendation"><b>📌 Revise ${x.t}</b><p>Review a short lecture, then retake a 3-question practice set on this topic.</p></div>`);if(!rec.length)rec=['<div class="recommendation"><b>🎯 Keep building consistency</b><p>Use Smart Learning to turn this result into a daily study plan.</p></div>'];$('recommendations').innerHTML=rec.join('');saveResult(pct,map);}
async function saveResult(pct,map){const result={id:'AR-'+Date.now().toString(36),studentId:uid,studentName:user.name||'Student',subject,score,percent:pct,topics:Object.fromEntries(Object.entries(map).map(([k,v])=>[k,Math.round(v.filter(Boolean).length/v.length*100)])),questions:questions.length,at:Date.now()};const old=JSON.parse(localStorage.ruralReachAssessmentResults||'[]');old.push(result);localStorage.ruralReachAssessmentResults=JSON.stringify(old.slice(-30));try{await fetch('/api/assessment-results',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(result)})}catch{}try{if(window.RuralReachOffline)await RuralReachOffline.enqueue('learning',{studentId:uid,eventType:'quiz',subject,percent:pct,minutes:Math.max(1,Math.round(questions.length*1.5)),at:Date.now()},'Assessment result',`${subject} · ${pct}%`)}catch{}}
