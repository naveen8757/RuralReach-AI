// RuralReach Phase 6 WebRTC signaling client.
const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' }
  ]
};

function rrJsonUser(){ try{return JSON.parse(localStorage.ruralReachUser||'{}')}catch{return {}} }
function rrRtcId(){ let id=sessionStorage.getItem('rrRtcPeerId'); if(!id){id=crypto.randomUUID();sessionStorage.setItem('rrRtcPeerId',id)} return id; }

class RuralReachRTC {
  constructor({code, role, name, studentId='', photo='', onRemoteStream=()=>{}, onPeerJoin=()=>{}, onPeerLeave=()=>{}, onStatus=()=>{}}){
    this.code=code; this.role=role; this.name=name||'Participant'; this.studentId=studentId; this.photo=photo; this.peerId=rrRtcId();
    this.onRemoteStream=onRemoteStream; this.onPeerJoin=onPeerJoin; this.onPeerLeave=onPeerLeave; this.onStatus=onStatus;
    this.peers=new Map(); this.last=0; this.running=false; this.pollTimer=null; this.heartbeatTimer=null;
  }
  async start(){
    const r=await fetch('/api/rtc/join',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:this.code,role:this.role,name:this.name,studentId:this.studentId,photo:this.photo,peerId:this.peerId})});
    if(!r.ok) throw new Error('Could not join live classroom');
    this.running=true; this.onStatus('Connected to signaling server'); this.poll();
    this.heartbeatTimer=setInterval(()=>this.heartbeat(),10000);
    return this.peerId;
  }
  async heartbeat(){ if(!this.running)return; fetch('/api/rtc/heartbeat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:this.code,peerId:this.peerId})}).catch(()=>{}); }
  async send(to,type,payload){
    await fetch('/api/rtc/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:this.code,from:this.peerId,to,type,payload})});
  }
  async poll(){
    if(!this.running)return;
    try{
      const r=await fetch(`/api/rtc/messages/${encodeURIComponent(this.code)}/${encodeURIComponent(this.peerId)}?since=${this.last}`);
      if(r.ok){const data=await r.json(); this.last=data.now||this.last; for(const m of data.messages||[]) await this.handle(m);}
    }catch(e){this.onStatus('Signaling reconnecting…');}
    this.pollTimer=setTimeout(()=>this.poll(),700);
  }
  async handle(m){
    if(m.type==='join' && this.role==='host'){
      this.onPeerJoin(m.from,m.payload);
      const pc=this.makePC(m.from,m.payload);
      const offer=await pc.createOffer(); await pc.setLocalDescription(offer);
      await this.send(m.from,'offer',pc.localDescription);
      return;
    }
    if(m.type==='offer' && this.role==='student'){
      const pc=this.makePC(m.from,m.payload);
      await pc.setRemoteDescription(m.payload);
      const answer=await pc.createAnswer(); await pc.setLocalDescription(answer);
      await this.send(m.from,'answer',pc.localDescription); return;
    }
    if(m.type==='answer' && this.role==='host'){
      const pc=this.peers.get(m.from)?.pc; if(pc) await pc.setRemoteDescription(m.payload); return;
    }
    if(m.type==='ice'){
      const item=this.peers.get(m.from); if(item?.pc && m.payload){try{await item.pc.addIceCandidate(m.payload)}catch{}} return;
    }
    if(m.type==='leave') { this.closePeer(m.from); this.onPeerLeave(m.from); }
  }
  makePC(remoteId, meta={}){
    if(this.peers.get(remoteId)?.pc) return this.peers.get(remoteId).pc;
    const pc=new RTCPeerConnection(RTC_CONFIG);
    const item={pc,meta}; this.peers.set(remoteId,item);
    if(this.localStream){ for(const t of this.localStream.getTracks()){ pc.addTrack(t,this.localStream); } }
    pc.onicecandidate=e=>{if(e.candidate)this.send(remoteId,'ice',e.candidate).catch(()=>{});};
    pc.ontrack=e=>this.onRemoteStream(remoteId,e.streams[0],meta);
    pc.onconnectionstatechange=()=>{ if(['failed','closed','disconnected'].includes(pc.connectionState)){this.onPeerLeave(remoteId); if(pc.connectionState!=='disconnected')this.closePeer(remoteId);} };
    return pc;
  }
  addLocalTracks(stream){ this.localStream=stream; for(const item of this.peers.values()){ for(const t of stream.getTracks()){const sender=item.pc.getSenders().find(s=>s.track?.kind===t.kind); if(sender)sender.replaceTrack(t); else item.pc.addTrack(t,stream); } } }
  removeLocalTrack(kind){ for(const item of this.peers.values()){const sender=item.pc.getSenders().find(s=>s.track?.kind===kind); if(sender)sender.replaceTrack(null);} }
  closePeer(id){const item=this.peers.get(id); if(item){item.pc.close();this.peers.delete(id);} }
  async stop(){this.running=false;clearTimeout(this.pollTimer);clearInterval(this.heartbeatTimer); for(const id of this.peers.keys()) this.send(id,'leave',{}).catch(()=>{}); for(const id of [...this.peers.keys()])this.closePeer(id); fetch('/api/rtc/leave',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:this.code,peerId:this.peerId})}).catch(()=>{});}
}
window.RuralReachRTC=RuralReachRTC;
