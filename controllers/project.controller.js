const asyncHandler = require('../utils/asyncHandler');
const projectService = require('../services/project.service');

/**
 * Create a new project
 */
const createProject = asyncHandler(async (req, res) => {
  const projectData = req.body;
  const userId = req.user._id;

  const project = await projectService.createProject(userId, projectData);

  res.status(201).json({
    success: true,
    message: 'Project created successfully',
    data: { project }
  });
});

/**
 * Get all projects with filtering
 */
const getProjects = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const filters = {};

  // Add filters if provided
  if (req.query.status) {
    filters.status = req.query.status;
  }
  if (req.query.category) {
    filters.category = req.query.category;
  }
  if (req.query.priority) {
    filters.priority = req.query.priority;
  }

  const pagination = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10
  };

  const result = await projectService.getProjects(userId, filters, pagination);

  res.status(200).json({
    success: true,
    message: 'Projects retrieved successfully',
    data: result
  });
});

/**
 * Get active projects
 */
const getActiveProjects = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const projects = await projectService.getActiveProjects(userId);

  res.status(200).json({
    success: true,
    message: 'Active projects retrieved successfully',
    data: { projects }
  });
});

/**
 * Get single project by ID
 */
const getProjectById = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { projectId } = req.params;

  const project = await projectService.getProjectById(userId, projectId);

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Project retrieved successfully',
    data: { project }
  });
});

/**
 * Update project
 */
const updateProject = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { projectId } = req.params;
  const updateData = req.body;

  const project = await projectService.updateProject(userId, projectId, updateData);

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Project updated successfully',
    data: { project }
  });
});

/**
 * Archive project
 */
const archiveProject = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { projectId } = req.params;

  const project = await projectService.archiveProject(userId, projectId);

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Project archived successfully',
    data: { project }
  });
});

/**
 * Complete project
 */
const completeProject = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { projectId } = req.params;

  const project = await projectService.completeProject(userId, projectId);

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Project completed successfully',
    data: { project }
  });
});

/**
 * Reopen project
 */
const reopenProject = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { projectId } = req.params;

  const project = await projectService.reopenProject(userId, projectId);

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Project reopened successfully',
    data: { project }
  });
});

/**
 * Delete project
 */
const deleteProject = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { projectId } = req.params;

  const deleted = await projectService.deleteProject(userId, projectId);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Project archived successfully',
    data: {}
  });
});

/**
 * Add milestone to project
 */
const addMilestone = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { projectId } = req.params;
  const milestoneData = req.body;

  const project = await projectService.addMilestone(userId, projectId, milestoneData);

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Milestone added successfully',
    data: { project }
  });
});

/**
 * Update milestone
 */
const updateMilestone = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { projectId, milestoneId } = req.params;
  const updateData = req.body;

  const project = await projectService.updateMilestone(userId, projectId, milestoneId, updateData);

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project or milestone not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Milestone updated successfully',
    data: { project }
  });
});

/**
 * Delete milestone
 */
const deleteMilestone = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { projectId, milestoneId } = req.params;

  const deleted = await projectService.deleteMilestone(userId, projectId, milestoneId);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: 'Project or milestone not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Milestone deleted successfully',
    data: {}
  });
});

/**
 * Get project tasks
 */
const getProjectTasks = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { projectId } = req.params;
  const filters = {};

  // Add filters if provided
  if (req.query.status) {
    filters.status = req.query.status;
  }
  if (req.query.priority) {
    filters.priority = req.query.priority;
  }
  if (req.query.milestone) {
    filters.milestone = req.query.milestone;
  }
  if (req.query.from) {
    filters.from = req.query.from;
  }
  if (req.query.to) {
    filters.to = req.query.to;
  }

  const pagination = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10
  };

  const result = await projectService.getProjectTasks(userId, projectId, filters, pagination);

  if (!result) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Project tasks retrieved successfully',
    data: result
  });
});

/**
 * Get project goals
 */
const getProjectGoals = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { projectId } = req.params;
  const year = req.query.year ? parseInt(req.query.year) : undefined;
  const month = req.query.month ? parseInt(req.query.month) : undefined;

  const goals = await projectService.getProjectGoals(userId, projectId, year, month);

  if (goals === null) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Project goals retrieved successfully',
    data: { goals }
  });
});

/**
 * Get project summary
 */
const getProjectSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { projectId } = req.params;

  const summary = await projectService.getProjectSummary(userId, projectId);

  if (!summary) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Project summary retrieved successfully',
    data: { summary }
  });
});

/**
 * Get project work summary
 */
const getProjectWorkSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { projectId } = req.params;

  const summary = await projectService.getProjectWorkSummary(userId, projectId);

  if (!summary) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Project work summary retrieved successfully',
    data: { summary }
  });
});

module.exports = {
  createProject,
  getProjects,
  getActiveProjects,
  getProjectById,
  updateProject,
  archiveProject,
  completeProject,
  reopenProject,
  deleteProject,
  addMilestone,
  updateMilestone,
  deleteMilestone,
  getProjectTasks,
  getProjectGoals,
  getProjectSummary,
  getProjectWorkSummary
};