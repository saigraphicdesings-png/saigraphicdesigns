import { calendarEvents as events } from "./calendar-events.js";
(() => {
  'use strict';
  const calendar = document.getElementById('taskCalendar');
  if (!calendar) return;
  const todayParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const part = type => todayParts.find(p => p.type === type).value;
  const today = `${part('year')}-${part('month')}-${part('day')}`;
  let selected = today;
  let month = new Date(Number(part('year')), Number(part('month')) - 1, 1);
  const days = document.getElementById('calendarDays');
  const agenda = document.getElementById('calendarAgenda');
  const title = document.getElementById('calendarMonth');
  const selectedTitle = document.getElementById('calendarSelectedDate');
  const iso = day => `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const dateLabel = date => new Date(date + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const eventsFor = date => events.filter(event => event.date === date);
  function eventCard(event, showDate = false) {
    const item = document.createElement('article');
    item.className = 'calendar-event';
    const kind = document.createElement('span');
    kind.className = `calendar-kind ${event.kind.toLowerCase()}`;
    kind.textContent = event.kind === 'Holiday' ? 'TN government holiday' : 'Regional festival';
    const name = document.createElement('strong');
    name.textContent = event.label;
    const tamil = document.createElement('small');
    tamil.lang = 'ta';
    tamil.textContent = event.tamil;
    item.append(kind, name, tamil);
    if (showDate) {
      const date = document.createElement('button');
      date.type = 'button';
      date.className = 'calendar-event-date';
      date.dataset.date = event.date;
      date.textContent = new Date(event.date + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      date.addEventListener('click', () => { selected = event.date; draw(); });
      item.prepend(date);
    }
    return item;
  }
  function drawAgenda() {
    selectedTitle.textContent = dateLabel(selected);
    agenda.replaceChildren();
    const selectedEvents = eventsFor(selected);
    if (!selectedEvents.length) {
      const p = document.createElement('p');
      p.className = 'calendar-empty';
      p.textContent = selected.startsWith('2026-') ? 'No listed holiday or festival on this date.' : 'Holiday and festival dates are available for 2026 only.';
      agenda.append(p);
    }
    selectedEvents.forEach(event => agenda.append(eventCard(event)));
    const monthly = document.getElementById('calendarMonthEvents');
    monthly.replaceChildren();
    const prefix = iso(1).slice(0, 7);
    const monthEvents = events.filter(event => event.date.startsWith(prefix));
    monthEvents.forEach(event => monthly.append(eventCard(event, true)));
    if (!monthEvents.length) {
      const p = document.createElement('p');
      p.className = 'calendar-empty';
      p.textContent = month.getFullYear() === 2026 ? 'No listed holidays or festivals this month.' : 'Dates for this year have not been added. Festival dates change each year.';
      monthly.append(p);
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
      button.setAttribute('aria-label', `${dateLabel(date)}${date === today ? ', today' : ''}, ${events.length} holidays and festivals`);
      if (date === today) { button.classList.add('is-today'); button.setAttribute('aria-current', 'date'); }
      if (events.length) {
        const marker = document.createElement('span');
        marker.className = 'calendar-markers';
        marker.setAttribute('aria-hidden', 'true');
        for (const kind of ['Holiday', 'Festival']) if (events.some(e => e.kind === kind)) {
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
  document.getElementById('calendarPrev').addEventListener('click', () => { month = new Date(month.getFullYear(), month.getMonth() - 1, 1); selected = iso(1); draw(); });
  document.getElementById('calendarNext').addEventListener('click', () => { month = new Date(month.getFullYear(), month.getMonth() + 1, 1); selected = iso(1); draw(); });
  document.getElementById('calendarToday').addEventListener('click', () => { selected = today; month = new Date(Number(part('year')), Number(part('month')) - 1, 1); draw(); });
  draw();
})();
