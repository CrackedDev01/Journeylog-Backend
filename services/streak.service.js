const User = require('../models/user.model');
const Task = require('../models/task.model');
const HabitLog = require('../models/habitLog.model');
const WorkSession = require('../models/workSession.model');
const LearningSession = require('../models/learningSession.model');
const DailyReview = require('../models/dailyReview.model');

const DEFAULT_TIMEZONE = 'Africa/Lagos';
const LOOKBACK_DAYS = 400;

// Format a Date as YYYY-MM-DD in the given IANA timezone
const toDayString = (date, timezone) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
};

// Shift a YYYY-MM-DD string by n days (pure calendar math, no DST issues)
const shiftDay = (dayString, n) => {
  const [y, m, d] = dayString.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().split('T')[0];
};

const streakService = {};

// Derive the set of qualifying calendar days from real activity records.
// One qualifying activity of any type marks the whole day; each date counts once.
streakService.getStreak = async (userId) => {
  const user = await User.findById(userId).select('timezone').lean();
  const timezone = user?.timezone || DEFAULT_TIMEZONE;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
  } catch {
    // Fall through with default if a stored timezone is somehow invalid
  }
  const tz = (() => {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return timezone;
    } catch {
      return DEFAULT_TIMEZONE;
    }
  })();

  const since = new Date();
  since.setDate(since.getDate() - LOOKBACK_DAYS);

  // A streak day is earned by finishing what was planned: completing ALL of
  // the day's scheduled tasks. Tasks are grouped by their scheduled date
  // (not completion timestamp) so finishing late still credits the right day.
  const [scheduledTasks, completedTasks, habitLogs, learningSessions, dailyReviews] = await Promise.all([
    Task.find({ user: userId, date: { $gte: since } })
      .select('date status')
      .lean(),
    Task.find({ user: userId, status: 'completed', completedAt: { $gte: since } })
      .select('completedAt')
      .lean(),
    HabitLog.find({ user: userId, status: { $in: ['completed', 'partial'] }, date: { $gte: since } })
      .select('date')
      .lean(),
    LearningSession.find({ user: userId, date: { $gte: since } })
      .select('date')
      .lean(),
    DailyReview.find({ user: userId, date: { $gte: since } })
      .select('date')
      .lean(),
  ]);

  const days = new Set();
  const addDay = (value) => {
    if (!value) return;
    days.add(toDayString(new Date(value), tz));
  };

  // Group scheduled tasks by calendar day; a day qualifies only when it has
  // at least one scheduled task and every one of them is completed. Skipped
  // tasks do not count as completed. Days with no scheduled tasks can still
  // qualify through the standalone actions below.
  const scheduledByDay = new Map();
  scheduledTasks.forEach((t) => {
    if (!t.date) return;
    const day = toDayString(new Date(t.date), tz);
    if (!scheduledByDay.has(day)) scheduledByDay.set(day, { total: 0, done: 0 });
    const entry = scheduledByDay.get(day);
    entry.total += 1;
    if (t.status === 'completed') entry.done += 1;
  });
  for (const [day, entry] of scheduledByDay) {
    if (entry.total > 0 && entry.done === entry.total) days.add(day);
  }

  // Habit check-ins, learning sessions and daily reviews each mark their own
  // day — they are standalone meaningful actions, not part of the task list.
  // Work sessions alone never earn a streak day; they measure time spent on
  // tasks (see per-task time on the Today page).
  habitLogs.forEach((l) => addDay(l.date));
  learningSessions.forEach((s) => addDay(s.date));
  dailyReviews.forEach((r) => addDay(r.date));

  const today = toDayString(new Date(), tz);
  const yesterday = shiftDay(today, -1);
  const completedToday = days.has(today);

  // Walk back consecutive qualifying days. If today is empty but yesterday
  // qualifies, the streak survives through today (user still has today to act).
  let currentStreak = 0;
  let cursor = completedToday ? today : days.has(yesterday) ? yesterday : null;
  if (cursor) {
    while (days.has(cursor)) {
      currentStreak += 1;
      cursor = shiftDay(cursor, -1);
    }
  }

  // Longest run anywhere in the lookback window
  let longestStreak = 0;
  const sorted = [...days].sort();
  let run = 0;
  let prev = null;
  for (const day of sorted) {
    run = prev !== null && shiftDay(prev, 1) === day ? run + 1 : 1;
    if (run > longestStreak) longestStreak = run;
    prev = day;
  }

  const lastActivityDate = sorted.length ? sorted[sorted.length - 1] : null;

  return {
    currentStreak,
    longestStreak,
    lastActivityDate,
    completedToday,
    streakAtRisk: currentStreak > 0 && !completedToday,
    timezone: tz,
  };
};

module.exports = streakService;
