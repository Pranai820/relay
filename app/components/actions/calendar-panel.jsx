"use client";

import { useEffect, useState } from "react";
import { runTool, runWorkflow, searchNotionPages } from "./api";
import { pickArgs, parseBool, parseCsv, parseIntField, parseJson } from "./custom-args";
import { BoolSelect, JsonArea, NumberInput } from "./custom-fields";
import { Field, Input, NotionParentPicker, Select, TextArea, ToolCard } from "./shared";

function localOffset() {
  const d = new Date();
  const m = -d.getTimezoneOffset();
  const sign = m >= 0 ? "+" : "-";
  const abs = Math.abs(m);
  const pad = (n) => String(n).padStart(2, "0");
  return `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

function toLocalInput(date) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function weekRange() {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + 7);
  const off = localOffset();
  const fmt = (d) => `${d.toISOString().slice(0, 19)}${off}`;
  return { timeMin: fmt(now), timeMax: fmt(end) };
}

export default function CalendarPanel({ connected, notionConnected, userEmail, onResult, loadingKey, setLoadingKey, editEvent, setEditEvent }) {
  const [timezone, setTimezone] = useState(typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC");
  const [notionPages, setNotionPages] = useState([]);
  const [parentId, setParentId] = useState("");
  const [calendarId, setCalendarId] = useState("primary");

  const [listTimeMin, setListTimeMin] = useState("");
  const [listTimeMax, setListTimeMax] = useState("");
  const [listQ, setListQ] = useState("");
  const [listOrderBy, setListOrderBy] = useState("startTime");
  const [listMaxResults, setListMaxResults] = useState("50");
  const [listPageToken, setListPageToken] = useState("");
  const [listSingleEvents, setListSingleEvents] = useState("true");
  const [listShowDeleted, setListShowDeleted] = useState("");
  const [listShowHidden, setListShowHidden] = useState("");
  const [listUpdatedMin, setListUpdatedMin] = useState("");
  const [listMaxAttendees, setListMaxAttendees] = useState("");
  const [listEventTypes, setListEventTypes] = useState("");
  const [listICalUID, setListICalUID] = useState("");
  const [listSyncToken, setListSyncToken] = useState("");
  const [listPrivateExt, setListPrivateExt] = useState("");
  const [listSharedExt, setListSharedExt] = useState("");

  const [searchQ, setSearchQ] = useState("");
  const [searchTimeMin, setSearchTimeMin] = useState("");
  const [searchTimeMax, setSearchTimeMax] = useState("");
  const [searchMaxResults, setSearchMaxResults] = useState("25");
  const [searchPageToken, setSearchPageToken] = useState("");
  const [searchOrderBy, setSearchOrderBy] = useState("");
  const [searchSingleEvents, setSearchSingleEvents] = useState("true");
  const [searchShowDeleted, setSearchShowDeleted] = useState("");
  const [searchUpdatedMin, setSearchUpdatedMin] = useState("");
  const [searchEventTypes, setSearchEventTypes] = useState("");

  const [title, setTitle] = useState("");
  const [start, setStart] = useState(toLocalInput(new Date()));
  const [endDatetime, setEndDatetime] = useState("");
  const [durationHour, setDurationHour] = useState("0");
  const [duration, setDuration] = useState("30");
  const [attendees, setAttendees] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [recurrence, setRecurrence] = useState("");
  const [visibility, setVisibility] = useState("");
  const [transparency, setTransparency] = useState("");
  const [eventType, setEventType] = useState("");
  const [sendUpdates, setSendUpdates] = useState("");
  const [createMeetingRoom, setCreateMeetingRoom] = useState("true");
  const [excludeOrganizer, setExcludeOrganizer] = useState("");
  const [guestsCanModify, setGuestsCanModify] = useState("");
  const [guestsCanInvite, setGuestsCanInvite] = useState("");
  const [guestsCanSee, setGuestsCanSee] = useState("");

  const [patchEndTime, setPatchEndTime] = useState("");
  const [patchStatus, setPatchStatus] = useState("");
  const [patchRsvp, setPatchRsvp] = useState("");
  const [patchReminders, setPatchReminders] = useState("");
  const [patchColorId, setPatchColorId] = useState("");
  const [patchMaxAttendees, setPatchMaxAttendees] = useState("");
  const [patchGuestsModify, setPatchGuestsModify] = useState("");
  const [patchGuestsInvite, setPatchGuestsInvite] = useState("");
  const [patchGuestsSee, setPatchGuestsSee] = useState("");
  const [patchRecurrence, setPatchRecurrence] = useState("");
  const [patchSendUpdates, setPatchSendUpdates] = useState("all");

  const [listCalMax, setListCalMax] = useState("50");
  const [listCalPageToken, setListCalPageToken] = useState("");
  const [listCalShowHidden, setListCalShowHidden] = useState("");
  const [listCalShowDeleted, setListCalShowDeleted] = useState("");
  const [listCalMinRole, setListCalMinRole] = useState("");
  const [listCalSyncToken, setListCalSyncToken] = useState("");

  useEffect(() => {
    if (notionConnected) searchNotionPages("").then(setNotionPages).catch(() => setNotionPages([]));
  }, [notionConnected]);

  useEffect(() => {
    if (editEvent) {
      setTitle(editEvent.summary || "");
      setStart(toLocalInput(editEvent.start?.dateTime || editEvent.start?.date || new Date()));
      setLocation(editEvent.location || "");
      setDescription(editEvent.description || "");
      setAttendees((editEvent.attendees || []).map((a) => a.email).filter(Boolean).join(", "));
    }
  }, [editEvent]);

  async function exec(key, fn) {
    setLoadingKey(key);
    try {
      onResult(await fn());
    } catch (e) {
      onResult({ error: e.message });
    } finally {
      setLoadingKey("");
    }
  }

  if (!connected) {
    return <p className="toolkit-hint">Connect Google Calendar in the Connections tab to use these actions.</p>;
  }

  const calendarField = (
    <Field label="calendar_id / calendarId">
      <Input value={calendarId} onChange={setCalendarId} placeholder="primary" />
    </Field>
  );

  return (
    <div className="toolkit-grid">
      <ToolCard
        title="Agenda"
        description="All events for the next 7 days. Edit or delete only events you created."
        loading={loadingKey === "cal-agenda"}
        onRun={(mode) => {
          const range = weekRange();
          return exec("cal-agenda", () => runTool({
            toolSlug: "GOOGLECALENDAR_EVENTS_LIST",
            mode: mode === "custom" ? "custom" : "custom",
            args: mode === "custom" ? pickArgs({
              calendarId,
              timeMin: listTimeMin || range.timeMin,
              timeMax: listTimeMax || range.timeMax,
              q: listQ,
              orderBy: listOrderBy,
              maxResults: parseIntField(listMaxResults),
              pageToken: listPageToken,
              singleEvents: parseBool(listSingleEvents),
              showDeleted: parseBool(listShowDeleted),
              showHiddenInvitations: parseBool(listShowHidden),
              timeZone: timezone,
              updatedMin: listUpdatedMin,
              maxAttendees: parseIntField(listMaxAttendees),
              eventTypes: listEventTypes || undefined,
              iCalUID: listICalUID,
              syncToken: listSyncToken,
              privateExtendedProperty: listPrivateExt,
              sharedExtendedProperty: listSharedExt,
            }) : {
              calendarId: "primary",
              ...range,
              singleEvents: true,
              orderBy: "startTime",
              timeZone: timezone,
            },
          }));
        }}
      >
        {{
          quick: <p className="quick-hint">Next 7 days on your primary calendar.</p>,
          custom: (
            <>
              {calendarField}
              <Field label="timeMin (RFC3339)"><Input value={listTimeMin} onChange={setListTimeMin} placeholder="Auto: now" /></Field>
              <Field label="timeMax (RFC3339)"><Input value={listTimeMax} onChange={setListTimeMax} placeholder="Auto: +7 days" /></Field>
              <Field label="q" span><Input value={listQ} onChange={setListQ} /></Field>
              <Field label="orderBy">
                <Select value={listOrderBy} onChange={setListOrderBy} options={[
                  { value: "startTime", label: "startTime" },
                  { value: "updated", label: "updated" },
                ]} />
              </Field>
              <NumberInput label="maxResults" value={listMaxResults} onChange={setListMaxResults} />
              <Field label="pageToken"><Input value={listPageToken} onChange={setListPageToken} /></Field>
              <BoolSelect label="singleEvents" value={listSingleEvents} onChange={setListSingleEvents} />
              <BoolSelect label="showDeleted" value={listShowDeleted} onChange={setListShowDeleted} />
              <BoolSelect label="showHiddenInvitations" value={listShowHidden} onChange={setListShowHidden} />
              <Field label="timeZone"><Input value={timezone} onChange={setTimezone} /></Field>
              <Field label="updatedMin"><Input value={listUpdatedMin} onChange={setListUpdatedMin} /></Field>
              <NumberInput label="maxAttendees" value={listMaxAttendees} onChange={setListMaxAttendees} />
              <Field label="eventTypes">
                <Select value={listEventTypes} onChange={setListEventTypes} options={[
                  { value: "", label: "Default" },
                  { value: "birthday", label: "birthday" },
                  { value: "default", label: "default" },
                  { value: "focusTime", label: "focusTime" },
                  { value: "fromGmail", label: "fromGmail" },
                  { value: "outOfOffice", label: "outOfOffice" },
                  { value: "workingLocation", label: "workingLocation" },
                ]} />
              </Field>
              <Field label="iCalUID"><Input value={listICalUID} onChange={setListICalUID} /></Field>
              <Field label="syncToken"><Input value={listSyncToken} onChange={setListSyncToken} /></Field>
              <Field label="privateExtendedProperty"><Input value={listPrivateExt} onChange={setListPrivateExt} placeholder="prop=value" /></Field>
              <Field label="sharedExtendedProperty"><Input value={listSharedExt} onChange={setListSharedExt} placeholder="prop=value" /></Field>
            </>
          ),
        }}
      </ToolCard>

      <ToolCard
        title="Search My Events"
        description="Find events you created — all results can be edited or deleted."
        loading={loadingKey === "cal-search"}
        onRun={(mode) => exec("cal-search", () => runTool({
          toolSlug: "GOOGLECALENDAR_FIND_EVENT",
          mode: "custom",
          args: pickArgs({
            calendar_id: calendarId,
            query: searchQ,
            time_min: searchTimeMin,
            time_max: searchTimeMax,
            max_results: parseIntField(searchMaxResults),
            page_token: searchPageToken,
            order_by: searchOrderBy || undefined,
            single_events: parseBool(searchSingleEvents),
            show_deleted: parseBool(searchShowDeleted),
            updated_min: searchUpdatedMin,
            event_types: parseCsv(searchEventTypes),
          }),
        }))}
      >
        {{
          quick: <Field label="query" span><Input value={searchQ} onChange={setSearchQ} placeholder="standup, review, 1:1" /></Field>,
          custom: (
            <>
              {calendarField}
              <Field label="query" span><Input value={searchQ} onChange={setSearchQ} /></Field>
              <Field label="time_min"><Input value={searchTimeMin} onChange={setSearchTimeMin} /></Field>
              <Field label="time_max"><Input value={searchTimeMax} onChange={setSearchTimeMax} /></Field>
              <NumberInput label="max_results" value={searchMaxResults} onChange={setSearchMaxResults} />
              <Field label="page_token"><Input value={searchPageToken} onChange={setSearchPageToken} /></Field>
              <Field label="order_by">
                <Select value={searchOrderBy} onChange={setSearchOrderBy} options={[
                  { value: "", label: "Default" },
                  { value: "startTime", label: "startTime" },
                  { value: "updated", label: "updated" },
                ]} />
              </Field>
              <BoolSelect label="single_events" value={searchSingleEvents} onChange={setSearchSingleEvents} />
              <BoolSelect label="show_deleted" value={searchShowDeleted} onChange={setSearchShowDeleted} />
              <Field label="updated_min"><Input value={searchUpdatedMin} onChange={setSearchUpdatedMin} /></Field>
              <Field label="event_types (comma-separated)"><Input value={searchEventTypes} onChange={setSearchEventTypes} placeholder="default,focusTime" /></Field>
            </>
          ),
        }}
      </ToolCard>

      <ToolCard
        title="Create Event"
        description="Quickly schedule with title, time, duration, and attendees."
        loading={loadingKey === "cal-create"}
        runLabel="Create"
        onRun={() => {
          let recurrenceArr;
          try { recurrenceArr = parseJson(recurrence, "recurrence"); } catch (e) { return onResult({ error: e.message }); }
          return exec("cal-create", () => runTool({
            toolSlug: "GOOGLECALENDAR_CREATE_EVENT",
            mode: "custom",
            args: pickArgs({
              calendar_id: calendarId,
              summary: title,
              start_datetime: start.replace("T", "T"),
              end_datetime: endDatetime || undefined,
              event_duration_hour: parseIntField(durationHour),
              event_duration_minutes: parseIntField(duration),
              timezone,
              description,
              location,
              attendees: parseCsv(attendees),
              recurrence: recurrenceArr,
              visibility: visibility || undefined,
              transparency: transparency || undefined,
              eventType: eventType || undefined,
              send_updates: sendUpdates || undefined,
              create_meeting_room: parseBool(createMeetingRoom),
              exclude_organizer: parseBool(excludeOrganizer),
              guestsCanModify: parseBool(guestsCanModify),
              guestsCanInviteOthers: parseBool(guestsCanInvite),
              guestsCanSeeOtherGuests: parseBool(guestsCanSee),
            }),
          }));
        }}
      >
        {{
          quick: (
            <>
              <Field label="summary" span><Input value={title} onChange={setTitle} placeholder="Team sync" /></Field>
              <Field label="start_datetime"><Input type="datetime-local" value={start} onChange={setStart} /></Field>
              <Field label="event_duration_minutes"><Input value={duration} onChange={setDuration} /></Field>
              <Field label="attendees" span><Input value={attendees} onChange={setAttendees} placeholder="a@co.com, b@co.com" /></Field>
            </>
          ),
          custom: (
            <>
              {calendarField}
              <Field label="summary" span><Input value={title} onChange={setTitle} /></Field>
              <Field label="start_datetime"><Input type="datetime-local" value={start} onChange={setStart} /></Field>
              <Field label="end_datetime"><Input type="datetime-local" value={endDatetime} onChange={setEndDatetime} /></Field>
              <NumberInput label="event_duration_hour" value={durationHour} onChange={setDurationHour} />
              <NumberInput label="event_duration_minutes" value={duration} onChange={setDuration} />
              <Field label="timezone"><Input value={timezone} onChange={setTimezone} /></Field>
              <Field label="description" span><TextArea value={description} onChange={setDescription} /></Field>
              <Field label="location"><Input value={location} onChange={setLocation} /></Field>
              <Field label="attendees (comma-separated)" span><Input value={attendees} onChange={setAttendees} /></Field>
              <JsonArea label="recurrence (JSON array)" value={recurrence} onChange={setRecurrence} placeholder='["RRULE:FREQ=WEEKLY;BYDAY=MO"]' rows={3} />
              <Field label="visibility">
                <Select value={visibility} onChange={setVisibility} options={[
                  { value: "", label: "Default" },
                  { value: "default", label: "default" },
                  { value: "public", label: "public" },
                  { value: "private", label: "private" },
                  { value: "confidential", label: "confidential" },
                ]} />
              </Field>
              <Field label="transparency">
                <Select value={transparency} onChange={setTransparency} options={[
                  { value: "", label: "Default" },
                  { value: "opaque", label: "opaque" },
                  { value: "transparent", label: "transparent" },
                ]} />
              </Field>
              <Field label="eventType">
                <Select value={eventType} onChange={setEventType} options={[
                  { value: "", label: "Default" },
                  { value: "default", label: "default" },
                  { value: "birthday", label: "birthday" },
                  { value: "focusTime", label: "focusTime" },
                  { value: "outOfOffice", label: "outOfOffice" },
                  { value: "workingLocation", label: "workingLocation" },
                ]} />
              </Field>
              <Field label="send_updates">
                <Select value={sendUpdates} onChange={setSendUpdates} options={[
                  { value: "", label: "Default" },
                  { value: "all", label: "all" },
                  { value: "externalOnly", label: "externalOnly" },
                  { value: "none", label: "none" },
                ]} />
              </Field>
              <BoolSelect label="create_meeting_room" value={createMeetingRoom} onChange={setCreateMeetingRoom} />
              <BoolSelect label="exclude_organizer" value={excludeOrganizer} onChange={setExcludeOrganizer} />
              <BoolSelect label="guestsCanModify" value={guestsCanModify} onChange={setGuestsCanModify} />
              <BoolSelect label="guestsCanInviteOthers" value={guestsCanInvite} onChange={setGuestsCanInvite} />
              <BoolSelect label="guestsCanSeeOtherGuests" value={guestsCanSee} onChange={setGuestsCanSee} />
            </>
          ),
        }}
      </ToolCard>

      {editEvent && (
        <article className="tool-card featured reply-card">
          <h4 className="tool-card-title">Edit: {editEvent.summary}</h4>
          <p className="tool-card-copy">event_id: {editEvent.id}</p>
          <Field label="summary" span><Input value={title} onChange={setTitle} /></Field>
          <Field label="start_time"><Input type="datetime-local" value={start} onChange={setStart} /></Field>
          <Field label="end_time"><Input type="datetime-local" value={patchEndTime} onChange={setPatchEndTime} /></Field>
          <Field label="timezone"><Input value={timezone} onChange={setTimezone} /></Field>
          <Field label="location"><Input value={location} onChange={setLocation} /></Field>
          <Field label="attendees (comma-separated, replaces all)" span><Input value={attendees} onChange={setAttendees} /></Field>
          <Field label="description" span><TextArea value={description} onChange={setDescription} /></Field>
          <JsonArea label="recurrence (JSON array, replaces all)" value={patchRecurrence} onChange={setPatchRecurrence} rows={3} />
          <Field label="status">
            <Select value={patchStatus} onChange={setPatchStatus} options={[
              { value: "", label: "Unchanged" },
              { value: "confirmed", label: "confirmed" },
              { value: "tentative", label: "tentative" },
              { value: "cancelled", label: "cancelled" },
            ]} />
          </Field>
          <Field label="visibility">
            <Select value={visibility} onChange={setVisibility} options={[
              { value: "", label: "Unchanged" },
              { value: "default", label: "default" },
              { value: "public", label: "public" },
              { value: "private", label: "private" },
              { value: "confidential", label: "confidential" },
            ]} />
          </Field>
          <Field label="transparency">
            <Select value={transparency} onChange={setTransparency} options={[
              { value: "", label: "Unchanged" },
              { value: "opaque", label: "opaque" },
              { value: "transparent", label: "transparent" },
            ]} />
          </Field>
          <Field label="send_updates">
            <Select value={patchSendUpdates} onChange={setPatchSendUpdates} options={[
              { value: "all", label: "all" },
              { value: "externalOnly", label: "externalOnly" },
              { value: "none", label: "none" },
            ]} />
          </Field>
          <Field label="rsvp_response">
            <Select value={patchRsvp} onChange={setPatchRsvp} options={[
              { value: "", label: "Unchanged" },
              { value: "needsAction", label: "needsAction" },
              { value: "declined", label: "declined" },
              { value: "tentative", label: "tentative" },
              { value: "accepted", label: "accepted" },
            ]} />
          </Field>
          <JsonArea label="reminders (JSON object)" value={patchReminders} onChange={setPatchReminders} placeholder='{"useDefault": false, "overrides": [{"method": "popup", "minutes": 10}]}' rows={4} />
          <Field label="color_id"><Input value={patchColorId} onChange={setPatchColorId} placeholder="1–11" /></Field>
          <NumberInput label="max_attendees" value={patchMaxAttendees} onChange={setPatchMaxAttendees} />
          <BoolSelect label="guests_can_modify" value={patchGuestsModify} onChange={setPatchGuestsModify} />
          <BoolSelect label="guests_can_invite_others" value={patchGuestsInvite} onChange={setPatchGuestsInvite} />
          <BoolSelect label="guests_can_see_other_guests" value={patchGuestsSee} onChange={setPatchGuestsSee} />
          <div className="tool-card-foot">
            <button type="button" className="btn" onClick={() => setEditEvent(null)}>Cancel</button>
            <button
              type="button"
              className="btn primary"
              disabled={loadingKey === "cal-patch"}
              onClick={() => {
                let reminders;
                let recurrenceArr;
                try {
                  reminders = parseJson(patchReminders, "reminders");
                  recurrenceArr = parseJson(patchRecurrence, "recurrence");
                } catch (e) {
                  return onResult({ error: e.message });
                }
                return exec("cal-patch", () => runTool({
                  toolSlug: "GOOGLECALENDAR_PATCH_EVENT",
                  mode: "custom",
                  args: pickArgs({
                    calendar_id: calendarId,
                    event_id: editEvent.id,
                    summary: title,
                    description,
                    location,
                    start_time: `${start}:00${localOffset()}`,
                    end_time: patchEndTime ? `${patchEndTime}:00${localOffset()}` : undefined,
                    timezone,
                    attendees: attendees ? parseCsv(attendees) : undefined,
                    recurrence: recurrenceArr,
                    status: patchStatus || undefined,
                    visibility: visibility || undefined,
                    transparency: transparency || undefined,
                    send_updates: patchSendUpdates,
                    rsvp_response: patchRsvp || undefined,
                    reminders,
                    color_id: patchColorId,
                    max_attendees: parseIntField(patchMaxAttendees),
                    guests_can_modify: parseBool(patchGuestsModify),
                    guests_can_invite_others: parseBool(patchGuestsInvite),
                    guests_can_see_other_guests: parseBool(patchGuestsSee),
                  }),
                }).then((r) => { setEditEvent(null); return r; }));
              }}
            >Save Changes</button>
          </div>
        </article>
      )}

      <ToolCard
        title="My Calendars"
        description="List calendars you have access to."
        loading={loadingKey === "cal-list"}
        onRun={(mode) => exec("cal-list", () => runTool({
          toolSlug: "GOOGLECALENDAR_LIST_CALENDARS",
          mode,
          args: mode === "custom" ? pickArgs({
            max_results: parseIntField(listCalMax),
            page_token: listCalPageToken,
            show_hidden: parseBool(listCalShowHidden),
            show_deleted: parseBool(listCalShowDeleted),
            min_access_role: listCalMinRole || undefined,
            sync_token: listCalSyncToken,
          }) : {},
        }))}
      >
        {{
          quick: <p className="quick-hint">Lists all accessible calendars.</p>,
          custom: (
            <>
              <NumberInput label="max_results" value={listCalMax} onChange={setListCalMax} />
              <Field label="page_token"><Input value={listCalPageToken} onChange={setListCalPageToken} /></Field>
              <BoolSelect label="show_hidden" value={listCalShowHidden} onChange={setListCalShowHidden} />
              <BoolSelect label="show_deleted" value={listCalShowDeleted} onChange={setListCalShowDeleted} />
              <Field label="min_access_role">
                <Select value={listCalMinRole} onChange={setListCalMinRole} options={[
                  { value: "", label: "Default" },
                  { value: "freeBusyReader", label: "freeBusyReader" },
                  { value: "reader", label: "reader" },
                  { value: "writer", label: "writer" },
                  { value: "owner", label: "owner" },
                ]} />
              </Field>
              <Field label="sync_token"><Input value={listCalSyncToken} onChange={setListCalSyncToken} /></Field>
            </>
          ),
        }}
      </ToolCard>

      {notionConnected && (
        <ToolCard
          featured
          title="Week Ahead → Notion"
          description="Export your upcoming week as a clean Notion agenda page."
          loading={loadingKey === "cal-week"}
          runLabel="Create Report"
          onRun={() => {
            if (!parentId) return onResult({ error: "Select a Notion parent page." });
            return exec("cal-week", () => runWorkflow("calendarWeekAhead", { parentId, timezone }));
          }}
        >
          {{
            quick: <NotionParentPicker value={parentId} onChange={setParentId} pages={notionPages} onRefresh={() => searchNotionPages("").then(setNotionPages)} />,
            custom: (
              <>
                <Field label="timezone"><Input value={timezone} onChange={setTimezone} /></Field>
                <NotionParentPicker value={parentId} onChange={setParentId} pages={notionPages} onRefresh={() => searchNotionPages("").then(setNotionPages)} />
              </>
            ),
          }}
        </ToolCard>
      )}
    </div>
  );
}
