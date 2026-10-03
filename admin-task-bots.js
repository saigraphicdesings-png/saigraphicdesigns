(() => {
  const select=document.getElementById('notificationBot'), settings=document.getElementById('taskBotSettings'), message=document.getElementById('botSettingsMessage');
  let bots=[], holidayBot="none";
  const headers=()=>({Authorization:'Bearer '+(sessionStorage.getItem('saiShopAdminToken')||''),'Content-Type':'application/json'});
  window.taskBotName=id=>bots.find(bot=>bot.id===(id||'primary'))?.name||(id==='team1'?'Sector / Team 1':id==='team2'?'Sector / Team 2':'Main task bot');
  function render(list) {
    bots=list; const current=select.value||'primary';select.replaceChildren();
    for(const bot of bots){const option=document.createElement('option');option.value=bot.id;option.textContent=bot.name+(bot.configured?'':' — not connected');option.disabled=bot.id!=='primary'&&!bot.configured;select.append(option)}
    select.value=current;
    const holidaySelect=document.getElementById('holidayNotificationBot');
    holidaySelect.replaceChildren(new Option('Off — no automatic event reminders','none'));
    for(const bot of bots){const option=new Option(bot.name+(bot.configured?'':' — not connected'),bot.id);option.disabled=!bot.configured;holidaySelect.append(option)}
    holidaySelect.value=holidayBot;
    window.dispatchEvent(new Event('sai-task-bots-updated'));
  }
  function fillSettings(){const bot=bots.find(b=>b.id===document.getElementById('teamBotSlot').value);document.getElementById('teamBotName').value=bot?.name||'';document.getElementById('teamBotChat').value=bot?.chatId||'';document.getElementById('teamBotToken').value='';document.getElementById('teamBotToken').required=!bot?.configured;}
  document.getElementById('teamBotSlot').addEventListener('change',fillSettings);
  settings.addEventListener('submit',async event=>{event.preventDefault();const button=document.getElementById('saveTeamBot');button.disabled=true;message.textContent='Verifying and saving bot…';try{const r=await fetch('/api/admin/tasks/bots',{method:'POST',headers:headers(),body:JSON.stringify({id:document.getElementById('teamBotSlot').value,name:document.getElementById('teamBotName').value,chatId:document.getElementById('teamBotChat').value,botToken:document.getElementById('teamBotToken').value})});const data=await r.json();if(!r.ok)throw Error(data.error||'Could not save bot.');render(data.bots);fillSettings();message.textContent='Bot connected. Select it when adding or editing a task.';}catch(error){message.textContent=error.message}finally{button.disabled=false}});
  document.getElementById('holidayNotificationSettings').addEventListener('submit',async event=>{
    event.preventDefault();const button=document.getElementById('saveHolidayNotifications'),status=document.getElementById('holidayNotificationMessage');button.disabled=true;status.textContent='Saving event notifications…';
    try{const response=await fetch('/api/admin/tasks/holiday-notifications',{method:'POST',headers:headers(),body:JSON.stringify({notificationBot:document.getElementById('holidayNotificationBot').value})});const data=await response.json();if(!response.ok)throw Error(data.error||'Could not save event notifications.');holidayBot=data.notificationBot;status.textContent=holidayBot==='none'?'Automatic holiday and festival reminders are off.':'Saved. All calendar events will remind '+window.taskBotName(holidayBot)+' the day before at 9 AM and 6 PM India time.';}catch(error){status.textContent=error.message}finally{button.disabled=false}
  });
  (async()=>{try{const r=await fetch('/api/admin/tasks/bots',{headers:headers()});if(!r.ok)throw Error('Could not load notification bots. Refresh to try again.');render((await r.json()).bots);fillSettings();const settingsResponse=await fetch('/api/admin/tasks/holiday-notifications',{headers:headers()});if(!settingsResponse.ok)throw Error('Could not load event reminder settings.');holidayBot=(await settingsResponse.json()).notificationBot;document.getElementById('holidayNotificationBot').value=holidayBot}catch(error){message.textContent=error.message}})();
})();
