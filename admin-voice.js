/* Browser voice commands: no paid AI service or embedded credentials. */
(function () {
  'use strict';
  const dashboard = document.getElementById('dashboard');
  if (!dashboard) return;
  const panel = document.createElement('section');
  panel.className = 'sai-voice';
  panel.innerHTML = `<style>
    .sai-voice{position:fixed;right:24px;bottom:24px;z-index:30;color:#172b26}
    .sai-voice button:focus-visible,.sai-voice summary:focus-visible{outline:3px solid #059669;outline-offset:3px}
    .sai-voice [hidden]{display:none!important}
    .sai-launch{display:flex;align-items:center;gap:10px;background:#063d31;color:white;border:1px solid #65ddb4;box-shadow:0 8px 30px #065f4640;border-radius:40px;padding:15px 20px}
    .sai-window{width:min(420px,calc(100vw - 32px));max-height:calc(100dvh - 110px);overflow:auto;margin-bottom:14px;padding:24px;background:linear-gradient(145deg,#fffffffa,#eafff5f5);backdrop-filter:blur(24px);border:1px solid #bce7d6;border-radius:28px;box-shadow:0 24px 80px #073b3340}
    .sai-head{display:flex;align-items:center;justify-content:space-between}.sai-head h2{margin:0;font-size:18px}.sai-head button{padding:6px 11px;background:transparent;font-size:22px}
    .sai-sub{font-size:12px;color:#60766b;margin:4px 0 20px}.sai-orb{display:flex;justify-content:center;align-items:center;gap:6px;width:88px;height:88px;margin:16px auto;border-radius:50%;background:radial-gradient(circle at 25% 20%,#91f7cf,#14b88b 55%,#056550);box-shadow:0 0 0 9px #10b9810d,0 12px 24px #04785724}
    .sai-orb i{display:block;width:7px;height:17px;background:white;border-radius:8px}.sai-orb i:nth-child(2){height:32px}.sai-orb i:nth-child(3){height:24px}
    .sai-window[data-state="listening"] .sai-orb i,.sai-window[data-state="speaking"] .sai-orb i{animation:sai-wave .7s ease-in-out infinite alternate}.sai-orb i:nth-child(2){animation-delay:.2s!important}.sai-orb i:nth-child(3){animation-delay:.4s!important}
    .sai-window[data-state="thinking"] .sai-orb{animation:sai-glow 1s ease-in-out infinite alternate}
    @keyframes sai-wave{to{transform:scaleY(.4)}}@keyframes sai-glow{to{opacity:.5}}@media(prefers-reduced-motion:reduce){.sai-window .sai-orb,.sai-window .sai-orb i{animation:none!important}}
    .sai-voice #voiceStatus{text-align:center;font-size:13px;color:#42685a;min-height:20px}.sai-transcript{min-height:20px;font-size:14px;color:#527266;font-style:italic;overflow-wrap:anywhere}
    .sai-voice .voice-output{white-space:pre-wrap;overflow-wrap:anywhere;font-size:17px;line-height:1.65;margin:10px 0 20px}
    .sai-actions{display:flex;align-items:center;justify-content:center;gap:12px;margin:14px 0}.sai-actions button{background:#e0f2e9;padding:10px 14px}.sai-actions #voiceListen{border-radius:50%;width:58px;height:58px;background:#047857;color:white;font-size:24px}
    .sai-suggestions{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0}.sai-suggestions button{font-size:12px;font-weight:600;border:1px solid #cfe7dc;background:#ffffffa0;padding:8px 10px;border-radius:20px}
    .sai-type{display:flex;gap:7px}.sai-type input{min-width:0;font-size:14px}.sai-type button{background:#063d31;color:white;padding:8px 12px}
    .sai-settings{margin-top:18px;border-top:1px solid #d9e9e1;padding-top:12px;font-size:12px}.sai-settings summary{cursor:pointer}.sai-settings label{display:flex;align-items:center;gap:8px;margin:10px 0}.sai-settings select{width:auto;padding:7px}.sai-settings input{width:auto}.sai-settings p{color:#52675d}
    .voice-tasks{padding-left:20px;overflow-wrap:anywhere}.voice-tasks li{margin:10px 0}.voice-tasks button{padding:4px 7px;margin-left:6px;font-size:11px}
    @media(max-width:520px){.sai-voice{right:16px;bottom:16px}.sai-window{padding:20px}.sai-launch{margin-left:auto}}
  </style>
  <section class="sai-window" id="voiceWindow" role="dialog" aria-label="Sai Assistant" hidden data-state="idle">
    <div class="sai-head"><h2>Sai Assistant</h2><button id="voiceClose" type="button" aria-label="Close assistant">×</button></div>
    <p class="sai-sub">Your shop, a conversation away</p>
    <div class="sai-orb" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
    <p id="voiceStatus" role="status">Tap the mic to talk</p>
    <p id="voiceTranscript" class="sai-transcript"></p><p id="voiceOutput" class="voice-output" aria-live="polite">Hi! What can I help you with?</p>
    <div class="sai-actions"><button id="voiceReplay" type="button" aria-label="Read reply aloud">↻ Replay</button><button type="button" id="voiceListen" aria-label="Start voice conversation">🎤</button><button type="button" id="voiceStop">Stop</button></div>
    <div class="sai-suggestions"><button type="button" data-command="How is my shop doing?">How is my shop doing?</button><button type="button" data-command="Add a task">Add a task</button><button type="button" data-command="What are my pending tasks?">My tasks</button></div>
    <form class="sai-type" id="voiceForm"><input id="voiceInput" aria-label="Message Sai Assistant" maxlength="500" placeholder="Or type a message…" required><button type="submit" aria-label="Send message">↑</button></form>
    <details class="sai-settings"><summary>Language, voice & tasks</summary>
      <label>Language <select id="voiceLanguage"><option value="en-IN">English</option><option value="ta-IN">தமிழ்</option></select></label>
      <label><input type="checkbox" id="voiceSpeak" checked> Speak replies</label>
      <p>Supports shop reports, product search and tasks. After replying, the mic listens for your next message while this conversation is open. Tap Stop to end.</p>
      <p>Tasks stay in this browser. No scheduled reminders. Voice may be processed by your browser’s speech service.</p><ol id="voiceTasks" class="voice-tasks"></ol>
    </details>
  </section><button type="button" class="sai-launch" id="voiceLaunch" aria-expanded="false" aria-controls="voiceWindow"><span aria-hidden="true">🎤</span> Ask Sai</button>`;
  dashboard.append(panel);
  const $ = id => document.getElementById(id);
  const taskKey = 'saiAdminVoiceTasksV1';
  let tasks = [], recognition, listening = false, epoch = 0, busy = false;
  let conversation=false, pending='', restartTimer, speechTimer, speechId=0, speech=null, speaking=false;
  try { const saved = JSON.parse(localStorage.getItem(taskKey) || '[]'); if (Array.isArray(saved)) tasks = saved.filter(t => t && typeof t.text === 'string' && typeof t.done === 'boolean').slice(0,200); } catch {}
  const available = () => !dashboard.hidden && Boolean(sessionStorage.getItem('saiShopAdminToken'));
  function state(name, text) { $('voiceWindow').dataset.state=name; $('voiceStatus').textContent=text; }
  function laterListen() {
    clearTimeout(restartTimer);
    if(conversation && available() && !$('voiceWindow').hidden) restartTimer=setTimeout(startListening,600);
  }
  function speak(text) {
    const id=++speechId;
    clearTimeout(speechTimer); window.speechSynthesis?.cancel(); speaking=false;
    if(!$('voiceSpeak').checked) { state('idle','Tap the mic to talk'); laterListen(); return; }
    if(!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      conversation=false; state('idle','Speech playback is unavailable in this browser. You can type below.'); return;
    }
    speech=new SpeechSynthesisUtterance(text); speech.lang=$('voiceLanguage').value;
    const voices=speechSynthesis.getVoices();
    const voice=voices.find(v=>v.lang.toLowerCase()===speech.lang.toLowerCase()) || voices.find(v=>v.lang.slice(0,2)===speech.lang.slice(0,2));
    if(voice) speech.voice=voice;
    speaking=true; state('speaking','Speaking…');
    speech.onend=()=>{if(id!==speechId)return;clearTimeout(speechTimer);speaking=false;state('idle','Tap the mic to talk');laterListen();};
    speech.onerror=event=>{
      if(id!==speechId || ['canceled','interrupted'].includes(event.error))return;
      clearTimeout(speechTimer);speaking=false;conversation=false;
      state('idle',event.error==='not-allowed'?'Tap Replay to enable spoken replies.':'Voice playback failed. Try Replay or choose another language.');
    };
    // Keep the utterance alive and detect engines that never start playback.
    speech.onstart=()=>clearTimeout(speechTimer);
    speechTimer=setTimeout(()=>{if(id!==speechId)return;conversation=false;speaking=false;++speechId;speechSynthesis.cancel();state('idle','No audio started. Tap Replay to retry.');},8000);
    speechSynthesis.resume(); speechSynthesis.speak(speech);
  }
  function reply(text) {
    if(!available())return;
    $('voiceOutput').textContent=text;
    speak(text);
  }
  function normalize(text) {
    return text.trim().replace(/[.!?。]+$/u,'').replace(/^(?:(?:hey|ok|okay) sai[, ]*|please\s+|can you\s+|could you\s+)/i,'').trim();
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
    let command=normalize(raw), lower=command.toLowerCase(); const tamil=$('voiceLanguage').value==='ta-IN';
    if (!command) return;
    $('voiceTranscript').textContent=raw;
    const turn=epoch; busy=true; state('thinking','Thinking…');
    const controller=new AbortController(), timeout=setTimeout(()=>controller.abort(),15000);
    try {
      let match;
      if (/^(stop|cancel|never mind|நிறுத்து)$/iu.test(lower)) { pending=''; stop(); return; }
      if(pending==='task') { command='add task '+command; lower=command.toLowerCase(); pending=''; }
      else if(pending==='search') { command='search products '+command; lower=command.toLowerCase(); pending=''; }
      else if(pending==='complete') { command='complete task '+command; lower=command.toLowerCase(); pending=''; }
      if(/^(add (?:a |new )?task|new task|create (?:a )?task|பணி சேர்)$/iu.test(lower)) { pending='task'; reply(tamil?'என்ன பணி சேர்க்க வேண்டும்?':'Sure. What task should I add?'); return; }
      if(/^(search|find) products?$/i.test(lower)) { pending='search'; reply('Which product are you looking for?'); return; }
      if(/^(complete|finish) (?:a )?task$/i.test(lower)) { pending='complete'; reply('Which task number did you finish?'); return; }
      command=command.replace(/^(?:add (?:a |new )?task|create (?:a )?task|make (?:a )?task)(?: to)?\s+/i,'add task ');
      command=command.replace(/^(?:mark )?task (one|two|three|four|five|\d+) (?:as )?(?:done|complete|completed)$/i,'complete task $1');
      command=command.replace(/^(complete task|finish task) (one|two|three|four|five)$/i,(_,prefix,n)=>prefix+' '+({one:1,two:2,three:3,four:4,five:5}[n.toLowerCase()]));
      lower=command.toLowerCase();
      if(/^(hi|hello|hey|வணக்கம்)$/iu.test(lower)) { reply(tamil?'வணக்கம்! உங்கள் பணிகள் மற்றும் கடை அறிக்கைகளில் உதவுகிறேன்.':'Hi! I can tell you how your shop is doing, find products, or help with your tasks. What would you like?'); return; }
      if(/^(thank you|thanks|bye|goodbye)$/i.test(lower)) { conversation=false;reply('You’re welcome. Tap the mic whenever you need me.');return; }
      if(!/^(add task|பணி சேர்)\s/u.test(lower) && /\b(today|yesterday|this week|this month|sales|revenue|orders|visitors)\b/i.test(lower)) { reply('I can read current product totals and all-time recorded product clicks. I don’t have sales, visitor, or date-filtered reports here yet.'); return; }
      if(/^(how is my shop doing|how's my shop doing|give me (?:a |my )?report|tell me about my shop|how many (?:(?:free|paid|visible|hidden) )?products(?: do i have)?|what is my product count)$/i.test(lower)) lower='read report';
      if(/^(what are my (?:pending )?tasks|what do i (?:have|need) to do|show (?:me )?my tasks|read my tasks)$/i.test(lower)) lower='list tasks';
      if(/^(which product (?:is most popular|has the most clicks)|how many clicks(?: do i have)?|read (?:my )?clicks)$/i.test(lower)) lower='click report';
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
    finally { clearTimeout(timeout); busy=false; if(turn===epoch && available() && !speaking && $('voiceWindow').dataset.state==='thinking') state('idle','Tap the mic to talk'); }
  }
  function stop() {
    epoch++; conversation=false; pending=''; listening=false; speaking=false; ++speechId;
    clearTimeout(restartTimer);clearTimeout(speechTimer);recognition?.abort();window.speechSynthesis?.cancel();
    state('idle','Conversation stopped. Tap the mic to start.');
  }
  const Recognition=window.SpeechRecognition || window.webkitSpeechRecognition;
  function startListening() {
    if(!available() || $('voiceWindow').hidden || busy || listening || speaking || !recognition)return;
    recognition.lang=$('voiceLanguage').value;
    try{listening=true;recognition.start();}catch{listening=false;conversation=false;state('idle','Microphone could not start. Tap the mic to retry.');}
  }
  if(Recognition) {
    recognition=new Recognition(); recognition.continuous=false; recognition.interimResults=true;
    recognition.onstart=()=>{if(!conversation || !available()){recognition.abort();return;}listening=true;state('listening','Listening…');};
    recognition.onend=()=>{listening=false;if($('voiceWindow').dataset.state==='listening')state('idle','Tap the mic to talk');};
    recognition.onresult=event=>{
      if(!available() || !conversation || !listening)return;
      const result=event.results[event.resultIndex];
      $('voiceTranscript').textContent=result[0].transcript;
      if(result.isFinal){listening=false;recognition.stop();run(result[0].transcript);}
    };
    recognition.onerror=event=>{
      if(event.error==='aborted')return;
      listening=false;conversation=false;
      const messages={'not-allowed':'Allow microphone access in your browser, then tap the mic.','no-speech':'I didn’t hear anything. Tap the mic to try again.','audio-capture':'No microphone was found. Check your microphone connection.','network':'The voice service could not connect. Check your connection or type below.'};
      state('idle',messages[event.error] || 'Voice input failed. Try again or type below.');
    };
  } else { $('voiceListen').disabled=true;state('idle','Voice input is unavailable here. Type a message below.'); }
  function open() { $('voiceWindow').hidden=false;$('voiceLaunch').setAttribute('aria-expanded','true');$('voiceClose').focus(); }
  function close() {stop();$('voiceWindow').hidden=true;$('voiceLaunch').setAttribute('aria-expanded','false');$('voiceLaunch').focus();}
  $('voiceLaunch').onclick=()=>{if(!available())return;if(!$('voiceWindow').hidden){close();return;}open();conversation=true;startListening();};
  $('voiceClose').onclick=close;
  panel.addEventListener('keydown',event=>{if(event.key==='Escape')close();});
  $('voiceListen').onclick=()=>{if(!available() || busy)return;const followup=pending;stop();pending=followup;conversation=true;startListening();};
  $('voiceReplay').onclick=()=>{if(!available())return;const text=$('voiceOutput').textContent;stop();speak(text);};
  $('voiceStop').onclick=stop;
  $('voiceLanguage').onchange=stop;
  $('voiceSpeak').onchange=()=>{stop();};
  function send(text) {const followup=pending;stop();pending=followup;run(text);$('voiceInput').value='';}
  $('voiceForm').onsubmit=event=>{event.preventDefault();if(!busy)send($('voiceInput').value);};
  panel.querySelectorAll('[data-command]').forEach(button=>button.onclick=()=>{if(!busy)send(button.dataset.command);});
  new MutationObserver(()=>{if(dashboard.hidden){stop();$('voiceWindow').hidden=true;$('voiceLaunch').setAttribute('aria-expanded','false');$('voiceInput').value='';$('voiceTranscript').textContent='';$('voiceOutput').textContent='Hi! What can I help you with?';}}).observe(dashboard,{attributes:true,attributeFilter:['hidden']});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  window.addEventListener('pagehide',stop);
  renderTasks();
})();
