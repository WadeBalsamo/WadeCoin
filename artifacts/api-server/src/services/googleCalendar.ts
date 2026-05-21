import { google } from "googleapis";
import { logger } from "../lib/logger";

export interface BusyInterval {
  start: string;
  end: string;
}

export interface Slot {
  id: string;
  start_utc: string;
  end_utc: string;
  date: string;
}

function getWorkingHours(): { start: number; end: number } {
  return {
    start: parseInt(process.env["WORKING_HOURS_START_UTC"] ?? "9", 10),
    end: parseInt(process.env["WORKING_HOURS_END_UTC"] ?? "18", 10),
  };
}

export async function getFreeBusy(
  startDate: string,
  endDate: string,
): Promise<BusyInterval[]> {
  const calendarId = process.env["GOOGLE_CALENDAR_ID"];
  const serviceAccountKeyRaw = process.env["GOOGLE_SERVICE_ACCOUNT_KEY"];

  if (!calendarId || !serviceAccountKeyRaw) {
    // Throw rather than silently returning empty, which would make all slots
    // appear available. Callers must handle this as a misconfiguration error.
    const err = new Error(
      "Google Calendar is not configured: GOOGLE_CALENDAR_ID and GOOGLE_SERVICE_ACCOUNT_KEY are required",
    );
    (err as NodeJS.ErrnoException).code = "calendar_unconfigured";
    throw err;
  }

  let serviceAccountKey: object;
  try {
    serviceAccountKey = JSON.parse(serviceAccountKeyRaw);
  } catch {
    const err = new Error(
      "GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON",
    );
    (err as NodeJS.ErrnoException).code = "calendar_unconfigured";
    throw err;
  }

  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccountKey,
    scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
  });

  const calendar = google.calendar({ version: "v3", auth });

  const startTime = new Date(`${startDate}T00:00:00Z`);
  const endTime = new Date(`${endDate}T23:59:59Z`);

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: startTime.toISOString(),
      timeMax: endTime.toISOString(),
      items: [{ id: calendarId }],
    },
  });

  const calendars = response.data.calendars;
  if (!calendars || !calendars[calendarId]) {
    logger.warn({ calendarId }, "No freebusy data returned for calendar");
    return [];
  }

  const busy = calendars[calendarId].busy ?? [];
  return busy
    .filter((b) => b.start != null && b.end != null)
    .map((b) => ({ start: b.start!, end: b.end! }));
}

function computeDailySlotsFromBusy(
  dateStr: string,
  busyIntervals: BusyInterval[],
  slotDurationMinutes: number,
): Slot[] {
  const { start: workStart, end: workEnd } = getWorkingHours();
  const slots: Slot[] = [];

  const dayStart = new Date(
    `${dateStr}T${String(workStart).padStart(2, "0")}:00:00Z`,
  );
  const dayEnd = new Date(
    `${dateStr}T${String(workEnd).padStart(2, "0")}:00:00Z`,
  );
  const slotMs = slotDurationMinutes * 60 * 1000;

  const busyParsed = busyIntervals.map((b) => ({
    start: new Date(b.start).getTime(),
    end: new Date(b.end).getTime(),
  }));

  let cursor = dayStart.getTime();

  while (cursor + slotMs <= dayEnd.getTime()) {
    const slotEnd = cursor + slotMs;

    const overlaps = busyParsed.some(
      (busy) => cursor < busy.end && slotEnd > busy.start,
    );

    if (!overlaps) {
      const startIso = new Date(cursor).toISOString();
      const endIso = new Date(slotEnd).toISOString();
      slots.push({
        id: `slot_${cursor}`,
        start_utc: startIso,
        end_utc: endIso,
        date: dateStr,
      });
    }

    cursor += slotMs;
  }

  return slots;
}

export async function getAvailableSlots(
  startDate: string,
  endDate: string,
  slotDurationMinutes: number,
  excludedDates?: Set<string>,
): Promise<Slot[]> {
  const busy = await getFreeBusy(startDate, endDate);

  const slots: Slot[] = [];
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T23:59:59Z`);

  const cursor = new Date(start);
  while (cursor <= end) {
    const dateStr = cursor.toISOString().slice(0, 10);

    if (!excludedDates?.has(dateStr)) {
      const dayBusy = busy.filter(
        (b) =>
          b.start.startsWith(dateStr) ||
          b.end.startsWith(dateStr) ||
          (b.start < `${dateStr}T` && b.end > `${dateStr}T`),
      );
      const daySlots = computeDailySlotsFromBusy(
        dateStr,
        dayBusy,
        slotDurationMinutes,
      );
      slots.push(...daySlots);
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return slots;
}
