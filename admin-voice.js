/* Browser voice commands: no paid AI service or embedded credentials. */
(function () {
  'use strict';
  const dashboard = document.getElementById('dashboard');
  if (!dashboard) return;
  const panel = document.createElement('section');
  panel.className = 'panel voice-panel';
  panel.innerHTML = `<style>
    .voice-panel{margin:0 0 24px;background:linear-gradient(135deg,rgba(255,255,255,.95),rgba(209,250,229,.65));backdrop-filter:blur(18px)}
    .voice-controls,.voice-command,.voice-examples{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:12px 0}
    .voice-controls select{width:auto}.voice-command input{flex:1;min-width:160px}.voice-controls label{display:flex;align-items:center}.voice-controls input{width:auto}
    .voice-examples button{font-size:13px;padding:8px 12px}.voice-output{white-space:pre-wrap;overflow-wrap:anywhere}.voice-tasks{padding-left:24px}.voice-tasks li{padding:7px 0;overflow-wrap:anywhere}.voice-tasks button{padding:5px 9px;margin-left:12px;font-size:12px}
  </style><p class="eyebrow">SAI ASSISTANT</p><h2>Voice tasks & reports</h2>
  <p>Tap the microphone and say a command, or type below.</p>
  <div class="voice-controls"><label>Language <select id="voiceLanguage"><option value="en-IN">English</option><option value="ta-IN">தமிழ்</option></select></label><button type="button" id="voiceListen" class="secondary">🎤 Start listening</button><button type="button" id="voiceStop" class="secondary">Stop</button><label><input type="checkbox" id="voiceSpeak" checked> Speak replies</label></div>
  <form class="voice-command" id="voiceForm"><input id="voiceInput" aria-label="Assistant command" maxlength="500" placeholder="Read report / Add task call customer" required><button type="submit" class="secondary">Run command</button></form>
  <div class="voice-examples"><button type="button" data-command="read report">Read report</button><button type="button" data-command="click report">Click report</button><button type="button" data-command="list tasks">My tasks</button><button type="button" data-command="help">Commands</button></div>
  <p id="voiceStatus" role="status">Ready.</p><p id="voiceOutput" class="voice-output" aria-live="polite"></p>
  <h3>My tasks</h3><p><small>Saved only in this browser on this device. No scheduled reminders. Voice processing may use your browser’s speech service. Tamil speech depends on available device voices.</small></p><ol id="voiceTasks" class="voice-tasks"></ol>`;
  dashboard.querySelector('.stats').after(panel);
  const $ = id => document.getElementById(id);
  const taskKey = 'saiAdminVoiceTasksV1';
  let tasks = [], recognition, listening = false, epoch = 0, busy = false;
  try { const saved = JSON.parse(localStorage.getItem(taskKey) || '[]'); if (Array.isArray(saved)) tasks = saved.filter(t => t && typeof t.text === 'string' && typeof t.done === 'boolean').slice(0,200); } catch {}
  const available = () => !dashboard.hidden && Boolean(sessionStorage.getItem('saiShopAdminToken'));
  function reply(text) {
    if (!available()) return;
    $('voiceOutput').textContent = text;
    window.speechSynthesis?.cancel();
    if (!$('voiceSpeak').checked || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = $('voiceLanguage').value;
    const voice = speechSynthesis.getVoices().find(v => v.lang.toLowerCase().startsWith(utterance.lang.slice(0,2)));
    if (voice) utterance.voice = voice;
    utterance.onerror = () => { if (available()) $('voiceStatus').textContent = 'Audio unavailable. Read the reply above.'; };
    speechSynthesis.speak(utterance);
  }
  function renderTasks() {
    $('voiceTasks').replaceChildren();
    tasks.forEach((task,index) => {
      const li = document.createElement('li'), label = document.createElement('span'), button = document.createElement('button');
      label.textContent = task.text + (task.done ? ' — Done' : '');
      button.type = 'button'; button.textContent = task.done ? 'Reopen' : 'Complete';
      button.setAttribute('aria-label', button.textContent + ' task ' + (index+1));
      button.onclick = () => { if (!available()) return; const next = tasks.map((t,i) => i===index ? {...t,done:!t.done} : t); persist(next); };
      li.append(label,button); $('voiceTasks').append(li);
    });
    if (!tasks.length) $('voiceTasks').textContent = 'No tasks yet. Say “Add task” followed by your task.';
  }
  function persist(next) {
    try { localStorage.setItem(taskKey,JSON.stringify(next)); tasks=next; renderTasks(); return true; }
    catch { reply('Unable to save tasks. Browser storage may be blocked or full.'); return false; }
  }
  async function readAPI(path, signal) {
    const response = await fetch(path,{signal,headers:{Authorization:'Bearer '+sessionStorage.getItem('saiShopAdminToken')}});
    if (response.status===401) { $('logoutBtn').click(); throw new Error('Please log in again.'); }
    if (!response.ok) throw new Error('Report could not be loaded. Please try again.');
    return response.json();
  }
  async function run(raw) {
    if (!available() || busy) return;
    const command=raw.trim().replace(/[.!?。]+$/u,'').trim(), lower=command.toLowerCase(), tamil=$('voiceLanguage').value==='ta-IN';
    if (!command) return;
    const turn=epoch; busy=true; $('voiceStatus').textContent='Working…';
    const controller=new AbortController(), timeout=setTimeout(()=>controller.abort(),15000);
    try {
      let match;
      if ((match=command.match(/^(?:add task|new task|பணி சேர்)\s+(.+)$/iu))) {
        if(tasks.length>=200) { reply('Task list is full (200 tasks).'); return; }
        if(persist([...tasks,{text:match[1],done:false}])) reply(tamil?'பணி சேர்க்கப்பட்டது.':'Task added: '+match[1]);
      } else if ((match=lower.match(/^(?:complete task|finish task|பணி முடி)\s+(\d+)$/u))) {
        const index=Number(match[1])-1;
        if(!tasks[index]) reply('Task number not found. Say list tasks.');
        else if(persist(tasks.map((t,i)=>i===index?{...t,done:true}:t))) reply(tamil?'பணி முடிக்கப்பட்டது.':'Task '+(index+1)+' completed.');
      } else if (/^(list tasks|my tasks|read tasks|show tasks|பணிகள்|பணிகளை படி)$/u.test(lower)) {
        const pending=tasks.map((t,i)=>({ ...t, number:i+1 })).filter(t=>!t.done);
        reply(pending.length ? (tamil?'நிலுவைப் பணிகள்: ':'Pending tasks: ')+pending.map(t=>t.number+'. '+t.text).join('\n') : (tamil?'நிலுவைப் பணிகள் இல்லை.':'No pending tasks.'));
      } else if (/^(read report|report|product report|read product report|அறிக்கை|அறிக்கை படி)$/u.test(lower)) {
        const data=await readAPI('/api/admin/products',controller.signal);
        if(turn!==epoch || !available()) return;
        if(!Array.isArray(data.products)) throw new Error('Product report is unavailable.');
        const p=data.products,total=p.length,visible=p.filter(p=>Boolean(p.active)).length,free=p.filter(p=>Number(p.price)===0).length,missing=p.filter(p=>!String(p.downloadUrl||'').trim()).length;
        reply(tamil?`மொத்தம் ${total} தயாரிப்புகள். ${visible} தயாரிப்புகள் தளத்தில் தெரிகின்றன. ${total-visible} மறைக்கப்பட்டுள்ளன. ${free} இலவச தயாரிப்புகள். ${total-free} கட்டண தயாரிப்புகள். ${missing} தயாரிப்புகளில் பதிவிறக்க இணைப்பு இல்லை.`:`Current product report: ${total} products. ${visible} visible, ${total-visible} hidden. ${free} free and ${total-free} paid. ${missing} products need download links.`);
      } else if (/^(click report|read click report|கிளிக் அறிக்கை)$/u.test(lower)) {
        const data=await readAPI('/api/admin/analytics/clicks',controller.signal);
        if(turn!==epoch || !available()) return;
        if(!Array.isArray(data.products) || !Number.isFinite(Number(data.totalClicks))) throw new Error('Click report is unavailable.');
        const top=[...data.products].sort((a,b)=>Number(b.clicks)-Number(a.clicks)).find(p=>Number(p.clicks)>0);
        reply(tamil?`பதிவான மொத்த தயாரிப்பு கிளிக்குகள்: ${Number(data.totalClicks)}.`:`Total recorded product clicks: ${Number(data.totalClicks)}.`+(top?` Most clicked: ${top.name}, with ${Number(top.clicks)} clicks.`:''));
      } else if ((match=command.match(/^(?:search products?|find product|தேடு)\s+(.+)$/iu))) {
        $('productSearch').value=match[1]; $('productSearch').dispatchEvent(new Event('input',{bubbles:true}));
        $('productList').scrollIntoView({behavior:'smooth',block:'center'}); reply('Showing products matching '+match[1]+'.');
      } else if (/^(open analytics|show analytics)$/u.test(lower)) { location.href='admin-analytics.html';
      } else {
        reply(tamil?'கட்டளைகள்: அறிக்கை படி; கிளிக் அறிக்கை; பணி சேர் வாடிக்கையாளரை அழைக்கவும்; பணிகள்; பணி முடி 1; தேடு business card.':'Commands: Read report; Click report; Add task call customer; List tasks; Complete task 1; Search products business card; Open analytics. Use a task number to complete it.');
      }
    } catch(error) { if(turn===epoch) reply(error.name==='AbortError'?'Report timed out. Please try again.':error.message); }
    finally { clearTimeout(timeout); busy=false; if(turn===epoch && available()) $('voiceStatus').textContent='Ready.'; }
  }
  function stop() { epoch++; listening=false; recognition?.abort(); window.speechSynthesis?.cancel(); $('voiceStatus').textContent='Stopped.'; }
  const Recognition=window.SpeechRecognition || window.webkitSpeechRecognition;
  if(Recognition) {
    recognition=new Recognition(); recognition.continuous=false; recognition.interimResults=false;
    recognition.onstart=()=>{listening=true;$('voiceListen').textContent='Listening…';$('voiceStatus').textContent='Listening. Say one command.';};
    recognition.onend=()=>{listening=false;$('voiceListen').textContent='🎤 Start listening';};
    recognition.onresult=event=>{ if(!available() || !listening) return; const transcript=event.results[0][0].transcript; $('voiceInput').value=transcript; run(transcript); };
    recognition.onerror=event=>{ if(available()) $('voiceStatus').textContent=event.error==='not-allowed'?'Microphone permission denied. Allow microphone access or type your command.':event.error==='aborted'?'Stopped.':'Could not hear the command ('+event.error+'). Try again or type it.'; };
  } else { $('voiceListen').disabled=true; $('voiceStatus').textContent='Voice input is unavailable in this browser. Type a command below.'; }
  $('voiceListen').onclick=()=>{if(!available() || busy || listening || !recognition)return;window.speechSynthesis?.cancel();recognition.lang=$('voiceLanguage').value;try{recognition.start();}catch{$('voiceStatus').textContent='Microphone could not start. Try again.';}};
  $('voiceStop').onclick=stop;
  $('voiceLanguage').onchange=stop;
  $('voiceSpeak').onchange=()=>{if(!$('voiceSpeak').checked)window.speechSynthesis?.cancel();};
  $('voiceForm').onsubmit=event=>{event.preventDefault();run($('voiceInput').value);};
  panel.querySelectorAll('[data-command]').forEach(button=>button.onclick=()=>run(button.dataset.command));
  new MutationObserver(()=>{if(dashboard.hidden){stop();$('voiceInput').value='';$('voiceOutput').textContent='';}}).observe(dashboard,{attributes:true,attributeFilter:['hidden']});
  window.addEventListener('pagehide',stop);
  renderTasks();
})();
