function updateConnection(){
 const online=navigator.onLine;
 document.querySelectorAll(".connection-text").forEach(x=>x.textContent=online?"Online":"Offline Mode");
 document.querySelectorAll(".status-dot").forEach(x=>x.style.background=online?"#22c55e":"#f59e0b");
}
updateConnection();addEventListener("online",updateConnection);addEventListener("offline",updateConnection);
if("serviceWorker" in navigator) addEventListener("load",()=>navigator.serviceWorker.register("sw.js").then(()=>console.log("RuralReach offline system enabled")).catch(console.error));