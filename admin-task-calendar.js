(() => {
  'use strict';
  const calendar = document.getElementById('taskCalendar');
  if (!calendar) return;
  const todayParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const part = type => todayParts.find(p => p.type === type).value;
  const today = `${part('year')}-${part('month')}-${part('day')}`;
  let selected = today;
  let month = new Date(Number(part('year')), Number(part('month')) - 1, 1);
  let tasks = [], loaded = false;
  const days = document.getElementById('calendarDays');
  const agenda = document.getElementById('calendarAgenda');
  const title = document.getElementById('calendarMonth');
  const selectedTitle = document.getElementById('calendarSelectedDate');
  const iso = day => `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const dateLabel = date => new Date(date + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const eventsFor = date => tasks.flatMap(task => [
    ...(task.endDate === date ? [{ task, kind: 'Deadline', label: task.taskTitle }] : []),
    ...(task.posterDates || []).filter(p => p.date === date).map(p => ({ task, kind: 'Poster', label: p.headline || task.taskTitle }))
  ]);
  function drawAgenda() {
    selectedTitle.textContent = dateLabel(selected);
    agenda.replaceChildren();
    const events = eventsFor(selected);
    if (!events.length) {
      const p = document.createElement('p');
      p.className = 'calendar-empty';
      p.textContent = loaded ? 'No work scheduled for this date in the selected task filter.' : 'Loading task dates…';
      agenda.append(p);
      return;
    }
    for (const event of events) {
      const item = document.createElement('article');
      item.className = 'calendar-event';
      const kind = document.createElement('span');
      kind.className = `calendar-kind ${event.kind.toLowerCase()}`;
      kind.textContent = event.kind;
      const name = document.createElement('strong');
      name.textContent = event.label;
      const detail = document.createElement('small');
      detail.textContent = `${event.task.customerName} · ${event.task.status}`;
      item.append(kind, name, detail);
      agenda.append(item);
    }
  }
  function draw() {
    title.textContent = month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    days.replaceChildren();
    const offset = (month.getDay() + 6) % 7;
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    for (let n = 0; n < offset; n++) {
      const spacer = document.createElement('span');
      spacer.setAttribute('aria-hidden', 'true');
      days.append(spacer);
    }
    for (let n = 1; n <= count; n++) {
      const date = iso(n), events = eventsFor(date);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'calendar-day';
      button.dataset.date = date;
      button.textContent = String(n);
      button.setAttribute('aria-pressed', String(date === selected));
      button.setAttribute('aria-label', `${dateLabel(date)}${date === today ? ', today' : ''}, ${events.length} scheduled items`);
      if (date === today) { button.classList.add('is-today'); button.setAttribute('aria-current', 'date'); }
      if (events.length) {
        const marker = document.createElement('span');
        marker.className = 'calendar-markers';
        marker.setAttribute('aria-hidden', 'true');
        for (const kind of ['Deadline', 'Poster']) if (events.some(e => e.kind === kind)) {
          const dot = document.createElement('i'); dot.className = kind.toLowerCase(); marker.append(dot);
        }
        button.append(marker);
      }
      days.append(button);
    }
    drawAgenda();
  }
  days.addEventListener('click', event => {
    const button = event.target.closest('button[data-date]');
    if (!button) return;
    selected = button.dataset.date;
    draw();
    days.querySelector(`[data-date="${selected}"]`).focus();
  });
  document.getElementById('calendarPrev').addEventListener('click', () => { month = new Date(month.getFullYear(), month.getMonth() - 1, 1); draw(); });
  document.getElementById('calendarNext').addEventListener('click', () => { month = new Date(month.getFullYear(), month.getMonth() + 1, 1); draw(); });
  document.getElementById('calendarToday').addEventListener('click', () => { selected = today; month = new Date(Number(part('year')), Number(part('month')) - 1, 1); draw(); });
  window.addEventListener('sai-tasks-updated', event => { tasks = event.detail.tasks; loaded = true; draw(); });
  window.addEventListener('sai-tasks-load-error', () => { loaded = false; agenda.replaceChildren(); const p = document.createElement('p');p.textContent = 'Task dates could not be loaded. Refresh to try again.';agenda.append(p); });
  draw();
})();
