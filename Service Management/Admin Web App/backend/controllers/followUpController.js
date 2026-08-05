const FollowUp = require('../models/FollowUp');

// @desc    Get all follow-ups with date filter
// @route   GET /api/followups
// @access  Private/Admin
const getFollowUps = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    let query = {};
    if (fromDate && toDate) {
      // Set boundary times: start of fromDate to end of toDate
      const start = new Date(fromDate);
      start.setUTCHours(0, 0, 0, 0);

      const end = new Date(toDate);
      end.setUTCHours(23, 59, 59, 999);

      query.dueAt = { $gte: start, $lte: end };
    }

    const followUps = await FollowUp.find(query)
      .populate({
        path: 'ticket',
        populate: {
          path: 'dealer',
          select: 'name code mobile email'
        }
      })
      .sort({ dueAt: 1 });

    res.json(followUps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark follow-up as closed
// @route   PATCH /api/followups/:id/close
// @access  Private/Admin
const closeFollowUp = async (req, res) => {
  try {
    const followUp = await FollowUp.findById(req.params.id);
    if (!followUp) {
      return res.status(404).json({ message: 'Follow-up not found' });
    }

    followUp.status = 'closed';
    followUp.closedAt = new Date();
    const updatedFollowUp = await followUp.save();

    res.json(updatedFollowUp);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getFollowUps,
  closeFollowUp
};
