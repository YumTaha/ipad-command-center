(function (root) {
    'use strict';
    function pad(n) { return n < 10 ? '0' + n : String(n); }
    function key(date) { return date.getUTCFullYear() + '-' + pad(date.getUTCMonth() + 1) + '-' + pad(date.getUTCDate()); }
    function color(title) { var hash = 0, i; for (i = 0; i < title.length; i += 1) { hash = (hash * 31 + title.charCodeAt(i)) >>> 0; } return 'c' + (hash % 4 + 1); }
    function build(events, now, parts, stamp) {
        var p = parts(new Date(now)), civil = new Date(Date.UTC(p.year, p.month - 1, p.day)), sunday = civil.getTime() - civil.getUTCDay() * 86400000, days = [], i, j, date, next, start, end, a, b, from, to, first, last, item;
        for (i = 0; i < 7; i += 1) {
            date = new Date(sunday + i * 86400000); next = new Date(sunday + (i + 1) * 86400000);
            start = stamp(key(date)); end = stamp(key(next));
            days.push({ key: key(date), date: date, start: start, end: end, today: date.getTime() === civil.getTime(), allDay: [], timed: [] });
            for (j = 0; j < events.length; j += 1) {
                a = stamp(events[j].start); b = stamp(events[j].end);
                if (!isFinite(a) || !isFinite(b) || b <= start || a >= end || b <= a) { continue; }
                item = { event: events[j], color: color(events[j].title), continuationBefore: a < start, continuationAfter: b > end };
                if (events[j].allDay) { days[i].allDay.push(item); continue; }
                from = Math.max(a, start); to = Math.min(b, end); first = parts(new Date(from)); last = parts(new Date(to));
                item.startMs = from; item.endMs = to;
                item.startMinute = from === start ? 0 : first.hour * 60 + first.minute + new Date(from).getUTCSeconds() / 60;
                item.endMinute = to === end ? 1440 : last.hour * 60 + last.minute + new Date(to).getUTCSeconds() / 60;
                // A repeated fall-back hour can move the civil clock backwards.
                // Keep the segment visible; its accessible label carries EDT/EST.
                if (item.endMinute <= item.startMinute) { item.endMinute = Math.min(1440, item.startMinute + (to - from) / 60000); }
                days[i].timed.push(item);
            }
        }
        return { days: days, sunday: new Date(sunday), todayIndex: civil.getUTCDay(), nowMinute: p.hour * 60 + p.minute };
    }
    function lanes(items, minMinutes) {
        var rows = [], i, row, group = [], groupEnd = -1, laneEnds = [], lane, j;
        minMinutes = Math.max(1, Math.min(1440, minMinutes || 1));
        function finish() { var k; for (k = 0; k < group.length; k += 1) { group[k].laneCount = laneEnds.length; } group = []; laneEnds = []; groupEnd = -1; }
        for (i = 0; i < items.length; i += 1) {
            row = { item: items[i], top: Math.min(items[i].startMinute, 1440 - minMinutes), bottom: 0, lane: 0, laneCount: 1 };
            row.bottom = Math.min(1440, Math.max(items[i].endMinute, row.top + minMinutes)); rows.push(row);
        }
        rows.sort(function (a, b) { return a.top - b.top || b.bottom - a.bottom; });
        for (i = 0; i < rows.length; i += 1) {
            row = rows[i]; if (group.length && row.top >= groupEnd) { finish(); }
            lane = -1;
            for (j = 0; j < laneEnds.length; j += 1) { if (laneEnds[j] <= row.top) { lane = j; break; } }
            if (lane < 0) { lane = laneEnds.length; }
            laneEnds[lane] = row.bottom; row.lane = lane; group.push(row); groupEnd = Math.max(groupEnd, row.bottom);
        }
        finish(); return rows;
    }
    root.RoomWeek = { build: build, lanes: lanes };
}(window));
