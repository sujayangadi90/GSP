const FollowUp = require('../models/FollowUp');

// @desc    Get all follow-ups with date filter
// @route   GET /api/followups
// @access  Private/Admin
const getFollowUps = async (req, res) => {
  try {
    const { fromDate, toDate, category } = req.query;

    let query = {};
    if (category) {
      query.category = category;
    }
    if (fromDate && toDate) {
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
      .populate({
        path: 'amc',
        populate: [
          { path: 'customer' },
          { path: 'appliance' }
        ]
      })
      .sort({ dueAt: 1 });

    res.json(followUps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a custom follow-up manually
// @route   POST /api/followups
// @access  Private/Admin
const createFollowUp = async (req, res) => {
  try {
    const { category, dueAt, ticket, amc, noteText } = req.body;
    const followUp = new FollowUp({
      category: category || 'service',
      dueAt,
      ticket: ticket || undefined,
      amc: amc || undefined,
      status: 'new'
    });

    if (noteText) {
      followUp.notes = [{
        text: noteText,
        author: req.user ? req.user.name : 'Admin'
      }];
    }

    const saved = await followUp.save();
    const populated = await FollowUp.findById(saved._id)
      .populate({
        path: 'ticket',
        populate: { path: 'dealer', select: 'name code mobile email' }
      })
      .populate({
        path: 'amc',
        populate: [{ path: 'customer' }, { path: 'appliance' }]
      });

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a note to a follow-up notes thread
// @route   POST /api/followups/:id/notes
// @access  Private/Admin
const addFollowUpNote = async (req, res) => {
  try {
    const { text } = req.body;
    const followUp = await FollowUp.findById(req.params.id);
    if (!followUp) {
      return res.status(404).json({ message: 'Follow-up not found' });
    }

    followUp.notes.push({
      text,
      author: req.user ? req.user.name : 'Admin'
    });

    await followUp.save();

    const populated = await FollowUp.findById(req.params.id)
      .populate({
        path: 'ticket',
        populate: { path: 'dealer', select: 'name code mobile email' }
      })
      .populate({
        path: 'amc',
        populate: [{ path: 'customer' }, { path: 'appliance' }]
      });

    res.json(populated);
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
    await followUp.save();

    const populated = await FollowUp.findById(req.params.id)
      .populate({
        path: 'ticket',
        populate: { path: 'dealer', select: 'name code mobile email' }
      })
      .populate({
        path: 'amc',
        populate: [{ path: 'customer' }, { path: 'appliance' }]
      });

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getFollowUps,
  createFollowUp,
  addFollowUpNote,
  closeFollowUp
};
