(() => {
  'use strict';
  const calendar = document.getElementById('taskCalendar');
  if (!calendar) return;
  const todayParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const part = type => todayParts.find(p => p.type === type).value;
  const today = `${part('year')}-${part('month')}-${part('day')}`;
  let selected = today;
  let month = new Date(Number(part('year')), Number(part('month')) - 1, 1);
  // Year-specific dates: never repeat lunar festivals into another year.
  const governmentSource = 'https://www.tn.gov.in/sites/default/holidays/public_e_708_2025.pdf';
  const festivalSource = 'https://www.drikpanchang.com/tamil/tamil-calendar.html?geoname-id=1264527&year=2026';
  const holidays = [
    ['01-01', "New Year's Day", 'ஆங்கிலப் புத்தாண்டு'],
    ['01-15', 'Pongal', 'பொங்கல்'],
    ['01-16', 'Thiruvalluvar Day / Mattu Pongal', 'திருவள்ளுவர் தினம் / மாட்டுப் பொங்கல்'],
    ['01-17', 'Uzhavar Thirunal / Kaanum Pongal', 'உழவர் திருநாள் / காணும் பொங்கல்'],
    ['01-26', 'Republic Day', 'குடியரசு தினம்'],
    ['02-01', 'Thai Poosam', 'தைப்பூசம்'],
    ['03-19', 'Telugu New Year', 'தெலுங்கு புத்தாண்டு'],
    ['03-21', 'Ramzan / Eid al-Fitr', 'ரம்ஜான்'],
    ['03-31', 'Mahaveer Jayanthi', 'மகாவீர் ஜெயந்தி'],
    ['04-03', 'Good Friday', 'புனித வெள்ளி'],
    ['04-14', 'Tamil New Year / Ambedkar Jayanti', 'தமிழ்ப் புத்தாண்டு / அம்பேத்கர் பிறந்தநாள்'],
    ['05-01', 'May Day', 'தொழிலாளர் தினம்'],
    ['05-28', 'Bakrid / Eid al-Adha', 'பக்ரீத்'],
    ['06-26', 'Muharram', 'மொஹரம்'],
    ['08-15', 'Independence Day', 'சுதந்திர தினம்'],
    ['08-26', 'Milad-un-Nabi', 'மிலாது நபி'],
    ['09-04', 'Krishna Jayanthi', 'கிருஷ்ண ஜெயந்தி'],
    ['09-14', 'Vinayakar Chathurthi', 'விநாயகர் சதுர்த்தி'],
    ['10-02', 'Gandhi Jayanthi', 'காந்தி ஜெயந்தி'],
    ['10-19', 'Ayudha Pooja', 'ஆயுத பூஜை'],
    ['10-20', 'Vijayadasami', 'விஜயதசமி'],
    ['11-08', 'Deepavali', 'தீபாவளி'],
    ['12-25', 'Christmas', 'கிறிஸ்துமஸ்']
  ];
  const festivals = [
    ['02-15', 'Maha Shivaratri', 'மகா சிவராத்திரி'],
    ['03-03', 'Masi Magam', 'மாசி மகம்'],
    ['04-01', 'Panguni Uthiram', 'பங்குனி உத்திரம்'],
    ['04-19', 'Akshaya Thiruthiyai', 'அட்சய திருதியை'],
    ['05-01', 'Chitra Pournami', 'சித்திரா பௌர்ணமி'],
    ['05-30', 'Vaikasi Visakam', 'வைகாசி விசாகம்'],
    ['08-03', 'Aadi Perukku', 'ஆடிப்பெருக்கு'],
    ['08-14', 'Aadi Pooram / Andal Jayanthi', 'ஆடிப்பூரம்'],
    ['10-11', 'Navarathri / Golu begins', 'நவராத்திரி / கொலு தொடக்கம்'],
    ['11-15', 'Kanda Sashti / Soorasamharam', 'கந்த சஷ்டி / சூரசம்ஹாரம்'],
    ['11-24', 'Karthigai Deepam', 'கார்த்திகை தீபம்'],
    ['12-20', 'Vaikunta Ekadashi', 'வைகுண்ட ஏகாதசி'],
    ['12-24', 'Arudra Darisanam', 'ஆருத்ரா தரிசனம்']
  ];
  const events = [
    ...holidays.map(([date, label, tamil]) => ({ date: `2026-${date}`, label, tamil, kind: 'Holiday', source: governmentSource })),
    ...festivals.map(([date, label, tamil]) => ({ date: `2026-${date}`, label, tamil, kind: 'Festival', source: festivalSource }))
  ].sort((a, b) => a.date.localeCompare(b.date));
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
