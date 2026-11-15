const semesterGrid = $("#semesterGrid");
const semesterCurrentWeekButton = $("#semesterCurrentWeekButton");

function semesterLessonList(lessons) {
  if (!lessons.length) return "";
  return `<ul>${lessons.map(({ time, title, room }) => `
    <li class="semester-lesson">
      <span class="semester-time">${time}</span>
      <span>${title}</span>
      <span class="semester-room">${room.replace(/^(\d+)-/, "$1教")}</span>
    </li>`).join("")}</ul>`;
}

function semesterDayRow(label, lessons, status = "", evening = false) {
  return `
    <div class="semester-day${evening ? " semester-evening" : ""}">
      <dt>${label}</dt>
      <dd>
        ${status ? `<div class="semester-status">${status}</div>` : ""}
        ${semesterLessonList(lessons)}
        ${!status && !lessons.length ? '<span class="semester-status">无课</span>' : ""}
      </dd>
    </div>`;
}

function renderSemester() {
  const todayWeek = isInTerm(todayIso) ? getWeekNumber(parseDate(todayIso)) : 0;
  const shortDate = (date) => `${date.getMonth() + 1}/${date.getDate()}`;
  semesterCurrentWeekButton.hidden = !todayWeek;

  semesterGrid.innerHTML = WEEKS.map((_, index) => {
    const week = index + 1;
    const start = getWeekStart(week);
    const friday = addDays(start, 4);
    const year = friday.getFullYear() === start.getFullYear() ? "" : `${friday.getFullYear()}/`;
    const current = week === todayWeek;
    const rows = getWeekStates(week).map((state) => {
      const { naturalDay, adjustment, holiday } = state;
      const lessons = getVisibleLessons(state);
      if (naturalDay > 5 && !adjustment && !lessons.length) return "";

      const isFridayEvening = (item) => naturalDay === 5 && isNightLesson(item);
      const daytime = lessons.filter((item) => !isFridayEvening(item));
      const evening = lessons.filter(isFridayEvening);
      const status = holiday
        ? "休假"
        : adjustment ? `补上${DAY_NAMES[state.sourceDay]}课程` : "";
      return semesterDayRow(DAY_NAMES[naturalDay], daytime, status) +
        (evening.length ? semesterDayRow("周五晚", evening, "", true) : "");
    }).join("");

    return `
      <article class="semester-week">
        <h2><button type="button" data-semester-week="${week}"${current ? ' aria-current="true"' : ""}>
          <span>第${week}周</span><span class="semester-divider" aria-hidden="true">|</span>
          <span>${shortDate(start)}–${year}${shortDate(friday)}</span>
          ${current ? '<span class="semester-current-label">本周</span>' : ""}
        </button></h2>
        <dl>${rows}</dl>
      </article>`;
  }).join("");
}

$("#semesterViewButton").addEventListener("click", () => {
  setViewMode("semester");
  renderSemester();
  semesterGrid.querySelector(`[data-semester-week="${currentWeek}"]`)?.focus();
});

semesterGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-semester-week]");
  if (!button) return;
  const week = Number(button.dataset.semesterWeek);
  setViewMode(detailViewMode);
  if (week !== currentWeek && detailViewMode === "day") {
    selectDate(toIso(getWeekStart(week)));
  } else {
    changeWeek(week);
  }
  $("#scheduleTitle").focus();
});

semesterCurrentWeekButton.addEventListener("click", () => {
  const current = semesterGrid.querySelector('[aria-current="true"]');
  current?.focus({ preventScroll: true });
  current?.scrollIntoView({ block: "start" });
});

$("#semesterTodayButton").addEventListener("click", () => {
  setViewMode(detailViewMode);
  $("#todayButton").click();
});

renderSemester();
