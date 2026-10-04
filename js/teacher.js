const DB="RuralReachDB", STORE="content", STUDENTS="students";
function db(){
  return new Promise((res,rej)=>{
    let r=indexedDB.open(DB,2);
    r.onupgradeneeded=()=>{
      const d=r.result;
      if(!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE,{keyPath:"id",autoIncrement:true});
      if(!d.objectStoreNames.contains(STUDENTS)) d.createObjectStore(STUDENTS,{keyPath:"id"});
    };
    r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)
  })
}
async function addContent(o){let d=await db();return new Promise((res,rej)=>{let t=d.transaction(STORE,"readwrite").objectStore(STORE).add(o);t.onsuccess=()=>res(t.result);t.onerror=()=>rej(t.error)})}
async function getAll(){let d=await db();return new Promise((res,rej)=>{let t=d.transaction(STORE,"readonly").objectStore(STORE).getAll();t.onsuccess=()=>res(t.result);t.onerror=()=>rej(t.error)})}
async function getStudents(){let d=await db();return new Promise((res,rej)=>{let t=d.transaction(STUDENTS,"readonly").objectStore(STUDENTS).getAll();t.onsuccess=()=>res(t.result);t.onerror=()=>rej(t.error)})}
async function addStudent(s){let d=await db();return new Promise((res,rej)=>{let t=d.transaction(STUDENTS,"readwrite").objectStore(STUDENTS).add(s);t.onsuccess=()=>res(t.result);t.onerror=()=>rej(t.error)})}
async function deleteStudent(id){let d=await db();return new Promise((res,rej)=>{let t=d.transaction(STUDENTS,"readwrite").objectStore(STUDENTS).delete(id);t.onsuccess=()=>res();t.onerror=()=>rej(t.error)})}

async function render(){
  const a=await getAll(), mine=a.filter(x=>x.type==="lecture"), u=JSON.parse(localStorage.ruralReachUser||"{}");
  teacherName.textContent=u.name||"Professor";
  publishedCount.textContent=mine.length;
  notesCount.textContent=mine.filter(x=>x.notes).length;
  const students=await getStudents();
  studentReach.textContent=students.length;
  downloads.textContent=mine.reduce((n,x)=>n+(x.downloads||0),0);
  teacherList.innerHTML=mine.length?mine.slice(-6).reverse().map(x=>`<article class="teacher-item"><div><b>${escapeHTML(x.title)}</b><small>${escapeHTML(x.subject)} · ${escapeHTML(x.district)} · ${escapeHTML(x.professor)}</small></div><span>${x.video?"🎥 Video":"📄 Notes"}</span></article>`).join(""):"<p class='muted'>No content published yet.</p>";
  studentCount.textContent=students.length;
  studentList.innerHTML=students.length ? students.slice().reverse().map(s=>`<article class="teacher-item student-item"><div class="student-identity">${s.photo?`<img class="student-avatar" src="${s.photo}" alt="">`:`<div class="student-avatar initials">${escapeHTML((s.name||"S").split(" ").map(x=>x[0]).join("").slice(0,2))}</div>`}<div><b>🎓 ${escapeHTML(s.name)}</b><small>${escapeHTML(s.id)} · ${escapeHTML(s.course)} · Year ${escapeHTML(s.year)} · ${escapeHTML(s.district)}</small><small>${escapeHTML(s.college)}</small></div></div><span><button class="mini-btn" data-delete="${escapeHTML(s.id)}">Remove</button></span></article>`).join("") : "<p class='muted'>No students added yet.</p>";
  document.querySelectorAll("[data-delete]").forEach(btn=>btn.onclick=async()=>{if(confirm("Remove this student from the local class list?")){await deleteStudent(btn.dataset.delete);render()}})
}

function fileToDataURL(file){
  return new Promise((resolve,reject)=>{
    if(!file){resolve("");return}
    const reader=new FileReader();
    reader.onload=()=>resolve(reader.result);
    reader.onerror=()=>reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function escapeHTML(v){return String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c]))}

publishBtn.onclick=async()=>{
  let vf=videoFile.files[0],nf=notesFile.files[0],tf=document.getElementById('transcriptFile')?.files[0];
  if(!title.value.trim()||!professor.value.trim()||(!vf&&!nf&&!tf)){publishStatus.hidden=false;publishStatus.textContent="Add a title, professor name and at least one lecture file.";return}
  await addContent({type:"lecture",title:title.value.trim(),subject:subject.value||"General",district:district.value,professor:professor.value.trim(),description:description.value,video:vf||null,videoName:vf?vf.name:"",videoType:vf?vf.type:"",videoSize:vf?vf.size:0,notes:nf||null,notesName:nf?nf.name:"",notesType:nf?nf.type:"",notesSize:nf?nf.size:0,transcript:tf||null,transcriptName:tf?tf.name:'',transcriptType:tf?tf.type:'text/plain',transcriptSize:tf?tf.size:0,created:Date.now(),downloads:0,downloaded:false});
  publishStatus.hidden=false;publishStatus.textContent="✓ Published locally. Students can now see it in the Lecture Network on this device.";
  title.value=subject.value=professor.value=description.value="";videoFile.value=notesFile.value="";if(document.getElementById('transcriptFile'))document.getElementById('transcriptFile').value='';render()
};

studentPhoto.onchange=()=>{
  const file=studentPhoto.files[0];
  if(!file){studentPhotoPreview.hidden=true;return}
  if(!file.type.startsWith("image/")){studentPhotoPreview.hidden=false;studentPhotoPreviewImg.removeAttribute("src");return}
  const reader=new FileReader();
  reader.onload=()=>{studentPhotoPreviewImg.src=reader.result;studentPhotoPreview.hidden=false};
  reader.readAsDataURL(file);
};

addStudentBtn.onclick=async()=>{
  const name=studentName.value.trim(), id=studentId.value.trim().toUpperCase(), college=studentCollege.value.trim(), district=studentDistrict.value, course=studentCourse.value.trim(), year=studentYear.value, password=studentPassword.value.trim()||"1234", photoFile=studentPhoto.files[0];
  if(!name||!id||!college||!course){studentStatus.hidden=false;studentStatus.textContent="Enter student name, ID, college and course.";return}
  if(photoFile && !photoFile.type.startsWith("image/")){studentStatus.hidden=false;studentStatus.textContent="Please choose an image file for the student photo.";return}
  if(photoFile && photoFile.size > 2*1024*1024){studentStatus.hidden=false;studentStatus.textContent="Please keep the student photo below 2 MB.";return}
  try{
    const photo=await fileToDataURL(photoFile);
    await addStudent({id,name,college,district,course,year,password,photo,created:Date.now()});
    studentStatus.hidden=false;studentStatus.textContent=`✓ ${name} added. Login: ${id} / ${password}`;
    studentName.value=studentId.value=studentCollege.value=studentCourse.value=studentPassword.value="";studentPhoto.value="";studentPhotoPreview.hidden=true;studentPhotoPreviewImg.src="";render();
  }catch(e){studentStatus.hidden=false;studentStatus.textContent="That Student ID already exists. Use a different ID."}
};

render();


async function fileAsDataURL(file){ return file ? fileToDataURL(file) : ""; }
async function syncLecturesToServer(){
  const status=document.getElementById("syncStatus"); status.hidden=false; status.textContent="Preparing lectures for the central network…";
  try{
    const all=await getAll(), mine=all.filter(x=>x.type==="lecture");
    if(!mine.length){status.textContent="No lectures to sync yet.";return;}
    let sent=0;
    for(const x of mine){
      if(x.serverId) continue;
      const payload={title:x.title,subject:x.subject,district:x.district,professor:x.professor,description:x.description,videoName:x.videoName,notesName:x.notesName,videoData:await fileAsDataURL(x.video),notesData:await fileAsDataURL(x.notes)};
      const r=await fetch("/api/lectures",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      if(!r.ok) throw new Error((await r.json()).error||"Lecture sync failed");
      const remote=await r.json(); x.serverId=remote.id; x.serverUrl=remote.video?.url||"";
      const dbx=await db(); await new Promise((resolve,reject)=>{const tx=dbx.transaction(STORE,"readwrite");tx.objectStore(STORE).put(x);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});
      sent++;
    }
    status.textContent=`✓ ${sent} lecture(s) synced to the central RuralReach server.`; render();
  }catch(e){status.textContent="Server not available. Start it with: node server/server.js";}
}
async function syncStudentsToServer(){
  const status=document.getElementById("syncStatus"); status.hidden=false; status.textContent="Syncing student accounts…";
  try{
    const students=await getStudents(); let sent=0;
    for(const s of students){
      const r=await fetch("/api/students",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(s)});
      if(r.status===409) continue;
      if(!r.ok) throw new Error("Student sync failed"); sent++;
    }
    status.textContent=`✓ Student network sync complete. ${sent} new student account(s) sent.`;
  }catch(e){status.textContent="Server not available. Start it with: node server/server.js";}
}
document.getElementById("syncLecturesBtn")?.addEventListener("click",syncLecturesToServer);
document.getElementById("syncStudentsBtn")?.addEventListener("click",syncStudentsToServer);

async function loadAssignmentMonitor(){
  const list=document.getElementById('submissionList'); if(!list)return;
  try{const [a,subs]=await Promise.all([fetch('/api/assignments').then(r=>r.json()),fetch('/api/submissions').then(r=>r.json())]);
    list.innerHTML=a.length?a.map(x=>{const ss=subs.filter(s=>s.assignmentId===x.id);return `<article class="teacher-item"><div><b>📝 ${escapeHTML(x.title)}</b><small>${escapeHTML(x.subject)} · ${ss.length} submission(s)${x.dueDate?' · Due '+escapeHTML(x.dueDate):''}</small></div><span>${ss.length?'✓ '+ss.map(s=>escapeHTML(s.studentName||s.studentId)).join(', '):'No submissions yet'}</span></article>`}).join(''):'<p class="muted">No central assignments published yet.</p>';
  }catch{list.innerHTML='<p class="muted">Start the server to view synced submissions.</p>'}
}
document.getElementById('publishAssignmentBtn')?.addEventListener('click',async()=>{const title=document.getElementById('assignmentTitle').value.trim(),status=document.getElementById('assignmentStatus'),u=JSON.parse(localStorage.ruralReachUser||'{}');if(!title){status.hidden=false;status.textContent='Enter an assignment title.';return}try{const r=await fetch('/api/assignments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title,subject:document.getElementById('assignmentSubject').value,description:document.getElementById('assignmentDescription').value,dueDate:document.getElementById('assignmentDue').value,classCode:document.getElementById('assignmentClass').value,professor:u.name||'Professor'})});if(!r.ok)throw new Error();status.hidden=false;status.textContent='✓ Assignment published to the central student network.';document.getElementById('assignmentTitle').value=document.getElementById('assignmentSubject').value=document.getElementById('assignmentDue').value=document.getElementById('assignmentClass').value=document.getElementById('assignmentDescription').value='';loadAssignmentMonitor()}catch{status.hidden=false;status.textContent='Server not available. Start node server/server.js first.'}});
loadAssignmentMonitor();setInterval(loadAssignmentMonitor,10000);
