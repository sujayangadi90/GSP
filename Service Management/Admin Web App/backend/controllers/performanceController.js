const PerformanceArea = require('../models/PerformanceArea');
const PerformanceEvaluation = require('../models/PerformanceEvaluation');
const User = require('../models/User');

const DEFAULT_AREAS = [
  { name: 'Punctuality', description: 'Arriving on time for service tickets and meetings', order: 1 },
  { name: 'Ticket Closure', description: 'Efficiency and timeliness in closing assigned service tickets', order: 2 },
  { name: 'Customer Complaints', description: 'Low complaint rate and resolving customer escalations', order: 3 },
  { name: 'Customer Feedback / Rating', description: 'Direct ratings and satisfaction reviews from customers', order: 4 },
  { name: 'Quality of Service', description: 'Workmanship standards and first-time-fix rate', order: 5 },
  { name: 'Attendance', description: 'Regular availability, duty attendance, and leave management', order: 6 },
  { name: 'Professional Behaviour', description: 'Grooming, uniform, customer communication, and conduct', order: 7 },
  { name: 'Technical Knowledge', description: 'Expertise with appliance models, diagnostics, and tools', order: 8 }
];

const MONTH_ORDER = {
  'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
  'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
};

const calculatePerformanceBand = (score) => {
  if (score >= 9.0) return 'Excellent';
  if (score >= 7.5) return 'Good';
  if (score >= 5.0) return 'Average';
  return 'Needs Improvement';
};

// @desc    Get all active performance areas (auto-seeds defaults if empty)
// @route   GET /api/performance/areas
// @access  Private
const getAreas = async (req, res) => {
  try {
    let areas = await PerformanceArea.find().sort({ order: 1, createdAt: 1 });
    if (areas.length === 0) {
      await PerformanceArea.insertMany(DEFAULT_AREAS);
      areas = await PerformanceArea.find().sort({ order: 1, createdAt: 1 });
    }
    res.json(areas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new performance area
// @route   POST /api/performance/areas
// @access  Private/Admin
const createArea = async (req, res) => {
  try {
    const { name, description, weight, order } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Performance area name is required' });
    }

    const existing = await PerformanceArea.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (existing) {
      return res.status(400).json({ message: 'Performance area already exists' });
    }

    const area = await PerformanceArea.create({
      name: name.trim(),
      description: description || '',
      weight: Number(weight) || 1,
      order: Number(order) || 0
    });

    res.status(201).json(area);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update performance area
// @route   PUT /api/performance/areas/:id
// @access  Private/Admin
const updateArea = async (req, res) => {
  try {
    const area = await PerformanceArea.findById(req.params.id);
    if (!area) {
      return res.status(404).json({ message: 'Performance area not found' });
    }

    const { name, description, weight, isActive, order } = req.body;
    if (name) area.name = name.trim();
    if (description !== undefined) area.description = description;
    if (weight !== undefined) area.weight = Number(weight);
    if (isActive !== undefined) area.isActive = Boolean(isActive);
    if (order !== undefined) area.order = Number(order);

    const updated = await area.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete or toggle performance area
// @route   DELETE /api/performance/areas/:id
// @access  Private/Admin
const deleteArea = async (req, res) => {
  try {
    const area = await PerformanceArea.findById(req.params.id);
    if (!area) {
      return res.status(404).json({ message: 'Performance area not found' });
    }
    await PerformanceArea.findByIdAndDelete(req.params.id);
    res.json({ message: 'Performance area deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all evaluations with filters
// @route   GET /api/performance/evaluations
// @access  Private
const getEvaluations = async (req, res) => {
  try {
    const { technician, month, year, status, search, minScore, maxScore } = req.query;
    let query = {};

    if (technician) {
      query.technician = technician;
    }
    if (month) {
      query.month = month;
    }
    if (year) {
      query.year = Number(year);
    }
    if (status && status !== 'all') {
      query.status = status;
    }
    if (search) {
      const s = search.toLowerCase();
      query.$or = [
        { technicianName: { $regex: s, $options: 'i' } },
        { technicianCode: { $regex: s, $options: 'i' } },
        { evaluatedBy: { $regex: s, $options: 'i' } }
      ];
    }
    if (minScore !== undefined || maxScore !== undefined) {
      query.finalScore = {};
      if (minScore !== undefined && minScore !== '') query.finalScore.$gte = Number(minScore);
      if (maxScore !== undefined && maxScore !== '') query.finalScore.$lte = Number(maxScore);
    }

    const evaluations = await PerformanceEvaluation.find(query)
      .populate('technician', 'name code mobile email')
      .sort({ year: -1, createdAt: -1 });

    res.json(evaluations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get evaluation by ID
// @route   GET /api/performance/evaluations/:id
// @access  Private
const getEvaluationById = async (req, res) => {
  try {
    const evaluation = await PerformanceEvaluation.findById(req.params.id)
      .populate('technician', 'name code mobile email appliances');
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }
    res.json(evaluation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new monthly evaluation
// @route   POST /api/performance/evaluations
// @access  Private/Admin
const createEvaluation = async (req, res) => {
  try {
    const { technicianId, month, year, ratings, remarks, status } = req.body;

    if (!technicianId || !month || !year || !ratings || !Array.isArray(ratings) || ratings.length === 0) {
      return res.status(400).json({ message: 'Please provide technician, month, year, and area ratings' });
    }

    const tech = await User.findById(technicianId);
    if (!tech) {
      return res.status(404).json({ message: 'Technician not found' });
    }

    // Check for existing evaluation in the same month/year
    const existing = await PerformanceEvaluation.findOne({
      technician: technicianId,
      month: month.trim(),
      year: Number(year)
    });
    if (existing) {
      return res.status(400).json({
        message: `Evaluation for ${tech.name} for ${month} ${year} already exists (${existing.status.toUpperCase()})`
      });
    }

    // Calculate score
    const totalRating = ratings.reduce((sum, r) => sum + Math.min(10, Math.max(1, Number(r.rating) || 1)), 0);
    const finalScore = Math.round((totalRating / ratings.length) * 10) / 10;
    const performanceBand = calculatePerformanceBand(finalScore);

    const isFinalizing = status === 'finalized';

    const evaluation = new PerformanceEvaluation({
      technician: tech._id,
      technicianName: tech.name,
      technicianCode: tech.code || '',
      month: month.trim(),
      year: Number(year),
      ratings: ratings.map(r => ({
        areaId: r.areaId || null,
        areaName: r.areaName || 'General',
        rating: Math.min(10, Math.max(1, Number(r.rating) || 1)),
        comments: r.comments || ''
      })),
      finalScore,
      performanceBand,
      status: isFinalizing ? 'finalized' : 'draft',
      remarks: remarks || '',
      evaluatedBy: req.user ? req.user.name : 'Admin',
      evaluatedByUserId: req.user ? req.user._id : null,
      finalizedAt: isFinalizing ? new Date() : null,
      finalizedBy: isFinalizing ? (req.user ? req.user.name : 'Admin') : null
    });

    const saved = await evaluation.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update evaluation
// @route   PUT /api/performance/evaluations/:id
// @access  Private/Admin
const updateEvaluation = async (req, res) => {
  try {
    const evaluation = await PerformanceEvaluation.findById(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    // Check locking if already finalized unless admin is saving/editing
    const { ratings, remarks, status, unlock } = req.body;

    if (evaluation.status === 'finalized' && !unlock && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Evaluation is finalized and locked from editing' });
    }

    if (ratings && Array.isArray(ratings) && ratings.length > 0) {
      evaluation.ratings = ratings.map(r => ({
        areaId: r.areaId || null,
        areaName: r.areaName || 'General',
        rating: Math.min(10, Math.max(1, Number(r.rating) || 1)),
        comments: r.comments || ''
      }));

      const totalRating = evaluation.ratings.reduce((sum, r) => sum + r.rating, 0);
      evaluation.finalScore = Math.round((totalRating / evaluation.ratings.length) * 10) / 10;
      evaluation.performanceBand = calculatePerformanceBand(evaluation.finalScore);
    }

    if (remarks !== undefined) evaluation.remarks = remarks;

    if (status) {
      if (status === 'finalized' && evaluation.status !== 'finalized') {
        evaluation.status = 'finalized';
        evaluation.finalizedAt = new Date();
        evaluation.finalizedBy = req.user ? req.user.name : 'Admin';
      } else if (status === 'draft') {
        evaluation.status = 'draft';
      }
    }

    const updated = await evaluation.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Finalize evaluation
// @route   PATCH /api/performance/evaluations/:id/finalize
// @access  Private/Admin
const finalizeEvaluation = async (req, res) => {
  try {
    const evaluation = await PerformanceEvaluation.findById(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    evaluation.status = 'finalized';
    evaluation.finalizedAt = new Date();
    evaluation.finalizedBy = req.user ? req.user.name : 'Admin';

    const updated = await evaluation.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Unlock evaluation (Admin only)
// @route   PATCH /api/performance/evaluations/:id/unlock
// @access  Private/Admin
const unlockEvaluation = async (req, res) => {
  try {
    const evaluation = await PerformanceEvaluation.findById(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    evaluation.status = 'draft';
    const updated = await evaluation.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete evaluation
// @route   DELETE /api/performance/evaluations/:id
// @access  Private/Admin
const deleteEvaluation = async (req, res) => {
  try {
    const evaluation = await PerformanceEvaluation.findById(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }
    await PerformanceEvaluation.findByIdAndDelete(req.params.id);
    res.json({ message: 'Evaluation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get technician performance profile with history trend and area breakdown
// @route   GET /api/performance/technician/:techId/summary
// @access  Private
const getTechnicianPerformanceProfile = async (req, res) => {
  try {
    const tech = await User.findById(req.params.techId).select('-password');
    if (!tech) {
      return res.status(404).json({ message: 'Technician not found' });
    }

    const evaluations = await PerformanceEvaluation.find({ technician: req.params.techId })
      .sort({ year: 1, createdAt: 1 });

    // Sort chronologically by year and month
    const sortedEvaluations = [...evaluations].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return (MONTH_ORDER[a.month] || 0) - (MONTH_ORDER[b.month] || 0);
    });

    const totalEvaluations = sortedEvaluations.length;
    const avgScore = totalEvaluations > 0
      ? Math.round((sortedEvaluations.reduce((sum, e) => sum + e.finalScore, 0) / totalEvaluations) * 10) / 10
      : 0;

    // Monthly score progression
    const monthlyTrend = sortedEvaluations.map(e => ({
      id: e._id,
      month: e.month,
      year: e.year,
      label: `${e.month.substring(0, 3)} ${e.year}`,
      finalScore: e.finalScore,
      performanceBand: e.performanceBand,
      status: e.status
    }));

    // Area-wise breakdown averages
    const areaMap = {};
    sortedEvaluations.forEach(ev => {
      ev.ratings.forEach(r => {
        if (!areaMap[r.areaName]) {
          areaMap[r.areaName] = { total: 0, count: 0, areaName: r.areaName };
        }
        areaMap[r.areaName].total += r.rating;
        areaMap[r.areaName].count += 1;
      });
    });

    const areaAverages = Object.values(areaMap).map(a => ({
      areaName: a.areaName,
      averageRating: Math.round((a.total / a.count) * 10) / 10,
      evaluationsCount: a.count
    }));

    res.json({
      technician: tech,
      totalEvaluations,
      lifetimeAverageScore: avgScore,
      currentBand: calculatePerformanceBand(avgScore),
      monthlyTrend,
      areaAverages,
      evaluations: sortedEvaluations.reverse() // latest first for logs
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAreas,
  createArea,
  updateArea,
  deleteArea,
  getEvaluations,
  getEvaluationById,
  createEvaluation,
  updateEvaluation,
  finalizeEvaluation,
  unlockEvaluation,
  deleteEvaluation,
  getTechnicianPerformanceProfile
};
