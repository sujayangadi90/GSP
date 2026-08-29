const User = require('../models/User');

// @desc    Get all dealers
// @route   GET /api/dealers
// @access  Private/Admin
const getDealers = async (req, res) => {
  try {
    const { search } = req.query;
    let query = { role: 'dealer' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }

    const dealers = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json(dealers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add new dealer
// @route   POST /api/dealers
// @access  Private/Admin
const addDealer = async (req, res) => {
  const { name, contactPerson, mobile, email, address, city, password } = req.body;

  try {
    const dealerExists = await User.findOne({ email });
    if (dealerExists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Generate unique Dealer Code (e.g. DLR-1001)
    const lastDealer = await User.findOne({ role: 'dealer' }, {}, { sort: { 'createdAt': -1 } });
    let nextNum = 1001;
    if (lastDealer && lastDealer.code) {
      const match = lastDealer.code.match(/\d+/);
      if (match) {
        nextNum = parseInt(match[0], 10) + 1;
      }
    }
    const code = `DLR-${nextNum}`;

    const dealer = await User.create({
      name,
      contactPerson,
      mobile,
      email,
      address,
      city,
      password: password || 'dealer@123', // default password if not provided
      role: 'dealer',
      code
    });

    res.status(201).json({
      _id: dealer._id,
      name: dealer.name,
      code: dealer.code,
      email: dealer.email
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update dealer
// @route   PUT /api/dealers/:id
// @access  Private/Admin
const updateDealer = async (req, res) => {
  try {
    const dealer = await User.findById(req.params.id);
    if (!dealer || dealer.role !== 'dealer') {
      return res.status(404).json({ message: 'Dealer not found' });
    }

    dealer.name = req.body.name || dealer.name;
    dealer.contactPerson = req.body.contactPerson || dealer.contactPerson;
    dealer.mobile = req.body.mobile || dealer.mobile;
    dealer.email = req.body.email || dealer.email;
    dealer.address = req.body.address || dealer.address;
    dealer.city = req.body.city || dealer.city;

    if (req.body.password) {
      dealer.password = req.body.password;
    }

    const updatedDealer = await dealer.save();
    res.json({
      _id: updatedDealer._id,
      name: updatedDealer.name,
      code: updatedDealer.code,
      email: updatedDealer.email,
      mobile: updatedDealer.mobile,
      address: updatedDealer.address,
      city: updatedDealer.city,
      contactPerson: updatedDealer.contactPerson
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle dealer status (active/inactive)
// @route   PATCH /api/dealers/:id/toggle
// @access  Private/Admin
const toggleDealerStatus = async (req, res) => {
  try {
    const dealer = await User.findById(req.params.id);
    if (!dealer || dealer.role !== 'dealer') {
      return res.status(404).json({ message: 'Dealer not found' });
    }

    dealer.status = dealer.status === 'active' ? 'inactive' : 'active';
    await dealer.save();

    res.json({ message: `Dealer account status updated to ${dealer.status}`, status: dealer.status });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const DealerVideo = require('../models/DealerVideo');

// @desc    Get videos for a dealer
// @route   GET /api/dealers/:id/videos
// @access  Private
const getDealerVideos = async (req, res) => {
  try {
    const videos = await DealerVideo.find({ dealer: req.params.id }).sort({ monthYear: -1, createdAt: -1 });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload / add video for a dealer
// @route   POST /api/dealers/:id/videos
// @access  Private/Admin
const uploadDealerVideo = async (req, res) => {
  try {
    const { monthYear, title, description, videoUrl } = req.body;
    if (!monthYear || !title || !videoUrl) {
      return res.status(400).json({ message: 'Month/Year, title, and video file are required' });
    }

    const dealer = await User.findById(req.params.id);
    if (!dealer || dealer.role !== 'dealer') {
      return res.status(404).json({ message: 'Dealer not found' });
    }

    const video = await DealerVideo.create({
      dealer: dealer._id,
      monthYear,
      title,
      description: description || '',
      videoUrl,
      uploadedBy: req.user?._id,
      uploadedByName: req.user?.name || 'Admin'
    });

    res.status(201).json(video);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a dealer video
// @route   DELETE /api/dealers/videos/:videoId
// @access  Private/Admin
const deleteDealerVideo = async (req, res) => {
  try {
    const video = await DealerVideo.findById(req.params.videoId);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    await DealerVideo.findByIdAndDelete(req.params.videoId);
    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  getDealers, 
  addDealer, 
  updateDealer, 
  toggleDealerStatus,
  getDealerVideos,
  uploadDealerVideo,
  deleteDealerVideo
};
