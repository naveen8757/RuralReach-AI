const DB_NAME = "RuralReachDB";
const DB_VERSION = 2;

function openDB(){
  return new Promise((resolve,reject)=>{
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if(!db.objectStoreNames.contains("content")) db.createObjectStore("content", {keyPath:"id", autoIncrement:true});
      if(!db.objectStoreNames.contains("students")) db.createObjectStore("students", {keyPath:"id"});
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

let role = "student";
const roles = document.querySelectorAll(".role");
roles.forEach(btn => btn.onclick = () => {
  roles.forEach(x => x.classList.remove("active"));
  btn.classList.add("active");
  role = btn.dataset.role;
  document.getElementById("userId").placeholder = role === "student" ? "Student ID" : "Faculty ID";
  document.getElementById("password").placeholder = role === "student" ? "Student Password" : "Faculty Password";
  document.getElementById("loginHint").textContent = role === "teacher"
    ? "Demo professor: FAC001 / teacher123"
    : "Use a student account created by a professor. Demo student: RRSTU001 / 1234";
});

document.getElementById("loginForm").onsubmit = async e => {
  e.preventDefault();
  const id = document.getElementById("userId").value.trim();
  const password = document.getElementById("password").value;
  const name = document.getElementById("name").value.trim();
  const institution = document.getElementById("institution").value.trim() || "RuralReach Network";

  if(role === "teacher"){
    if(id !== "FAC001" || password !== "teacher123"){
      showLoginError("Invalid professor login. Try FAC001 / teacher123");
      return;
    }
    const user = {name:name || "Dr. Raman", institution, id, role};
    localStorage.ruralReachUser = JSON.stringify(user);
    location.href = "teacher-dashboard.html";
    return;
  }

  if(id === "RRSTU001" && password === "1234"){
    const user = {name:name || "Demo Student", institution, id, role};
    localStorage.ruralReachUser = JSON.stringify(user);
    location.href = "dashboard.html";
    return;
  }

  try{
    const db = await openDB();
    const tx = db.transaction("students", "readonly");
    const req = tx.objectStore("students").get(id);
    req.onsuccess = () => {
      const student = req.result;
      if(student && student.password === password){
        localStorage.ruralReachUser = JSON.stringify({
          name:student.name, institution:student.college, id:student.id, role:"student",
          district:student.district, course:student.course, year:student.year, photo:student.photo||""
        });
        location.href = "dashboard.html";
      }else showLoginError("Student ID or password is incorrect. Ask your professor to add your account.");
    };
  }catch(err){
    showLoginError("Could not access local student accounts. Please try again.");
  }
};

function showLoginError(message){
  const el = document.getElementById("loginError");
  if(el){ el.hidden = false; el.textContent = message; }
}
