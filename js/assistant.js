const K=[
 ["logic gate","A logic gate is a digital circuit that performs a logical operation on binary inputs. AND, OR and NOT are common gates."],
 ["python function","A Python function is reusable code defined with def. It can accept parameters and return a value."],
 ["array","An array stores multiple values and lets you access elements using an index."],
 ["loop","A loop repeats code. Common types are for and while."],
 ["variable","A variable is a named storage location for a value."],
 ["transistor","A transistor is a semiconductor device used for switching and amplification."],
 ["voltage","Voltage is electrical potential difference, measured in volts."],
 ["html","HTML structures web pages using elements such as headings, links and forms."]
];
const TA={"logic gate":"லாஜிக் கேட் என்பது binary உள்ளீடுகளில் logical operation செய்யும் digital circuit.","python function":"Python function என்பது மீண்டும் பயன்படுத்தக்கூடிய code block. இதை def மூலம் உருவாக்கலாம்.","array":"Array பல values-ஐ index மூலம் சேமிக்க உதவும்.","loop":"Loop ஒரு code பகுதியை மீண்டும் மீண்டும் இயக்கும்.","variable":"Variable என்பது ஒரு value-ஐ பெயருடன் சேமிக்கும் இடம்."};
const HI={"logic gate":"Logic gate एक digital circuit है जो binary inputs पर logical operation करता है.","python function":"Python function reusable code का block है जिसे def से बनाया जाता है.","array":"Array कई values को index के आधार पर store करता है.","loop":"Loop code को बार-बार चलाता है.","variable":"Variable किसी value को नाम के साथ store करता है."};
function answer(q){
 let key=K.find(x=>q.toLowerCase().includes(x[0]));let lang=language.value;
 if(key&&lang==="ta"&&TA[key[0]]) return TA[key[0]];
 if(key&&lang==="hi"&&HI[key[0]]) return HI[key[0]];
 return key?key[1]:"I’m in offline demo mode. Ask about logic gates, Python functions, arrays, loops, variables, transistors, voltage or HTML.";
}
function send(t){
 if(!t.trim())return;chatMessages.innerHTML+=`<div class="msg user">${t}</div>`;chatInput.value="";
 setTimeout(()=>{chatMessages.innerHTML+=`<div class="msg">${answer(t)}</div>`;chatMessages.scrollTop=chatMessages.scrollHeight},300);
}
sendBtn.onclick=()=>send(chatInput.value);chatInput.onkeydown=e=>{if(e.key==="Enter")send(chatInput.value)};
document.querySelectorAll(".quick button").forEach(b=>b.onclick=()=>send(b.textContent));
clearChat.onclick=()=>{chatMessages.innerHTML='<div class="msg bot">Chat cleared. Ask a new study question.</div>'};