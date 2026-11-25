const url=URL.createObjectURL(new Blob([document.querySelector('#runtime').textContent],{type:'text/javascript'}));
let runner;
window.addEventListener('message',event=>{
 if(event.source!==parent || !event.ports[0])return;
 const port=event.ports[0];
 runner?.terminate();
 runner=new Worker(url);
 runner.onmessage=e=>port.postMessage(e.data);
 runner.onerror=e=>port.postMessage({error:e.message,done:true});
 runner.postMessage(event.data);
});
