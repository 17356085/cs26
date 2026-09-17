const TERM_START = "2026-09-07";
const TERM_END = "2027-01-03";
const BJT_TIME_ZONE = "Asia/Shanghai";
const TRACK_SOURCE_URL = "./assets/spa-francorchamps-track-outline.svg";
const TRACK_LAP_MS = 52000;
const TRACK_TIME_SCALE = 2.75;
const TRACK_SECTOR_SPLITS = [0.32, 0.67, 1];
const DAY_NAMES = ["", "周一", "周二", "周三", "周四", "周五", "周六", "周日"];
const DAY_CODES = ["", "MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const OFFICIAL_ADJUSTMENTS = globalThis.COURSE_SCHEDULE_OFFICIAL_ADJUSTMENTS || [];
const OFFICIAL_HOLIDAYS = globalThis.COURSE_SCHEDULE_OFFICIAL_HOLIDAYS || [];

const TIME_SLOTS = [
  { period: "1–2", time: "08:00\n09:30", sessionCode: "S1", sessionStart: true },
  { period: "3", time: "09:45\n10:25", sessionCode: "S1" },
  { period: "4–5", time: "10:35\n12:00", sessionCode: "S1" },
  { period: "6–7", time: "12:50\n14:20", sessionCode: "S1" },
  { period: "8–9", time: "14:30\n15:55", sessionCode: "S2", sessionStart: true },
  { period: "10–11", time: "16:10\n17:35", sessionCode: "S2" },
  { period: "12–13", time: "18:45\n20:10", sessionCode: "S3", sessionStart: true },
  { period: "14–15", time: "20:15\n21:45", sessionCode: "S3" }
];

// Keep the live track marker aligned with the visual timetable rows.
// These values mirror --period-rows in styles.css and the PDF timetable's
// actual teaching intervals, including the short gaps between classes.
const SCHEDULE_ROW_HEIGHTS = [104, 54, 110, 54, 110, 102, 112, 112];
const SCHEDULE_TIME_RANGES = [
  [480, 570], [585, 625], [635, 720], [770, 860],
  [870, 965], [970, 1075], [1125, 1210], [1215, 1305]
];

const parseDate = (iso) => new Date(`${iso}T00:00:00`);
const toIso = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const addDays = (date, count) => {
  const next = new Date(date);
  next.setDate(next.getDate() + count);
  return next;
};
const getBjtParts = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BJT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  return Object.fromEntries(parts.filter(({ type }) => type !== "literal").map(({ type, value }) => [type, value]));
};
const getBjtDateIso = (date = new Date()) => {
  const parts = getBjtParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
};
const formatBjtClock = (date = new Date()) => {
  const parts = getBjtParts(date);
  return `${parts.year}.${parts.month}.${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
};
const formatMonthDay = (date) => `${date.getMonth() + 1}月${date.getDate()}日`;
const formatShortDate = (iso) => {
  const date = parseDate(iso);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};
const formatDateLong = (iso) => parseDate(iso).toLocaleDateString("zh-CN", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "short"
});

const lesson = (id, title, time, room, type = "lecture", row = 1, span = 1) => ({
  id,
  title,
  time,
  room,
  type,
  row,
  span
});

// Evening classes are identified by their actual start time in the PDF.
// Keep the semantic lesson type for filtering, but render every 18:45 class
// with the evening-course treatment.
const isNightLesson = (item) => item.time.startsWith("18:45") || item.type === "night";

// The PDF timetable is the only course source. Week-specific additions and
// removals below reproduce its weekday columns and printed week ranges.
const LESSONS = {
  media: lesson("media", "新媒体运营与推广", "10:35–12:00", "2实107", "lecture", 3),
  image: lesson("image", "数字图像处理及应用", "18:45–20:10", "2实307", "lecture", 7),
  android: lesson("android", "Android应用开发", "08:00–09:30", "2实403", "lecture", 1),
  network: lesson("network", "计算机网络", "14:30–15:55", "4-205", "lecture", 5),
  networkLab: lesson("networkLab", "计算机网络实训", "09:45–12:00", "1实305", "practice", 2, 2),
  networkLabShort: lesson("networkLabShort", "计算机网络实训", "09:45–11:15", "1实305", "practice", 2, 2),
  software: lesson("software", "软件工程", "08:00–09:30", "4-305", "lecture", 1),
  softwareDesign: lesson("softwareDesign", "软件工程课程设计", "10:35–12:00", "2实405", "practice", 3),
  security: lesson("security", "信息安全技术", "18:45–20:10", "2实107", "lecture", 7),
  organization: lesson("organization", "计算机组成原理", "10:35–12:00", "4-405", "lecture", 3),
  organizationDesign: lesson("organizationDesign", "计算机组成原理课程设计", "14:30–15:55", "1实102", "practice", 5),
  china: lesson("china", "新中国史", "14:30–15:55", "6-403", "lecture", 5),
  programming: lesson("programming", "程序设计实训", "18:45–20:55", "2实307", "practice", 7, 2),
  programmingShort: lesson("programmingShort", "程序设计实训", "18:45–19:25", "2实307", "practice", 7),
  web: lesson("web", "Web编程技术", "08:00–09:30", "2实105", "lecture", 1),
  operatingSystem: lesson("operatingSystem", "操作系统原理", "10:35–12:00", "3-303", "lecture", 3),
  bigData: lesson("bigData", "大数据与云计算", "16:10–17:35", "2实403", "lecture", 6),
  operatingSystemDesign: lesson("operatingSystemDesign", "操作系统课程设计", "18:45–20:10", "2实405", "practice", 7),
  bigDataNight: lesson("bigDataNight", "大数据与云计算", "18:45–20:10", "2实405", "night", 7),
  mediaNight: lesson("mediaNight", "新媒体运营与推广", "20:15–21:45", "2实107", "night", 8),
  webNight: lesson("webNight", "Web编程技术", "18:45–20:10", "2实105", "night", 7),
  securityNight: lesson("securityNight", "信息安全技术", "20:15–21:45", "2实107", "night", 8),
  imageNight: lesson("imageNight", "数字图像处理及应用", "18:45–20:10", "2实305", "night", 7),
  operatingSystemNight: lesson("operatingSystemNight", "操作系统原理", "20:15–21:45", "3-303", "night", 8),
  networkNight: lesson("networkNight", "计算机网络", "18:45–20:10", "4-205", "night", 7),
  softwareNight: lesson("softwareNight", "软件工程", "20:15–21:45", "4-305", "night", 8),
  organizationNight: lesson("organizationNight", "计算机组成原理", "18:45–20:10", "4-405", "night", 7),
  androidNight: lesson("androidNight", "Android应用开发", "20:15–21:45", "2实403", "night", 8)
};

const BASE_DAY_IDS = {
  1: ["media", "image"],
  2: ["android", "network"],
  3: ["software", "security"],
  4: ["organization", "china", "programming"],
  5: ["web", "operatingSystem", "bigData"]
};

const cloneLesson = (id) => ({ ...LESSONS[id] });
const timeToMinutes = (time) => {
  const match = time.match(/(\d{2}):(\d{2})/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : 0;
};

function makeWeek(config = {}) {
  const days = {};
  for (let day = 1; day <= 5; day += 1) {
    let ids = [...(BASE_DAY_IDS[day] || [])];
    const removes = new Set(config.remove?.[day] || []);
    ids = ids.filter((id) => !removes.has(id));
    ids.push(...(config.add?.[day] || []));
    const custom = (config.custom?.[day] || []).map((item) => ({ ...item }));
    days[day] = [...ids.map(cloneLesson), ...custom]
      .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  }
  for (const [day, ids] of Object.entries(config.extra || {})) {
    days[day] = [...(days[day] || []), ...ids.map(cloneLesson)]
      .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  }
  return { days };
}

const WEEKS = [
  makeWeek(),
  makeWeek(),
  makeWeek(),
  makeWeek({ add: { 2: ["networkLab"] } }),
  makeWeek({ add: { 3: ["softwareDesign"] } }),
  makeWeek({ add: { 2: ["networkLab"], 3: ["softwareDesign"] } }),
  makeWeek({ add: { 1: ["organizationDesign"], 2: ["operatingSystemDesign"], 3: ["softwareDesign"] } }),
  makeWeek({ add: { 1: ["organizationDesign"], 2: ["networkLab", "operatingSystemDesign"], 3: ["softwareDesign"] } }),
  makeWeek({ add: { 1: ["organizationDesign"], 2: ["operatingSystemDesign"], 3: ["softwareDesign"] }, extra: { 5: ["bigDataNight", "mediaNight"] } }),
  makeWeek({ remove: { 4: ["china"] }, add: { 1: ["organizationDesign"], 2: ["networkLab", "operatingSystemDesign"], 3: ["softwareDesign"] }, extra: { 5: ["imageNight", "operatingSystemNight"] } }),
  makeWeek({ remove: { 4: ["china"] }, add: { 1: ["organizationDesign"], 2: ["operatingSystemDesign"], 3: ["softwareDesign"] }, extra: { 5: ["networkNight", "softwareNight"] } }),
  makeWeek({ remove: { 4: ["china"] }, add: { 1: ["organizationDesign"], 2: ["networkLab", "operatingSystemDesign"], 3: ["softwareDesign"] }, extra: { 5: ["webNight", "securityNight"] } }),
  makeWeek({ remove: { 4: ["china"] }, add: { 1: ["organizationDesign"], 2: ["operatingSystemDesign"] }, extra: { 5: ["organizationNight", "androidNight"] } }),
  makeWeek({ remove: { 4: ["china", "programming"] }, add: { 1: ["organizationDesign"], 2: ["networkLab", "operatingSystemDesign"], 3: ["softwareDesign"] }, extra: { 4: ["programmingShort"], 5: ["imageNight", "operatingSystemNight"] } }),
  makeWeek({ remove: { 4: ["china", "programming"] }, add: { 1: ["organizationDesign"], 2: ["operatingSystemDesign"] }, extra: { 5: ["networkNight", "softwareNight"] } }),
  makeWeek({ remove: { 4: ["china", "programming"] }, add: { 1: ["organizationDesign"], 2: ["operatingSystemDesign"] }, custom: { 2: [LESSONS.networkLabShort] } }),
  makeWeek({ remove: { 4: ["china", "programming"] } })
];

const termStartDate = parseDate(TERM_START);
const termEndDate = parseDate(TERM_END);
const getWeekStart = (week) => addDays(termStartDate, (week - 1) * 7);
const getWeekNumber = (date) => {
  const diff = Math.floor((date - termStartDate) / 86400000);
  return Math.floor(diff / 7) + 1;
};
const isInTerm = (iso) => {
  const date = parseDate(iso);
  return date >= termStartDate && date <= termEndDate;
};
const getTodayIso = () => getBjtDateIso(new Date());
let todayIso = getTodayIso();

let currentWeek = getWeekNumber(parseDate(todayIso));
if (currentWeek < 1 || currentWeek > WEEKS.length) currentWeek = 1;

const CALENDAR_MONTHS = [
  { year: 2026, month: 8 },
  { year: 2026, month: 9 },
  { year: 2026, month: 10 },
  { year: 2026, month: 11 },
  { year: 2027, month: 0 }
];
const getCalendarMonthIndex = (date) => CALENDAR_MONTHS.findIndex(({ year, month }) => date.getFullYear() === year && date.getMonth() === month);
let calendarMonthIndex = Math.max(0, getCalendarMonthIndex(getWeekStart(currentWeek)));

const $ = (selector) => document.querySelector(selector);
const calendarButton = $("#calendarButton");
const calendarButtonLabel = $("#calendarButtonLabel");
const weekCalendar = $("#weekCalendar");
const calendarGrid = $("#calendarGrid");
const calendarMonthLabel = $("#calendarMonthLabel");
const calendarMonthPrev = $("#calendarMonthPrev");
const calendarMonthNext = $("#calendarMonthNext");
const weekTitle = $("#weekTitle");
const weekRange = $("#weekRange");
const weekdayRow = $("#weekdayRow");
const timeRail = $("#timeRail");
const scheduleGrid = $("#scheduleGrid");
const mobileDayList = $("#mobileDayList");
const weekOverview = $("#weekOverview");
const lessonDialog = $("#lessonDialog");
const dialogContent = $("#dialogContent");
let lessonDialogAnchor = null;
const phaseStrip = $("#phaseStrip");
const weekViewButton = $("#weekViewButton");
const dayViewButton = $("#dayViewButton");
const liveClock = $("#liveClock");
const trackTelemetry = $("#trackTelemetry");
const trackTelemetryGeometry = $("#trackTelemetryGeometry");
const trackTelemetryMarkerLayer = $("#trackTelemetryMarkerLayer");
const trackMarker = $("#trackMarker");
const trackMarkerGlow = $("#trackMarkerGlow");
const telemetryToast = $("#telemetryToast");
const telemetryToastKicker = $("#telemetryToastKicker");
const telemetryToastValue = $("#telemetryToastValue");
const telemetryToastStatus = $("#telemetryToastStatus");
const telemetryAnnouncement = $("#telemetryAnnouncement");
let telemetryToastTimer = 0;

const savedViewMode = (() => {
  try {
    const value = globalThis.localStorage?.getItem("course-schedule-view");
    return value === "day" || value === "week" ? value : null;
  } catch {
    return null;
  }
})();
const isCompactViewport = Boolean(globalThis.matchMedia?.("(max-width: 760px)")?.matches);
let viewMode = savedViewMode || (isCompactViewport ? "day" : "week");
let selectedDate = isInTerm(todayIso) ? todayIso : toIso(getWeekStart(currentWeek));
let lastLiveMinute = "";

function getOfficialAdjustment(iso) {
  return getEffectiveAdjustments().find((item) => item.actualDate === iso) || null;
}

function getAdjustmentPriority(item) {
  if (Number.isFinite(item.priority)) return item.priority;
  return { national: 10, academic: 20, school: 30 }[item.sourceType] || 0;
}

function getEffectiveAdjustments() {
  const byActualDate = new Map();
  for (const item of OFFICIAL_ADJUSTMENTS) {
    const current = byActualDate.get(item.actualDate);
    if (!current || getAdjustmentPriority(item) > getAdjustmentPriority(current)) {
      byActualDate.set(item.actualDate, item);
    }
  }
  return [...byActualDate.values()].sort((a, b) => a.actualDate.localeCompare(b.actualDate));
}

function getHolidayPriority(item) {
  if (Number.isFinite(item.priority)) return item.priority;
  return { national: 10, academic: 20, school: 30 }[item.sourceType] || 0;
}

function getEffectiveHolidays() {
  return [...OFFICIAL_HOLIDAYS].sort((a, b) => {
    const dateOrder = a.startDate.localeCompare(b.startDate);
    return dateOrder || getHolidayPriority(b) - getHolidayPriority(a);
  });
}

function getOfficialHoliday(iso) {
  return getEffectiveHolidays()
    .filter((item) => item.startDate <= iso && iso <= item.endDate)
    .sort((a, b) => getHolidayPriority(b) - getHolidayPriority(a))[0] || null;
}

function getVisibleLessons(state) {
  return state.lessons;
}

function setViewMode(mode) {
  viewMode = mode;
  try { globalThis.localStorage?.setItem("course-schedule-view", mode); } catch { /* private browsing */ }
  document.body?.classList?.toggle("view-week", viewMode === "week");
  document.body?.classList?.toggle("view-day", viewMode === "day");
  weekViewButton?.setAttribute?.("aria-pressed", String(viewMode === "week"));
  dayViewButton?.setAttribute?.("aria-pressed", String(viewMode === "day"));
  weekViewButton?.classList?.toggle?.("is-active", viewMode === "week");
  dayViewButton?.classList?.toggle?.("is-active", viewMode === "day");
  $("#scheduleTitle").textContent = viewMode === "day" ? "每日课程" : "一周课程";
}

function getDayState(date) {
  const iso = toIso(date);
  const naturalDay = date.getDay() === 0 ? 7 : date.getDay();
  const adjustment = getOfficialAdjustment(iso);
  // An explicit make-up class takes precedence over a holiday record for the
  // same actual date. This is how a school/academic notice can override the
  // national baseline without changing the PDF-derived course data.
  const holiday = adjustment ? null : getOfficialHoliday(iso);
  const sourceIso = adjustment?.sourceDate || iso;
  const sourceDate = parseDate(sourceIso);
  const sourceDay = sourceDate.getDay() === 0 ? 7 : sourceDate.getDay();
  const week = getWeekNumber(date);
  const sourceWeek = getWeekNumber(sourceDate);
  const lessons = !holiday && isInTerm(iso) && isInTerm(sourceIso) && sourceWeek >= 1 && sourceWeek <= WEEKS.length && sourceDay <= 5
    ? WEEKS[sourceWeek - 1].days[sourceDay] || []
    : [];
  return { iso, naturalDay, sourceDay, sourceIso, week, sourceWeek, adjustment, holiday, lessons };
}

function getWeekStates(week = currentWeek) {
  const start = getWeekStart(week);
  return Array.from({ length: 7 }, (_, index) => getDayState(addDays(start, index)));
}

function getWorkdayStates(states) {
  return states.filter((state) => !state.adjustment && !state.holiday && state.naturalDay <= 5 && isInTerm(state.iso));
}

function getPeriodLabel(item) {
  if (isNightLesson(item)) return "晚课";
  if (item.type === "practice") return "实训";
  return "";
}

function getLessonSession(item) {
  const start = timeToMinutes(item.time);
  if (start >= 18 * 60) return { code: "S3" };
  if (start >= 14 * 60) return { code: "S2" };
  return { code: "S1" };
}

function getDayPhase(state, weekStates = null) {
  if (state.adjustment) return { key: "adjusted", code: "ADJ", en: "ADJUSTED" };
  if (state.holiday) return { key: "pit", code: "PIT", en: "PIT" };
  const peers = weekStates || getWeekStates(state.week);
  const workdays = getWorkdayStates(peers);
  const isWorkday = workdays.some((day) => day.iso === state.iso);
  if (!isWorkday || state.naturalDay > 5) return { key: "pit", code: "PIT", en: "PIT" };
  if (workdays[0]?.iso === state.iso) return { key: "formation", code: "FORM", en: "FORMATION LAP" };
  if (workdays[workdays.length - 1]?.iso === state.iso) return { key: "flying", code: "FLY", en: "FLYING LAP" };
  return { key: "stint", code: "STINT", en: "RACE STINT" };
}

function getPhaseRuns(states) {
  const runs = [];
  states.forEach((state) => {
    const phase = getDayPhase(state, states);
    const last = runs[runs.length - 1];
    if (last?.phase.key === phase.key) {
      last.states.push(state);
    } else {
      runs.push({ phase, states: [state] });
    }
  });
  return runs;
}

function getPhaseRange(states) {
  const first = states[0];
  const last = states[states.length - 1];
  if (!first || !last) return "";
  return first.iso === last.iso ? DAY_CODES[first.naturalDay] : `${DAY_CODES[first.naturalDay]}–${DAY_CODES[last.naturalDay]}`;
}

function renderPhaseStrip(states) {
  if (!phaseStrip) return;
  const todayState = states.find((state) => state.iso === todayIso);
  const focusState = todayState || getWorkdayStates(states)[0] || states.find((state) => state.adjustment) || states[0];
  const currentPhase = focusState ? getDayPhase(focusState, states) : null;
  const runs = getPhaseRuns(states);
  phaseStrip.innerHTML = runs.map(({ phase, states: runStates }) => {
    const active = Boolean(focusState && runStates.some((state) => state.iso === focusState.iso));
    const adjustedClass = phase.key === "adjusted" ? " is-adjusted" : "";
    return `<span class="phase-segment ${phase.key}${active ? " is-current" : ""}${adjustedClass}" data-phase-key="${phase.key}"><b>${getPhaseRange(runStates)}</b><span>${phase.en}</span></span>`;
  }).join("");
  phaseStrip.dataset.activePhase = currentPhase?.code || "";
  phaseStrip.setAttribute("aria-label", currentPhase ? `本周节奏，当前 ${currentPhase.en}` : "一周节奏");
}

// The live card always follows Beijing time, independently of the browsed week.
function getUpcomingLesson(fromIso = todayIso, nowMinutes = 0) {
  const startIso = fromIso < TERM_START ? TERM_START : fromIso;
  for (let date = parseDate(startIso); toIso(date) <= TERM_END; date = addDays(date, 1)) {
    const state = getDayState(date);
    const item = state.lessons.find((entry) => state.iso > fromIso || timeToMinutes(entry.time.split("–")[1]) > nowMinutes);
    if (item) return { state, item };
  }
  return null;
}

function getLessonStatus(item, state, now = new Date()) {
  const parts = getBjtParts(now);
  const iso = `${parts.year}-${parts.month}-${parts.day}`;
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  if (state.iso < iso) return "ended";
  if (state.iso > iso) return "upcoming";
  const start = timeToMinutes(item.time);
  const end = timeToMinutes(item.time.split("–")[1]);
  return minutes >= end ? "ended" : minutes >= start ? "live" : "upcoming";
}

function renderLiveLesson(now = new Date()) {
  const parts = getBjtParts(now);
  const iso = `${parts.year}-${parts.month}-${parts.day}`;
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  const next = getUpcomingLesson(iso, minutes);
  const button = $("#nextLessonButton");
  button.disabled = !next;
  button.classList.toggle("is-live", Boolean(next && getLessonStatus(next.item, next.state, now) === "live"));
  if (!next) {
    $("#nextLessonLabel").textContent = "课程状态";
    $("#nextLesson").textContent = "本学期课程已结束";
    $("#nextLessonStatus").textContent = "";
    $("#nextLessonMeta").textContent = "仍可切换周次回看课表";
    delete button.dataset.lessonId;
    delete button.dataset.date;
    return;
  }
  const { item, state } = next;
  const live = getLessonStatus(item, state, now) === "live";
  const dayDifference = Math.round((parseDate(state.iso) - parseDate(iso)) / 86400000);
  const dayLabel = dayDifference === 0 ? "今天" : dayDifference === 1 ? "明天" : `${formatShortDate(state.iso)} ${DAY_NAMES[state.naturalDay]}`;
  const remaining = (live ? timeToMinutes(item.time.split("–")[1]) : timeToMinutes(item.time)) - minutes;
  $("#nextLessonLabel").textContent = live ? "正在上课" : "下一节课";
  $("#nextLesson").textContent = item.title;
  $("#nextLessonStatus").textContent = live ? `${remaining} 分钟后下课` : dayDifference === 0
    ? (remaining < 60 ? `${remaining} 分钟后` : `${Math.floor(remaining / 60)} 小时${remaining % 60 ? ` ${remaining % 60} 分钟` : ""}后`)
    : dayDifference === 1 ? "明天" : `${dayDifference} 天后`;
  $("#nextLessonMeta").textContent = `${dayLabel} · ${item.time} · ${item.room}${state.adjustment ? " · 调休" : ""}`;
  button.dataset.lessonId = item.id;
  button.dataset.date = state.iso;
  button.setAttribute("aria-label", `${live ? "正在上课" : "下一节课"}：${item.title}，${dayLabel} ${item.time}，教室 ${item.room}，查看详情`);
}

const trackTelemetryState = {
  ready: false,
  running: true,
  inView: true,
  reducedMotion: Boolean(globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches),
  lap: 0,
  lapStartedAt: 0,
  lastProgress: 0,
  frameRequested: false,
  nextSector: 0,
  paths: [],
  pathLengths: [],
  totalLength: 0,
  currentLap: null,
  personalSectorBest: [37.2, 61.1, 45.7],
  sessionSectorBest: [36.8, 60.7, 45.3],
  personalLapBest: 143.8,
  sessionLapBest: 142.9
};

const telemetryNow = () => globalThis.performance?.now?.() ?? Date.now();
const randomBetween = (min, max) => min + Math.random() * (max - min);
const formatSectorTime = (seconds) => `${seconds.toFixed(3)}s`;
const formatLapTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainder = (seconds - minutes * 60).toFixed(3).padStart(6, "0");
  return `${minutes}:${remainder}`;
};

function announceTelemetry(message) {
  if (telemetryAnnouncement) telemetryAnnouncement.textContent = message;
}

function showTelemetryToast(kicker, value, status, duration = 1500) {
  if (!telemetryToast || !telemetryToastKicker || !telemetryToastValue || !telemetryToastStatus) return;
  window.clearTimeout(telemetryToastTimer);
  telemetryToast.classList.remove("is-purple", "is-green", "is-yellow", "is-visible");
  telemetryToastKicker.textContent = kicker;
  telemetryToastValue.textContent = value;
  telemetryToastStatus.textContent = status.toUpperCase();
  telemetryToast.classList.add(`is-${status}`);
  telemetryToast.hidden = false;
  requestAnimationFrame(() => telemetryToast.classList.add("is-visible"));
  telemetryToastTimer = window.setTimeout(() => {
    telemetryToast.classList.remove("is-visible");
    window.setTimeout(() => {
      if (!telemetryToast.classList.contains("is-visible")) telemetryToast.hidden = true;
    }, 180);
  }, duration);
}

function createTelemetryLap() {
  // The display is accelerated, but the recorded result still behaves like a
  // qualifying lap: sectors are registered at timing loops and the lap result
  // is only known when the car crosses the line again.
  const pace = Math.random() < .14 ? -1.2 : Math.random() < .52 ? -.1 : .3;
  const bases = [36.8, 60.6, 45.1];
  const spread = [.45, .65, .5];
  const sectorTimes = bases.map((base, index) => Math.max(0.1, base + pace + randomBetween(-spread[index], spread[index])));
  const lapTime = sectorTimes.reduce((sum, value) => sum + value, 0);
  return { sectorTimes, lapTime, durationMs: lapTime * 1000 / TRACK_TIME_SCALE };
}

function beginTelemetryLap(startAt = telemetryNow(), preserveDisplay = false) {
  trackTelemetryState.lap += 1;
  trackTelemetryState.lapStartedAt = startAt;
  trackTelemetryState.lastProgress = 0;
  trackTelemetryState.nextSector = 0;
  trackTelemetryState.currentLap = createTelemetryLap();
}

function classifySectorTime(seconds, index) {
  if (seconds < trackTelemetryState.sessionSectorBest[index]) {
    trackTelemetryState.sessionSectorBest[index] = seconds;
    trackTelemetryState.personalSectorBest[index] = Math.min(trackTelemetryState.personalSectorBest[index], seconds);
    return "purple";
  }
  if (seconds < trackTelemetryState.personalSectorBest[index]) {
    trackTelemetryState.personalSectorBest[index] = seconds;
    return "green";
  }
  return "yellow";
}

function completeTelemetrySector(index) {
  const seconds = trackTelemetryState.currentLap?.sectorTimes?.[index];
  if (!Number.isFinite(seconds)) return;
  const status = classifySectorTime(seconds, index);
  showTelemetryToast(`S${index + 1}`, formatSectorTime(seconds), status);
  announceTelemetry(`S${index + 1} ${formatSectorTime(seconds)}，${status}`);
}

function finishTelemetryLap() {
  const lapTime = trackTelemetryState.currentLap?.lapTime;
  if (!Number.isFinite(lapTime)) return;
  let status = "yellow";
  if (lapTime < trackTelemetryState.sessionLapBest) {
    trackTelemetryState.sessionLapBest = lapTime;
    trackTelemetryState.personalLapBest = lapTime;
    status = "purple";
  } else if (lapTime < trackTelemetryState.personalLapBest) {
    trackTelemetryState.personalLapBest = lapTime;
    status = "green";
  }
  showTelemetryToast("LAP", formatLapTime(lapTime), status, 2200);
  announceTelemetry(`完成第${trackTelemetryState.lap}圈，${formatLapTime(lapTime)}，${status}`);
}

function updateTrackMarker(progress) {
  if (!trackTelemetryState.paths.length || !trackMarker || !trackMarkerGlow) return;
  try {
    let distance = trackTelemetryState.totalLength * Math.min(Math.max(progress, 0), 1);
    let point = null;
    for (let index = 0; index < trackTelemetryState.paths.length; index += 1) {
      const path = trackTelemetryState.paths[index];
      const length = trackTelemetryState.pathLengths[index] || 0;
      if (distance <= length || index === trackTelemetryState.paths.length - 1) {
        point = path.getPointAtLength(Math.min(distance, length));
        break;
      }
      distance -= length;
    }
    if (!point) return;
    trackMarker.setAttribute("cx", point.x.toFixed(2));
    trackMarker.setAttribute("cy", point.y.toFixed(2));
    trackMarkerGlow.setAttribute("cx", point.x.toFixed(2));
    trackMarkerGlow.setAttribute("cy", point.y.toFixed(2));
  } catch {
    trackTelemetryState.running = false;
  }
}

function scheduleTrackAnimation() {
  if (document.hidden || !trackTelemetryState.inView || !trackTelemetryState.running || trackTelemetryState.frameRequested || typeof globalThis.requestAnimationFrame !== "function") return;
  trackTelemetryState.frameRequested = true;
  globalThis.requestAnimationFrame((timestamp) => {
    trackTelemetryState.frameRequested = false;
    animateTrack(timestamp);
  });
}

function animateTrack(timestamp) {
  if (trackTelemetryState.ready && trackTelemetryState.running) {
    let lapDuration = trackTelemetryState.currentLap?.durationMs || TRACK_LAP_MS;
    while (timestamp - trackTelemetryState.lapStartedAt >= lapDuration) {
      while (trackTelemetryState.nextSector < 3) {
        completeTelemetrySector(trackTelemetryState.nextSector);
        trackTelemetryState.nextSector += 1;
      }
      finishTelemetryLap();
      beginTelemetryLap(trackTelemetryState.lapStartedAt + lapDuration, true);
      lapDuration = trackTelemetryState.currentLap?.durationMs || TRACK_LAP_MS;
    }
    const progress = Math.min((timestamp - trackTelemetryState.lapStartedAt) / lapDuration, .999);
    while (trackTelemetryState.nextSector < 3 && progress >= TRACK_SECTOR_SPLITS[trackTelemetryState.nextSector]) {
      completeTelemetrySector(trackTelemetryState.nextSector);
      trackTelemetryState.nextSector += 1;
    }
    updateTrackMarker(progress);
    trackTelemetryState.lastProgress = progress;
  }
  scheduleTrackAnimation();
}

async function setupTrackTelemetry() {
  if (!trackTelemetry || !trackTelemetryGeometry || typeof fetch !== "function" || typeof DOMParser === "undefined") return;
  try {
    const response = await fetch(TRACK_SOURCE_URL, { cache: "force-cache" });
    if (!response.ok) throw new Error(`track asset ${response.status}`);
    const source = await response.text();
    const sourceDocument = new DOMParser().parseFromString(source, "image/svg+xml");
    const sourcePaths = [...sourceDocument.querySelectorAll('g[stroke="#76e2d3"] path')];
    const sourceTrackGroup = sourceDocument.querySelector('g[stroke="#76e2d3"]');
    const sourceLayer = sourceDocument.querySelector("#layer1");
    if (!sourcePaths.length) throw new Error("track path unavailable");
    const paths = sourcePaths.map((sourcePath) => {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", sourcePath.getAttribute("d"));
      path.setAttribute("vector-effect", "non-scaling-stroke");
      return path;
    });
    trackTelemetryGeometry.replaceChildren(...paths);
    const layerTransform = sourceTrackGroup?.getAttribute("transform") || sourceLayer?.getAttribute("transform");
    if (layerTransform) {
      trackTelemetryGeometry.setAttribute("transform", layerTransform);
      trackTelemetryMarkerLayer?.setAttribute("transform", layerTransform);
    }
    trackTelemetryState.paths = paths;
    trackTelemetryState.pathLengths = paths.map((path) => path.getTotalLength());
    trackTelemetryState.totalLength = trackTelemetryState.pathLengths.reduce((sum, length) => sum + length, 0);
    trackTelemetryState.ready = trackTelemetryState.totalLength > 0;
    trackTelemetry.classList.toggle("is-ready", trackTelemetryState.ready);
    if (!trackTelemetryState.ready) return;
    beginTelemetryLap();
    updateTrackMarker(0);
    if (trackTelemetryState.reducedMotion) {
      trackTelemetryState.running = false;
      return;
    }
    scheduleTrackAnimation();
  } catch {
    trackTelemetry.classList.add("is-unavailable");
  }
}

function updateLiveClock() {
  const now = new Date();
  const nowParts = getBjtParts(now);
  if (liveClock) {
    liveClock.textContent = `${nowParts.month}.${nowParts.day} ${nowParts.hour}:${nowParts.minute} 北京时间`;
    liveClock.dateTime = `${nowParts.year}-${nowParts.month}-${nowParts.day}T${nowParts.hour}:${nowParts.minute}:${nowParts.second}+08:00`;
  }
  const nextTodayIso = getBjtDateIso(now);
  const minuteKey = `${nextTodayIso} ${nowParts.hour}:${nowParts.minute}`;
  if (minuteKey === lastLiveMinute) return;
  lastLiveMinute = minuteKey;
  if (nextTodayIso !== todayIso) {
    const wasFollowingToday = selectedDate === todayIso;
    todayIso = nextTodayIso;
    if (wasFollowingToday && isInTerm(todayIso)) {
      selectedDate = todayIso;
      currentWeek = getWeekNumber(parseDate(todayIso));
      calendarMonthIndex = Math.max(0, getCalendarMonthIndex(parseDate(todayIso)));
    }
    renderWeek();
  }
  renderLiveLesson(now);
  // Refresh status in place so minute ticks never discard keyboard focus.
  document.querySelectorAll(".lesson-card[data-lesson-id]").forEach((card) => {
    const state = getDayState(parseDate(card.dataset.date));
    const item = state.lessons.find((entry) => entry.id === card.dataset.lessonId);
    if (!item) return;
    const status = getLessonStatus(item, state, now);
    card.classList.toggle("is-live", status === "live");
    card.classList.toggle("is-ended", status === "ended");
    const label = card.querySelector(".lesson-status");
    if (label) label.textContent = status === "live" ? "上课中" : status === "ended" ? "已结束" : "";
  });
  scheduleGrid.querySelector(".current-time-marker")?.remove();
  scheduleGrid.insertAdjacentHTML("beforeend", getCurrentTimeMarker(getWeekStates()));
}

function getCurrentTimeMarker(states) {
  const state = states.find((item) => item.iso === todayIso);
  if (!state || state.holiday || !getVisibleLessons(state).length) return "";

  const now = new Date();
  const nowParts = getBjtParts(now);
  const nowMinutes = Number(nowParts.hour) * 60 + Number(nowParts.minute);
  let rowIndex = SCHEDULE_TIME_RANGES.findIndex(([, end]) => nowMinutes <= end);
  if (rowIndex < 0 || nowMinutes < SCHEDULE_TIME_RANGES[0][0]) return "";

  const [start, end] = SCHEDULE_TIME_RANGES[rowIndex];
  const markerMinutes = nowMinutes < start && rowIndex > 0
    ? SCHEDULE_TIME_RANGES[rowIndex - 1][1]
    : Math.min(Math.max(nowMinutes, start), end);
  if (nowMinutes < start) rowIndex -= 1;

  const rowHeights = Array.from(timeRail.children, (slot, index) => slot.offsetHeight || SCHEDULE_ROW_HEIGHTS[index]);
  const rowTop = rowHeights.slice(0, rowIndex).reduce((sum, height) => sum + height, 0);
  const activeRange = SCHEDULE_TIME_RANGES[rowIndex];
  const progress = (markerMinutes - activeRange[0]) / (activeRange[1] - activeRange[0]);
  const top = rowTop + progress * rowHeights[rowIndex];
  const hours = nowParts.hour;
  const minutes = nowParts.minute;
  const left = ((state.naturalDay - 1) * 100) / 7;
  return `<div class="current-time-marker" style="--marker-top:${top.toFixed(2)}px;--marker-left:${left.toFixed(4)}%"><span>NOW ${hours}:${minutes}</span></div>`;
}

function lessonMarkup(item, state, extraClass = "") {
  const typeClass = isNightLesson(item) ? "night" : item.type === "practice" ? "practice" : "lecture";
  const session = getLessonSession(item);
  const periodLabel = getPeriodLabel(item);
  const status = getLessonStatus(item, state);
  const classes = `${state.adjustment ? " adjusted" : ""}${status === "live" ? " is-live" : status === "ended" ? " is-ended" : ""}`;
  const statusMarkup = `<span class="lesson-status">${status === "live" ? "上课中" : status === "ended" ? "已结束" : ""}</span>`;
  const kindMarkup = periodLabel ? `<span class="lesson-kind">${periodLabel}</span>` : "";
  const mobile = extraClass.includes("mobile");
  const timeParts = item.time.split("–");
  return `<button class="lesson-card session-${session.code.toLowerCase()} ${typeClass}${classes} ${extraClass}" type="button" data-lesson-id="${item.id}" data-date="${state.iso}" ${mobile ? "" : `style="--row:${item.row};--span:${item.span}"`} aria-label="${item.title}，${item.time}，教室 ${item.room}，查看详情">
    ${mobile ? `<span class="agenda-time"><strong>${timeParts[0]}</strong><span>${timeParts[1]}</span></span>` : ""}
    <span class="lesson-content">
      <span class="lesson-meta">${kindMarkup}${mobile ? statusMarkup : `<span class="lesson-time">${item.time}</span>`}</span>
      <span class="lesson-name">${item.title}</span>
      <span class="lesson-room"><span aria-hidden="true">⌖</span> ${item.room}${!mobile ? statusMarkup : ""}</span>
    </span>
    ${mobile ? '<span class="agenda-arrow" aria-hidden="true">›</span>' : ""}
  </button>`;
}

function renderWeekCalendar() {
  if (!calendarGrid) return;
  const month = CALENDAR_MONTHS[calendarMonthIndex] || CALENDAR_MONTHS[0];
  const monthStart = new Date(month.year, month.month, 1);
  const leadingDays = (monthStart.getDay() + 6) % 7;
  const monthLength = new Date(month.year, month.month + 1, 0).getDate();
  const cellCount = Math.ceil((leadingDays + monthLength) / 7) * 7;
  const selectedWeek = currentWeek;

  if (calendarMonthLabel) calendarMonthLabel.textContent = `${month.year}年${month.month + 1}月`;
  if (calendarMonthPrev) calendarMonthPrev.disabled = calendarMonthIndex <= 0;
  if (calendarMonthNext) calendarMonthNext.disabled = calendarMonthIndex >= CALENDAR_MONTHS.length - 1;

  calendarGrid.innerHTML = Array.from({ length: cellCount }, (_, index) => {
    const date = addDays(monthStart, index - leadingDays);
    const iso = toIso(date);
    const inTerm = isInTerm(iso);
    const state = getDayState(date);
    const week = getWeekNumber(date);
    const status = state.adjustment ? "调休" : state.holiday ? "休假" : "";
    const statusClass = state.adjustment ? " is-adjusted" : state.holiday ? " is-holiday" : "";
    const selectedClass = inTerm && week === selectedWeek ? " is-selected-week" : "";
    const todayClass = iso === todayIso ? " is-today" : "";
    const adjacentClass = date.getMonth() === month.month ? "" : " is-adjacent";
    const mondayBadge = inTerm && date.getDay() === 1
      ? `<span class="month-week-code">W${String(week).padStart(2, "0")}</span>`
      : "";
    const adjustmentHint = state.adjustment ? `，按${formatShortDate(state.sourceIso)}课表` : "";
    const label = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日${status ? ` · ${status}` : ""}${adjustmentHint}`;
    return `<button class="month-day${statusClass}${selectedClass}${todayClass}${adjacentClass}" type="button" data-date="${inTerm ? iso : ""}" aria-label="${label}"${iso === todayIso ? ' aria-current="date"' : ""}${inTerm ? "" : " disabled"}>
      <span class="month-day-number">${date.getDate()}</span>
      ${mondayBadge}
      ${status ? `<span class="month-day-tag">${status}</span>` : ""}
    </button>`;
  }).join("");
  calendarGrid.setAttribute("aria-label", `${month.year}年${month.month + 1}月日期，当前第${selectedWeek}周`);
}

function setCalendarOpen(open) {
  if (!weekCalendar || !calendarButton) return;
  if (open && !weekCalendar.open) {
    calendarMonthIndex = Math.max(0, getCalendarMonthIndex(parseDate(selectedDate)));
    renderWeekCalendar();
    weekCalendar.showModal();
    weekCalendar.querySelector(`[data-date="${selectedDate}"]`)?.focus({ preventScroll: true });
  } else if (!open && weekCalendar.open) {
    weekCalendar.close();
  }
  calendarButton.setAttribute("aria-expanded", String(open));
}

function closeWeekCalendar() {
  setCalendarOpen(false);
}

function renderAdjustmentBanner(states) {
  const adjustments = states.filter((state) => state.adjustment);
  const holidays = states.filter((state) => state.holiday);
  const banner = $("#adjustmentBanner");
  if (!adjustments.length && !holidays.length) {
    banner.hidden = true;
    return;
  }
  const adjustmentText = adjustments.length === 1
    ? (() => {
      const first = adjustments[0];
      return `按 ${formatShortDate(first.sourceIso)}（${DAY_NAMES[first.sourceDay]}）课表执行`;
    })()
    : adjustments.map((state) => `${formatShortDate(state.iso)}按${formatShortDate(state.sourceIso)}课表`).join("；");
  const adjustmentDetailText = adjustments.length === 1
    ? `${formatShortDate(adjustments[0].iso)}（${DAY_NAMES[adjustments[0].naturalDay]}）${adjustmentText}`
    : adjustmentText;
  const holidayRange = holidays.length === 1
    ? formatShortDate(holidays[0].iso)
    : holidays.length
      ? `${formatShortDate(holidays[0].iso)}–${formatShortDate(holidays[holidays.length - 1].iso)}`
      : "";
  const holidayLabels = [...new Set(holidays.map((state) => state.holiday?.label || "休假"))];
  if (adjustments.length && holidays.length) {
    $("#adjustmentBannerLabel").textContent = "安排";
    $("#adjustmentBannerTitle").textContent = "调休 + 休假";
    $("#adjustmentBannerText").textContent = `调休：${adjustmentDetailText}；休假：${holidayRange} · ${holidayLabels.join("、")}。`;
  } else if (adjustments.length) {
    const first = adjustments[0];
    $("#adjustmentBannerLabel").textContent = "调休";
    $("#adjustmentBannerTitle").textContent = adjustments.length === 1
      ? `${formatShortDate(first.iso)}（${DAY_NAMES[first.naturalDay]}）`
      : "多日调休";
    $("#adjustmentBannerText").textContent = `${adjustmentText}。`;
  } else {
    $("#adjustmentBannerLabel").textContent = "休假";
    $("#adjustmentBannerTitle").textContent = holidayRange;
    $("#adjustmentBannerText").textContent = `${holidayLabels.join("、")}。`;
  }
  banner.hidden = false;
}

function renderDesktopSchedule(states) {
  weekdayRow.innerHTML = `<div class="grid-corner"><span>节次</span><small>上课时间</small></div>${states.map((state) => {
    const todayClass = state.iso === todayIso ? " is-today" : "";
    const adjustedClass = state.adjustment ? " is-adjusted" : "";
    const holidayClass = state.holiday ? " is-holiday" : "";
    const phase = getDayPhase(state, states);
    const note = state.adjustment ? `按${formatShortDate(state.sourceIso)}` : state.holiday ? "" : state.iso === todayIso ? "今天" : "";
    return `<div class="weekday-cell${todayClass}${adjustedClass}${holidayClass}" data-date="${state.iso}" data-day-index="${state.naturalDay}" role="button" tabindex="0" aria-label="${DAY_NAMES[state.naturalDay]} ${formatMonthDay(parseDate(state.iso))}，切换到日程视图">
      <div class="weekday-topline"><span class="day-phase ${phase.key}" title="${phase.en}"><b>${phase.code}</b></span>${note ? `<span class="day-note">${note}</span>` : ""}</div>
      <div class="weekday-main"><strong class="day-name">${DAY_NAMES[state.naturalDay]}</strong><span class="day-date">${formatMonthDay(parseDate(state.iso))}</span></div>
    </div>`;
  }).join("")}`;

  timeRail.innerHTML = TIME_SLOTS.map((slot) => `<div class="time-slot session-${slot.sessionCode.toLowerCase()}${slot.sessionStart ? " session-start" : ""}">${slot.sessionStart ? `<span class="slot-session">${slot.sessionCode}</span>` : ""}<strong>${slot.period}</strong><span>${slot.time}</span></div>`).join("");

  scheduleGrid.innerHTML = states.map((state) => {
    const todayClass = state.iso === todayIso ? " is-today" : "";
    const weekendClass = state.naturalDay > 5 ? " is-weekend" : "";
    const adjustedClass = state.adjustment ? " is-adjusted" : "";
    const holidayClass = state.holiday ? " is-holiday" : "";
    const lessons = getVisibleLessons(state);
    const phase = getDayPhase(state, states);
    if (!lessons.length) {
      const text = state.adjustment ? "暂无对应课程" : state.holiday ? "休假" : state.lessons.length ? "当前筛选无课程" : state.naturalDay > 5 ? "" : "暂无课程";
      return `<div class="day-column${todayClass}${weekendClass}${adjustedClass}${holidayClass}" data-date="${state.iso}" data-day-index="${state.naturalDay}"><div class="empty-day"><span class="empty-phase ${phase.key}">${phase.code}</span>${text ? `<span class="empty-label">${text}</span>` : ""}</div></div>`;
    }
    return `<div class="day-column${todayClass}${weekendClass}${adjustedClass}${holidayClass}" data-date="${state.iso}" data-day-index="${state.naturalDay}">${lessons.map((item) => lessonMarkup(item, state)).join("")}</div>`;
  }).join("") + getCurrentTimeMarker(states);
}

function renderDayPicker(states) {
  $("#dayPicker").innerHTML = states.map((state) => `<button type="button" class="day-picker-button${state.iso === selectedDate ? " is-selected" : ""}${state.iso === todayIso ? " is-today" : ""}${state.adjustment ? " is-adjusted" : ""}" data-select-date="${state.iso}" aria-pressed="${state.iso === selectedDate}"${state.iso === todayIso ? ' aria-current="date"' : ""} aria-label="${formatDateLong(state.iso)}，${state.adjustment ? "调休，" : ""}${state.lessons.length}节课${state.holiday ? "，休假" : ""}">
    <span>${DAY_NAMES[state.naturalDay]}</span><strong>${parseDate(state.iso).getDate()}</strong><small>${state.adjustment ? "调休" : state.holiday ? "休假" : state.lessons.length ? `${state.lessons.length}节` : "休息"}</small>
  </button>`).join("");
}

function renderMobileSchedule(states) {
  const state = states.find((day) => day.iso === selectedDate) || states[0];
  if (!state) return;
  selectedDate = state.iso;
  renderDayPicker(states);
  const lessons = getVisibleLessons(state);
  let previousSession = "";
  const content = lessons.map((item) => {
    const session = getLessonSession(item).code;
    const heading = session !== previousSession ? `<div class="agenda-session">${{ S1: "上午", S2: "下午", S3: "晚上" }[session]}<span aria-hidden="true">${session}</span></div>` : "";
    previousSession = session;
    return heading + lessonMarkup(item, state, "mobile");
  }).join("");
  const next = !lessons.length ? getUpcomingLesson(toIso(addDays(parseDate(state.iso), 1))) : null;
  const empty = `<div class="agenda-empty"><img src="./assets/racing-miku-2025-spa-chibi-trim.png" alt="" width="100" height="100" loading="lazy" /><strong>${state.holiday ? state.holiday.label : "这一天没有课程"}</strong><p>${state.holiday ? "课表已按休假安排调整" : "留一点时间，按自己的节奏来。"}</p>${next ? `<button type="button" class="empty-next-day" data-select-date="${next.state.iso}">下个上课日 · ${formatShortDate(next.state.iso)} <span aria-hidden="true">→</span></button>` : ""}</div>`;
  mobileDayList.innerHTML = `<article class="mobile-day${state.iso === todayIso ? " is-today" : ""}" data-date="${state.iso}" data-day-index="${state.naturalDay}">
    <div class="agenda-heading"><h3>${DAY_NAMES[state.naturalDay]}<span>${formatShortDate(state.iso)}</span>${state.iso === todayIso ? '<b class="today-badge">今天</b>' : ""}</h3><span>${lessons.length} 节课程</span></div>
    ${state.adjustment ? `<p class="agenda-adjustment">调休 · 按 ${formatShortDate(state.sourceIso)}（${DAY_NAMES[state.sourceDay]}）课表上课</p>` : ""}
    <div class="mobile-day-content">${lessons.length ? content : empty}</div>
  </article>`;
}

function selectDate(iso, { focus = false } = {}) {
  if (!isInTerm(iso)) return;
  selectedDate = iso;
  currentWeek = getWeekNumber(parseDate(iso));
  calendarMonthIndex = Math.max(0, getCalendarMonthIndex(parseDate(iso)));
  renderWeek();
  const state = getDayState(parseDate(iso));
  $("#scheduleAnnouncement").textContent = `${formatDateLong(iso)}，${state.lessons.length}节课程`;
  if (focus) $("#dayPicker").querySelector(`[data-select-date="${iso}"]`)?.focus({ preventScroll: true });
}

function renderOverview(states) {
  const rows = states.filter((state) => getVisibleLessons(state).length || state.adjustment || state.holiday).map((state) => {
    const lessons = getVisibleLessons(state);
    const summary = state.holiday
      ? "休假"
      : state.adjustment
        ? `调休 · ${lessons.length ? `${lessons.length} 节` : "无对应课程"}`
        : `${lessons.length} 节课程`;
    return `<div class="overview-row"><strong>${DAY_NAMES[state.naturalDay]} · ${formatShortDate(state.iso)}</strong><span>${summary}</span></div>`;
  });
  weekOverview.innerHTML = rows.join("") || `<div class="notice-empty">本周没有已排课程</div>`;
}

function renderOfficialAdjustments() {
  const target = $("#officialAdjustmentList");
  const adjustments = getEffectiveAdjustments();
  const holidays = getEffectiveHolidays();
  const entries = [
    ...adjustments.map((item) => ({ kind: "adjustment", date: item.actualDate, item })),
    ...holidays.map((item) => ({ kind: "holiday", date: item.startDate, item }))
  ].sort((a, b) => a.date.localeCompare(b.date));
  const sourceLink = $("#noticeSourceLink");
  const preferredSource = entries.map((entry) => entry.item).find((item) => item.sourceUrl);
  if (preferredSource?.sourceUrl) {
    sourceLink.href = preferredSource.sourceUrl;
    sourceLink.textContent = "查看原通知";
    sourceLink.hidden = false;
  } else {
    sourceLink.hidden = true;
  }
  if (!entries.length) {
    const mascot = $("#noticeMascot");
    if (mascot) mascot.hidden = true;
    target.innerHTML = `<div class="notice-empty">暂无已核实的调休或休假安排。</div>`;
    return;
  }
  const mascot = $("#noticeMascot");
  if (mascot) mascot.hidden = !adjustments.length;
  target.innerHTML = entries.map(({ kind, item }) => {
    const sourceTypeLabel = { national: "国家", academic: "教务系统", school: "学校" }[item.sourceType] || "来源";
    if (kind === "holiday") {
      const dateLabel = item.startDate === item.endDate
        ? `${formatShortDate(item.startDate)} · ${DAY_NAMES[parseDate(item.startDate).getDay() || 7]}`
        : `${formatShortDate(item.startDate)}–${formatShortDate(item.endDate)}`;
      return `<div class="notice-entry holiday-entry">
        <div class="notice-entry-main"><strong>${dateLabel}</strong><span class="notice-source-tag">${sourceTypeLabel}</span></div>
        <div class="notice-entry-detail"><span>${item.label || "休假"}</span></div>
      </div>`;
    }
    return `<div class="notice-entry">
      <div class="notice-entry-main"><strong>${formatShortDate(item.actualDate)} · ${DAY_NAMES[parseDate(item.actualDate).getDay() || 7]}</strong><span class="notice-source-tag">${sourceTypeLabel}</span></div>
      <div class="notice-entry-detail"><span>${item.label || `按${formatShortDate(item.sourceDate)}课表上课`}</span></div>
    </div>`;
  }).join("");
}

function renderWeek() {
  const start = getWeekStart(currentWeek);
  const end = addDays(start, 6);
  const states = Array.from({ length: 7 }, (_, index) => getDayState(addDays(start, index)));
  const totalLessons = states.reduce((sum, state) => sum + getVisibleLessons(state).length, 0);
  const classDays = states.filter((state) => getVisibleLessons(state).length).length;
  const adjustments = states.filter((state) => state.adjustment).length;
  const holidays = states.filter((state) => state.holiday).length;

  weekTitle.textContent = `第 ${currentWeek} 周`;
  weekRange.textContent = `${formatMonthDay(start)} – ${formatMonthDay(end)}`;
  if (calendarButtonLabel) calendarButtonLabel.textContent = `第 ${currentWeek} 周 · ${start.getMonth() + 1}.${start.getDate()}–${end.getMonth() + 1}.${end.getDate()}`;
  $("#lessonCount").textContent = totalLessons;
  $("#classDayCount").textContent = classDays;
  renderLiveLesson();
  $("#previousWeek").disabled = currentWeek === 1;
  $("#nextWeek").disabled = currentWeek === WEEKS.length;
  $("#calendarButtonKicker").textContent = currentWeek === getWeekNumber(parseDate(todayIso)) ? "本周 · 点击选日期" : "选择教学周";
  $("#weekStatus").textContent = adjustments && holidays
    ? `${adjustments} 天调休 · ${holidays} 天休假`
    : adjustments
      ? `${adjustments} 天调休`
      : holidays
        ? `${holidays} 天休假`
        : "按个人课表";

  renderAdjustmentBanner(states);
  renderPhaseStrip(states);
  renderDesktopSchedule(states);
  renderMobileSchedule(states);
  renderOverview(states);
  renderWeekCalendar();
}

function positionLessonDialog(anchor = lessonDialogAnchor) {
  if (!lessonDialog?.open || !anchor) return;
  if (globalThis.matchMedia?.("(max-width: 760px)").matches) {
    lessonDialog.style.left = "";
    lessonDialog.style.top = "";
    return;
  }
  const anchorRect = anchor.getBoundingClientRect();
  const margin = 12;
  const gap = 10;
  const dialogWidth = lessonDialog.offsetWidth;
  const dialogHeight = lessonDialog.offsetHeight;
  let left = anchorRect.right + gap;
  if (left + dialogWidth > window.innerWidth - margin) left = anchorRect.left - dialogWidth - gap;
  if (left < margin) left = Math.max(margin, (window.innerWidth - dialogWidth) / 2);
  let top = anchorRect.top;
  if (top + dialogHeight > window.innerHeight - margin) top = anchorRect.bottom - dialogHeight;
  top = Math.max(margin, Math.min(top, window.innerHeight - dialogHeight - margin));
  lessonDialog.style.left = `${Math.round(left)}px`;
  lessonDialog.style.top = `${Math.round(top)}px`;
}

function closeLessonDialog() {
  if (lessonDialog?.open) lessonDialog.close();
  lessonDialogAnchor = null;
  if (lessonDialog) {
    lessonDialog.style.left = "";
    lessonDialog.style.top = "";
  }
}

function openLessonDialog(item, state, anchor) {
  lessonDialogAnchor = anchor;
  const adjustedText = state.adjustment
    ? `<div class="dialog-adjustment">调休 · ${formatDateLong(state.iso)}按${formatDateLong(state.sourceIso)}课表执行</div>`
    : "";
  const session = getLessonSession(item);
  const phase = getDayPhase(state, getWeekStates(state.week));
  dialogContent.innerHTML = `<div class="dialog-topline"><span>${formatDateLong(state.iso)}</span></div>
    <h2 id="lessonDialogTitle" class="dialog-title">${item.title}</h2>
    <dl class="lesson-detail-grid"><div><dt>上课时间</dt><dd>${item.time}</dd></div><div><dt>教室</dt><dd>${item.room}</dd></div></dl>
    ${adjustedText}`;
  if (typeof lessonDialog.showModal === "function") {
    lessonDialog.showModal();
    window.requestAnimationFrame(() => positionLessonDialog(anchor));
  }
}

function handleLessonClick(event) {
  const button = event.target.closest("[data-lesson-id]");
  if (!button) return;
  const state = getDayState(parseDate(button.dataset.date));
  const item = state.lessons.find((entry) => entry.id === button.dataset.lessonId);
  if (item) openLessonDialog(item, state, button);
}

function changeWeek(nextWeek) {
  closeWeekCalendar();
  const next = Math.min(Math.max(nextWeek, 1), WEEKS.length);
  if (next === currentWeek) return;
  const scheduleSection = $("#scheduleSection");
  const direction = next > currentWeek ? "forward" : "back";
  scheduleSection?.classList?.remove("is-switching", "is-forward", "is-back");
  void scheduleSection?.offsetWidth;
  scheduleSection?.classList?.add("is-switching", `is-${direction}`);
  const dayIndex = (parseDate(selectedDate).getDay() + 6) % 7;
  currentWeek = next;
  selectedDate = toIso(addDays(getWeekStart(next), dayIndex));
  renderWeek();
  $("#scheduleAnnouncement").textContent = `第 ${currentWeek} 周，${formatMonthDay(getWeekStart(currentWeek))}开始`;
  window.setTimeout(() => scheduleSection?.classList?.remove("is-switching", "is-forward", "is-back"), 420);
}

function focusDayInDayView(dayIndex) {
  setViewMode("day");
  selectDate(toIso(addDays(getWeekStart(currentWeek), Number(dayIndex) - 1)));
  $("#scheduleSection").scrollIntoView({ behavior: "smooth", block: "start" });
}

function handleWeekdayActivate(event) {
  const cell = event.target.closest(".weekday-cell");
  if (!cell) return;
  if (event.type === "keydown" && event.key !== "Enter" && event.key !== " ") return;
  if (event.type === "keydown") event.preventDefault();
  focusDayInDayView(cell.dataset.dayIndex);
}

setViewMode(viewMode);
renderOfficialAdjustments();
renderWeek();
updateLiveClock();
window.setInterval(updateLiveClock, 1000);

setupTrackTelemetry();

calendarButton?.addEventListener?.("click", () => setCalendarOpen(!weekCalendar.open));
$("#closeCalendar")?.addEventListener?.("click", closeWeekCalendar);
weekCalendar.addEventListener("close", () => calendarButton.setAttribute("aria-expanded", "false"));
weekCalendar.addEventListener("click", (event) => {
  if (event.target !== weekCalendar) return;
  const rect = weekCalendar.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeWeekCalendar();
});
calendarGrid?.addEventListener?.("click", (event) => {
  const day = event.target.closest?.(".month-day[data-date]");
  if (!day || day.disabled) return;
  selectDate(day.dataset.date);
  closeWeekCalendar();
});
calendarGrid.addEventListener("keydown", (event) => {
  const day = event.target.closest(".month-day[data-date]");
  const offset = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
  if (!day || !offset) return;
  event.preventDefault();
  event.stopPropagation();
  const iso = toIso(addDays(parseDate(day.dataset.date), offset));
  if (!isInTerm(iso)) return;
  calendarMonthIndex = getCalendarMonthIndex(parseDate(iso));
  renderWeekCalendar();
  calendarGrid.querySelector(`[data-date="${iso}"]`)?.focus();
});
calendarMonthPrev?.addEventListener?.("click", () => {
  if (calendarMonthIndex <= 0) return;
  calendarMonthIndex -= 1;
  renderWeekCalendar();
});
calendarMonthNext?.addEventListener?.("click", () => {
  if (calendarMonthIndex >= CALENDAR_MONTHS.length - 1) return;
  calendarMonthIndex += 1;
  renderWeekCalendar();
});
$("#previousWeek").addEventListener("click", () => changeWeek(currentWeek - 1));
$("#nextWeek").addEventListener("click", () => changeWeek(currentWeek + 1));
weekViewButton?.addEventListener?.("click", () => setViewMode("week"));
dayViewButton?.addEventListener?.("click", () => setViewMode("day"));
$("#todayButton").addEventListener("click", () => {
  if (!isInTerm(todayIso)) {
    $("#scheduleAnnouncement").textContent = "今天不在本学期内，已返回第一周";
    selectDate(TERM_START);
  } else {
    selectDate(todayIso);
  }
  if (globalThis.matchMedia?.("(max-width: 760px)").matches) setViewMode("day");
  $("#scheduleSection").scrollIntoView({ behavior: "smooth", block: "start" });
});
$("#nextLessonButton").addEventListener("click", handleLessonClick);
scheduleGrid.addEventListener("click", handleLessonClick);
mobileDayList.addEventListener("click", handleLessonClick);
function handleDateSelection(event) {
  const button = event.target.closest("[data-select-date]");
  if (button) selectDate(button.dataset.selectDate, { focus: true });
}
$("#dayPicker").addEventListener("click", handleDateSelection);
mobileDayList.addEventListener("click", handleDateSelection);
$("#dayPicker").addEventListener("keydown", (event) => {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  event.preventDefault();
  event.stopPropagation();
  selectDate(toIso(addDays(parseDate(selectedDate), event.key === "ArrowRight" ? 1 : -1)), { focus: true });
});
let touchStart = null;
let suppressLessonClickUntil = 0;
mobileDayList.addEventListener("touchstart", (event) => {
  const touch = event.touches.length === 1 ? event.touches[0] : null;
  touchStart = touch ? { x: touch.clientX, y: touch.clientY } : null;
}, { passive: true });
mobileDayList.addEventListener("touchcancel", () => { touchStart = null; }, { passive: true });
mobileDayList.addEventListener("touchend", (event) => {
  if (!touchStart) return;
  const touch = event.changedTouches[0];
  const deltaX = touch ? touch.clientX - touchStart.x : 0;
  const deltaY = touch ? touch.clientY - touchStart.y : 0;
  touchStart = null;
  if (Math.abs(deltaX) < 64 || Math.abs(deltaX) < Math.abs(deltaY) * 1.6) return;
  suppressLessonClickUntil = Date.now() + 400;
  selectDate(toIso(addDays(parseDate(selectedDate), deltaX < 0 ? 1 : -1)));
}, { passive: true });
mobileDayList.addEventListener("click", (event) => {
  if (Date.now() < suppressLessonClickUntil) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}, true);
weekdayRow.addEventListener("click", handleWeekdayActivate);
weekdayRow.addEventListener("keydown", handleWeekdayActivate);
document.addEventListener("keydown", (event) => {
  if (document.querySelector("dialog[open]") || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.defaultPrevented) return;
  if (event.target.closest("input, select, textarea, [contenteditable='true']")) return;
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    if (event.target.closest(".schedule-scroll")) return;
    event.preventDefault();
    if (viewMode === "day") selectDate(toIso(addDays(parseDate(selectedDate), event.key === "ArrowRight" ? 1 : -1)));
    else changeWeek(currentWeek + (event.key === "ArrowRight" ? 1 : -1));
  }
  if (event.target.closest("button, a, summary")) return;
  if (event.key.toLowerCase() === "w") setViewMode("week");
  if (event.key.toLowerCase() === "d") setViewMode("day");
});
$("#closeDialog").addEventListener("click", closeLessonDialog);
lessonDialog.addEventListener("click", (event) => {
  const rect = lessonDialog.getBoundingClientRect();
  const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
  if (!inside) closeLessonDialog();
});
lessonDialog.addEventListener("close", () => {
  lessonDialogAnchor = null;
  lessonDialog.style.left = "";
  lessonDialog.style.top = "";
});
window.addEventListener("resize", () => positionLessonDialog());
window.addEventListener("scroll", () => positionLessonDialog(), { passive: true });
// Pause the decorative lap when off screen or backgrounded to save battery.
function resumeTrackTelemetry() {
  if (document.hidden || !trackTelemetryState.inView || trackTelemetryState.reducedMotion) return;
  beginTelemetryLap();
  trackTelemetryState.running = true;
  scheduleTrackAnimation();
}
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    updateLiveClock();
    resumeTrackTelemetry();
  }
});
if (typeof IntersectionObserver !== "undefined") {
  new IntersectionObserver(([entry]) => {
    trackTelemetryState.inView = entry.isIntersecting;
    if (entry.isIntersecting) resumeTrackTelemetry();
  }).observe($(".race-masthead-art"));
}
globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.addEventListener?.("change", (event) => {
  trackTelemetryState.reducedMotion = event.matches;
  trackTelemetryState.running = !event.matches;
  if (!event.matches) resumeTrackTelemetry();
});
