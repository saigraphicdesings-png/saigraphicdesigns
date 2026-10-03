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
  export const calendarEvents = [
    ...holidays.map(([date, label, tamil]) => ({ date: `2026-${date}`, label, tamil, kind: 'Holiday', source: governmentSource })),
    ...festivals.map(([date, label, tamil]) => ({ date: `2026-${date}`, label, tamil, kind: 'Festival', source: festivalSource }))
  ].sort((a, b) => a.date.localeCompare(b.date));
