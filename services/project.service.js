const mongoose = require('mongoose');
const Project = require('../models/project.model');
const Task = require('../models/task.model');
const Goal = require('../models/monthlyGoal.model');
const WorkSession = require('../models/workSession.model');
const {
  validateProject,
  validateProjectUpdate,
  validateMilestoneUpdate,
} = require('../validators/project.validator');
const fields = [
  'name',
  'description',
  'objective',
  'category',
  'priority',
  'status',
  'startDate',
  'targetDate',
  'estimatedHours',
  'notes',
];
const milestoneFields = [
  'title',
  'description',
  'status',
  'targetDate',
  'order',
];
const pick = (data, keys) =>
  Object.fromEntries(
    keys
      .filter((key) => data[key] !== undefined)
      .map((key) => [key, data[key]]),
  );
const oid = (value) => new mongoose.Types.ObjectId(String(value));
const validId = (value) => mongoose.Types.ObjectId.isValid(value);
const validation = (result) => {
  if (!result.isValid) {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.errors = result.errors;
    throw error;
  }
};
const service = {};

function milestoneMetrics(project) {
  const milestones = project.milestones || [];
  const active = milestones.filter((item) => item.status !== 'skipped');
  const completed = active.filter((item) => item.status === 'completed').length;
  return {
    totalMilestones: milestones.length,
    activeMilestones: active.length,
    completedMilestones: completed,
    progress: active.length
      ? Math.round((completed / active.length) * 100)
      : null,
    allMilestonesCompleted: active.length > 0 && completed === active.length,
  };
}
function present(project) {
  return {
    ...project,
    ...milestoneMetrics(project),
    isOverdue: Boolean(
      project.targetDate &&
      new Date(project.targetDate) < new Date() &&
      !['completed', 'cancelled', 'archived'].includes(project.status),
    ),
  };
}
// Only completed sessions owned by this user, joined to their own project tasks.
function workPipeline(userId, projectIds) {
  return [
    { $match: { user: oid(userId), status: 'completed' } },
    // Derive from timestamps, including historical sessions saved before duration fixes.
    {
      $set: {
        durationMinutes: {
          $cond: [
            {
              $and: [
                { $ne: ['$startedAt', null] },
                { $ne: ['$endedAt', null] },
              ],
            },
            {
              $max: [
                0,
                {
                  $floor: {
                    $divide: [{ $subtract: ['$endedAt', '$startedAt'] }, 60000],
                  },
                },
              ],
            },
            { $ifNull: ['$durationMinutes', 0] },
          ],
        },
      },
    },
    {
      $lookup: {
        from: 'tasks',
        localField: 'task',
        foreignField: '_id',
        as: 'linkedTask',
      },
    },
    { $unwind: '$linkedTask' },
    {
      $match: {
        'linkedTask.user': oid(userId),
        'linkedTask.project': { $in: projectIds.map(oid) },
      },
    },
  ];
}
async function workTotals(userId, projectIds) {
  if (!projectIds.length) return [];
  return WorkSession.aggregate([
    ...workPipeline(userId, projectIds),
    {
      $group: {
        _id: '$linkedTask.project',
        actualMinutes: { $sum: { $ifNull: ['$durationMinutes', 0] } },
        totalWorkSessions: { $sum: 1 },
        tasks: { $addToSet: '$task' },
        averageFocusRating: { $avg: '$focusRating' },
        averageEnergyRating: { $avg: '$energyRating' },
      },
    },
  ]);
}
service.getProjectById = async (userId, projectId) => {
  if (!validId(projectId)) return null;
  const project = await Project.findOne({
    _id: projectId,
    user: userId,
  }).lean();
  return project ? present(project) : null;
};
service.createProject = async (userId, data) => {
  validation(validateProject(data));
  const project = await Project.create({
    ...pick(data, fields),
    user: userId,
    ...(data.milestones
      ? {
          milestones: data.milestones.map((m) => ({
            ...pick(m, milestoneFields),
            ...(m.status === 'completed' ? { completedAt: new Date() } : {}),
          })),
        }
      : {}),
    ...(data.status === 'completed' ? { completedAt: new Date() } : {}),
  });
  return present(project.toObject());
};
service.getProjects = async (userId, filters = {}, pagination = {}) => {
  const query = { user: userId };
  query.status = filters.status || { $ne: 'archived' };
  if (filters.status === 'all') delete query.status;
  for (const key of ['category', 'priority'])
    if (filters[key]) query[key] = filters[key];
  const page = Math.max(1, Number(pagination.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(pagination.limit) || 10));
  const [projects, count] = await Promise.all([
    Project.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Project.countDocuments(query),
  ]);
  const totals = await workTotals(
    userId,
    projects.map((p) => p._id),
  );
  const byProject = new Map(totals.map((t) => [String(t._id), t]));
  return {
    projects: projects.map((p) => ({
      ...present(p),
      actualMinutes: byProject.get(String(p._id))?.actualMinutes || 0,
    })),
    count,
    page,
    limit,
    pages: Math.ceil(count / limit),
  };
};
service.getActiveProjects = async (userId) =>
  (
    await Project.find({
      user: userId,
      status: { $in: ['planned', 'active', 'paused'] },
    })
      .sort({ createdAt: -1 })
      .lean()
  ).map(present);
service.updateProject = async (userId, projectId, data) => {
  const current = await service.getProjectById(userId, projectId);
  if (!current) return null;
  validation(validateProjectUpdate(data));
  const update = pick(data, fields);
  const dates = {
    startDate:
      update.startDate === undefined ? current.startDate : update.startDate,
    targetDate:
      update.targetDate === undefined ? current.targetDate : update.targetDate,
  };
  validation(validateProject({ name: current.name, ...dates }));
  if (update.status !== undefined && update.status !== 'archived')
    update.completedAt =
      update.status === 'completed' ? current.completedAt || new Date() : null;
  const project = await Project.findOneAndUpdate(
    { _id: projectId, user: userId },
    { $set: update },
    { returnDocument: 'after', runValidators: true },
  ).lean();
  return project ? present(project) : null;
};
service.archiveProject = (u, id) =>
  service.updateProject(u, id, { status: 'archived' });
service.completeProject = (u, id) =>
  service.updateProject(u, id, { status: 'completed' });
service.reopenProject = (u, id) =>
  service.updateProject(u, id, { status: 'active' });
// Existing DELETE contract is a soft archive, including repeated requests.
service.deleteProject = async (u, id) =>
  Boolean(await service.archiveProject(u, id));
service.addMilestone = async (userId, projectId, data) => {
  if (!validId(projectId)) return null;
  const project = await Project.findOne({ _id: projectId, user: userId });
  if (!project) return null;
  validation(validateProject({ name: project.name, milestones: [data] }));
  project.milestones.push({
    ...pick(data, milestoneFields),
    ...(data.status === 'completed' ? { completedAt: new Date() } : {}),
  });
  await project.save();
  return present(project.toObject());
};
service.updateMilestone = async (userId, projectId, milestoneId, data) => {
  if (!validId(projectId) || !validId(milestoneId)) return null;
  const project = await Project.findOne({ _id: projectId, user: userId });
  const milestone = project?.milestones.id(milestoneId);
  if (!milestone) return null;
  validation(validateMilestoneUpdate(data));
  Object.assign(milestone, pick(data, milestoneFields));
  if (data.status !== undefined)
    milestone.completedAt =
      data.status === 'completed'
        ? milestone.completedAt || new Date()
        : undefined;
  await project.save();
  return present(project.toObject());
};
service.deleteMilestone = async (userId, projectId, milestoneId) => {
  if (!validId(projectId) || !validId(milestoneId)) return false;
  const project = await Project.findOne({ _id: projectId, user: userId });
  if (!project?.milestones.id(milestoneId)) return false;
  project.milestones.pull(milestoneId);
  await project.save();
  return true;
};
service.getProjectTasks = async (
  userId,
  projectId,
  filters = {},
  pagination = {},
) => {
  if (!(await service.getProjectById(userId, projectId))) return null;
  const query = { user: userId, project: projectId };
  for (const key of ['status', 'priority'])
    if (filters[key]) query[key] = filters[key];
  if (filters.milestone) query.projectMilestoneId = filters.milestone;
  if (filters.from || filters.to)
    query.date = {
      ...(filters.from ? { $gte: new Date(filters.from) } : {}),
      ...(filters.to ? { $lte: new Date(filters.to) } : {}),
    };
  const page = Math.max(1, Number(pagination.page) || 1),
    limit = Math.min(100, Math.max(1, Number(pagination.limit) || 10));
  const [tasks, count] = await Promise.all([
    Task.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Task.countDocuments(query),
  ]);
  return { tasks, count, page, limit, pages: Math.ceil(count / limit) };
};
service.getProjectGoals = async (userId, projectId, year, month) => {
  if (!(await service.getProjectById(userId, projectId))) return null;
  return Goal.find({
    user: userId,
    project: projectId,
    ...(year ? { year } : {}),
    ...(month ? { month } : {}),
  }).sort({ year: -1, month: -1, createdAt: -1 });
};
service.getProjectWorkSummary = async (userId, projectId) => {
  const project = await service.getProjectById(userId, projectId);
  if (!project) return null;
  const [totals, recentSessions] = await Promise.all([
    workTotals(userId, [projectId]),
    WorkSession.aggregate([
      ...workPipeline(userId, [projectId]),
      { $sort: { startedAt: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 1,
          title: 1,
          startedAt: 1,
          endedAt: 1,
          sessionType: 1,
          durationMinutes: 1,
          taskTitle: '$linkedTask.title',
        },
      },
    ]),
  ]);
  const data = totals[0];
  const actualMinutes = data?.actualMinutes || 0;
  return {
    estimatedHours: project.estimatedHours,
    estimatedMinutes:
      project.estimatedHours == null ? null : project.estimatedHours * 60,
    actualMinutes,
    differenceMinutes:
      project.estimatedHours == null
        ? null
        : actualMinutes - project.estimatedHours * 60,
    totalWorkSessions: data?.totalWorkSessions || 0,
    tasksWorkedOn: data?.tasks.length || 0,
    averageFocusRating: data?.averageFocusRating || null,
    averageEnergyRating: data?.averageEnergyRating || null,
    recentSessions,
  };
};
service.getProjectSummary = async (userId, projectId) => {
  if (!projectId) {
    const counts = await Project.aggregate([
      { $match: { user: oid(userId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    return {
      total: counts.reduce((sum, c) => sum + c.count, 0),
      statusCounts: Object.fromEntries(counts.map((c) => [c._id, c.count])),
    };
  }
  const project = await service.getProjectById(userId, projectId);
  if (!project) return null;
  const [stats, work, linkedMonthlyGoals] = await Promise.all([
    Task.aggregate([
      { $match: { user: oid(userId), project: oid(projectId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    service.getProjectWorkSummary(userId, projectId),
    Goal.countDocuments({ user: userId, project: projectId }),
  ]);
  const counts = Object.fromEntries(stats.map((s) => [s._id, s.count]));
  const total = stats.reduce((sum, s) => sum + s.count, 0);
  return {
    projectId: project._id,
    projectName: project.name,
    ...milestoneMetrics(project),
    linkedMonthlyGoals,
    taskMetrics: {
      totalTasks: total,
      completedTasks: counts.completed || 0,
      inProgressTasks: counts.in_progress || 0,
      plannedTasks: counts.planned || 0,
      skippedTasks: counts.skipped || 0,
      cancelledTasks: counts.cancelled || 0,
      completionRate: total
        ? Math.round(((counts.completed || 0) / total) * 100)
        : null,
    },
    workMetrics: work,
  };
};
module.exports = service;
