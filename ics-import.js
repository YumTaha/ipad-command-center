/* Outlook snapshot importer. Uses pinned, locally served ICAL.js 1.5.0. */
function roomImportICS(text, now, civil) {
    'use strict';
    var IC = window.ICAL, calendar = new IC.Component(IC.parse(text)), components, zones = {}, masters = {}, rows = [], seen = {}, i, j, k, c, properties, property, values, value, tzid, zoneComponents, names = ['dtstart', 'dtend', 'recurrence-id', 'rdate', 'exdate'], event, master, iterator, occurrence, detail;
    var start = now.getTime(), end = start + 30 * 86400000, startDay = civil(start), endDay = civil(end), steps = 0, began = Date.now();
    if (calendar.name !== 'vcalendar') { throw new Error('Invalid ICS calendar'); }
    components = calendar.getAllSubcomponents('vevent');
    if (components.length > 1000) { throw new Error('Too many events; export a smaller display calendar.'); }
    zoneComponents = calendar.getAllSubcomponents('vtimezone');
    for (i = 0; i < zoneComponents.length; i += 1) { tzid = zoneComponents[i].getFirstPropertyValue('tzid'); if (tzid) { zones['$' + tzid] = new IC.Timezone({ component: zoneComponents[i], tzid: tzid }); } }
    for (i = 0; i < components.length; i += 1) {
        c = components[i];
        for (j = 0; j < names.length; j += 1) {
            properties = c.getAllProperties(names[j]);
            for (k = 0; k < properties.length; k += 1) {
                property = properties[k]; tzid = property.getParameter('tzid');
                if (tzid && tzid !== 'UTC' && !zones['$' + tzid]) { throw new Error('Missing VTIMEZONE for ' + tzid + '. Export UTC or include time zones.'); }
                values = property.getValues();
                for (var n = 0; n < values.length; n += 1) {
                    value = values[n];
                    if (!value || !value.clone) { throw new Error('Unsupported ICS date or RDATE period'); }
                    if (tzid && zones['$' + tzid]) { value.zone = zones['$' + tzid]; }
                    if (!value.isDate && value.zone === IC.Timezone.localTimezone) { throw new Error('Floating event times are unsupported. Export UTC or include time zones.'); }
                }
            }
        }
        if (c.hasProperty('exrule')) { throw new Error('EXRULE is unsupported. Use the private proxy.'); }
        properties = c.getAllProperties('rrule');
        for (j = 0; j < properties.length; j += 1) { if (['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].indexOf(properties[j].getFirstValue().freq) < 0) { throw new Error('High-frequency recurrence is unsupported.'); } }
    }
    function add(item, from, to) {
        var allDay, a, b, included, key;
        if (item.component.getFirstPropertyValue('status') === 'CANCELLED') { return; }
        if (!from || !to || from.isDate !== to.isDate) { throw new Error('Event has invalid start or end'); }
        allDay = from.isDate; a = allDay ? from.toString() : from.toJSDate().toISOString(); b = allDay ? to.toString() : to.toJSDate().toISOString();
        if (b <= a) { throw new Error('Event end must follow its start'); }
        included = allDay ? b > startDay && a <= endDay : to.toUnixTime() * 1000 > start && from.toUnixTime() * 1000 < end;
        if (!included) { return; }
        key = '$' + item.uid + '|' + a + '|' + b;
        if (seen[key]) { return; } seen[key] = true;
        rows.push({ title: 'Busy', start: a, end: b, allDay: allDay });
        if (rows.length > 1000) { throw new Error('Too many occurrences for this display.'); }
    }
    for (i = 0; i < components.length; i += 1) { c = components[i]; if (c.hasProperty('recurrence-id')) { continue; } event = new IC.Event(c, { exceptions: [], strictExceptions: true }); if (!event.startDate || !event.uid || masters['$' + event.uid]) { throw new Error('Missing or duplicate event identity'); } masters['$' + event.uid] = event; }
    for (i = 0; i < components.length; i += 1) { c = components[i]; if (!c.hasProperty('recurrence-id')) { continue; } event = new IC.Event(c, { exceptions: [] }); if (!event.uid) { throw new Error('Missing recurrence exception identity'); } if (event.modifiesFuture()) { throw new Error('THISANDFUTURE changes are unsupported. Use the private proxy.'); } master = masters['$' + event.uid]; if (!master) { if (event.component.getFirstPropertyValue('status') === 'CANCELLED') { continue; } /* Outlook windowed exports can omit the master. Use only this explicit occurrence. */ add(event, event.startDate, event.endDate); continue; } if (master.component.getFirstPropertyValue('status') === 'CANCELLED') { continue; } master.relateException(event); add(event, event.startDate, event.endDate); }
    for (var uid in masters) {
        if (!Object.prototype.hasOwnProperty.call(masters, uid)) { continue; }
        event = masters[uid]; if (event.component.getFirstPropertyValue('status') === 'CANCELLED') { continue; }
        if (!event.isRecurring()) { add(event, event.startDate, event.endDate); continue; }
        iterator = event.iterator();
        while ((occurrence = iterator.next())) {
            steps += 1;
            if (steps > 20000 || Date.now() - began > 2000) { throw new Error('Calendar recurrence took too long. Export a smaller calendar or use the proxy.'); }
            if (occurrence.isDate ? occurrence.toString() > endDay : occurrence.toUnixTime() * 1000 >= end) { break; }
            detail = event.getOccurrenceDetails(occurrence); add(detail.item, detail.startDate, detail.endDate);
        }
    }
    rows.sort(function (a, b) { return a.start.localeCompare(b.start); });
    return rows;
}
