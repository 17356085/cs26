// National holiday adjustments are the baseline. If a school or academic
// affairs notice later supplies a different mapping for the same actual date,
// add another record with sourceType "school" or "academic"; app.js gives it
// priority over the national baseline.
// Course details come from the student's PDF timetable. This file only maps
// an actual calendar date to the timetable date whose classes should appear.
globalThis.COURSE_SCHEDULE_OFFICIAL_ADJUSTMENTS = [
  {
    actualDate: "2026-09-20",
    sourceDate: "2026-10-06",
    sourceType: "national",
    sourceLabel: "国家安排",
    sourceUrl: "https://www.gov.cn/zhengce/content/202511/content_7047090.htm",
    label: "按 10 月 6 日（周二）课表执行",
    priority: 10
  },
  {
    actualDate: "2026-10-10",
    sourceDate: "2026-10-07",
    sourceType: "national",
    sourceLabel: "国家安排",
    sourceUrl: "https://www.gov.cn/zhengce/content/202511/content_7047090.htm",
    label: "按 10 月 7 日（周三）课表执行",
    priority: 10
  }
];

// National holidays are explicit no-class dates. A school or academic affairs
// notice can override a date by adding a higher-priority adjustment record in
// the same data layer; the renderer then uses the school rule for that date.
globalThis.COURSE_SCHEDULE_OFFICIAL_HOLIDAYS = [
  {
    startDate: "2026-09-25",
    endDate: "2026-09-27",
    sourceType: "national",
    sourceLabel: "国家安排",
    sourceUrl: "https://www.gov.cn/zhengce/content/202511/content_7047090.htm",
    label: "中秋节休假",
    priority: 10
  },
  {
    startDate: "2026-10-01",
    endDate: "2026-10-07",
    sourceType: "national",
    sourceLabel: "国家安排",
    sourceUrl: "https://www.gov.cn/zhengce/content/202511/content_7047090.htm",
    label: "国庆节休假",
    priority: 10
  }
];
