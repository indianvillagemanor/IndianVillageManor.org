
function getMonthMatrix(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const matrix = [];
  let week = [];
  const dayOfWeek = firstDay.getDay();
  // Fill initial empty days
  for (let i = 0; i < dayOfWeek; i++) week.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    week.push(d);
    if (week.length === 7) {
      matrix.push(week);
      week = [];
    }
  }
  // Fill trailing empty days
  if (week.length) {
    while (week.length < 7) week.push(null);
    matrix.push(week);
  }
  return matrix;
}

function CalendarTable({ year, month, events }: { year: number; month: number; events: { day: number; label: string }[] }) {
  const matrix = getMonthMatrix(year, month);
  const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });
  const eventDays = new Set(events.map(e => e.day));
  return (
    <div style={{ display: 'inline-block', margin: 16, border: '1px solid #ccc', borderRadius: 8, padding: 16, background: '#fff' }}>
      <h2 style={{ textAlign: 'center', margin: 0 }}>{monthName} {year}</h2>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <th key={d} style={{ borderBottom: '1px solid #ccc', padding: 4, fontWeight: 600 }}>{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((week, i) => (
            <tr key={i}>
              {week.map((d, j) => {
                const isEvent = d && eventDays.has(d);
                return (
                  <td
                    key={j}
                    style={{
                      textAlign: 'center',
                      padding: 4,
                      color: d ? (isEvent ? '#fff' : '#222') : '#bbb',
                      fontWeight: d ? 500 : 400,
                      background: isEvent ? '#00693f' : undefined,
                      borderRadius: isEvent ? 6 : undefined,
                      transition: 'background 0.2s',
                    }}
                  >
                    {d || ''}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CalendarPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const nextMonth = (month + 1) % 12;
  const nextMonthYear = month === 11 ? year + 1 : year;
  // Dummy events
  const events = [
    { date: new Date(year, 6, 19), label: 'Detroit Yacht Club Party' }, // July is month 6
    { date: new Date(year, 7, 30), label: 'Hydrofest' }, // August is month 7
  ];
  const eventsByMonth: { [key: string]: { day: number; label: string }[] } = {};
  for (const e of events) {
    const key = `${e.date.getFullYear()}-${e.date.getMonth()}`;
    if (!eventsByMonth[key]) eventsByMonth[key] = [];
    eventsByMonth[key].push({ day: e.date.getDate(), label: e.label });
  }
  const thisMonthKey = `${year}-${month}`;
  const nextMonthKey = `${nextMonthYear}-${nextMonth}`;
  const thisMonthEvents = eventsByMonth[thisMonthKey] || [];
  const nextMonthEvents = eventsByMonth[nextMonthKey] || [];
  // For event list
  const allEvents = events.filter(e =>
    (e.date.getFullYear() === year && e.date.getMonth() === month) ||
    (e.date.getFullYear() === nextMonthYear && e.date.getMonth() === nextMonth)
  );
  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700 }}>Calendar</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'row', gap: 32 }}>
          <CalendarTable year={year} month={month} events={thisMonthEvents} />
          <CalendarTable year={nextMonthYear} month={nextMonth} events={nextMonthEvents} />
        </div>
        <div style={{ minWidth: 220 }}>
          <h3>Upcoming Events</h3>
          <ul>
            {allEvents.map((e, i) => (
              <li key={i}>
                <b>{e.date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}:</b> {e.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
