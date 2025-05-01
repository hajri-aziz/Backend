const TestRecommendation = require('../Models/test-recommendation.model');
//const User = require('../Models/User.model');
const Test = require('../Models/test.model');

//  Get all test recommendations
const getAllTestRecommendations = async (req, res) => {
  try {
    const recommendations = await TestRecommendation.find()
      .populate('UserId', 'firstName lastName email')
      .populate('testId', 'name categoryId')
      .populate('recommendedBy', 'firstName lastName role')
      .sort({ createdAt: -1 });

    res.status(200).json(recommendations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single test recommendation by ID
const getTestRecommendationById = async (req, res) => {
  try {
    const recommendation = await TestRecommendation.findById(req.params.id)
      .populate('UserId')
      .populate('testId')
      .populate('recommendedBy');

    if (!recommendation) {
      return res.status(404).json({ message: 'Test recommendation not found' });
    }

    res.status(200).json(recommendation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new test recommendation
const createTestRecommendation = async (req, res) => {
  try {
    const newRecommendation = new TestRecommendation({
      ...req.body,
      updatedAt: Date.now()
    });

    const savedRecommendation = await newRecommendation.save();
    
    // Populate references after saving
    const populatedRecommendation = await TestRecommendation.populate(savedRecommendation, [
      { path: 'UserId' },
      { path: 'testId' },
      { path: 'recommendedBy' }
    ]);

    res.status(201).json(populatedRecommendation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a test recommendation
const updateTestRecommendation = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedAt: Date.now()
    };

    // Handle completed date if status is updated to COMPLETED
    if (req.body.status === 'COMPLETED' && !req.body.completedDate) {
      updateData.completedDate = Date.now();
    }

    const updatedRecommendation = await TestRecommendation.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('UserId')
      .populate('testId')
      .populate('recommendedBy');

    if (!updatedRecommendation) {
      return res.status(404).json({ message: 'Test recommendation not found' });
    }

    res.status(200).json(updatedRecommendation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a test recommendation
const deleteTestRecommendation = async (req, res) => {
  try {
    const deletedRecommendation = await TestRecommendation.findByIdAndDelete(req.params.id);
    
    if (!deletedRecommendation) {
      return res.status(404).json({ message: 'Test recommendation not found' });
    }

    res.status(200).json({ 
      message: 'Test recommendation deleted successfully',
      deletedId: deletedRecommendation._id 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get recommendations by user
const getRecommendationsByUser = async (req, res) => {
  try {
    const recommendations = await TestRecommendation.find({ UserId: req.params.UserId })
      .populate('testId', 'name description duration')
      .populate('recommendedBy', 'firstName lastName')
      .sort({ priority: -1, createdAt: -1 });

    res.status(200).json(recommendations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get recommendations by status
const getRecommendationsByStatus = async (req, res) => {
  try {
    const status = req.params.status.toUpperCase();
    const validStatuses = ['PENDING', 'COMPLETED', 'DECLINED'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const recommendations = await TestRecommendation.find({ status })
      .populate('userId', 'firstName lastName')
      .populate('testId', 'name')
      .sort({ updatedAt: -1 });

    res.status(200).json(recommendations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
module.exports ={
  getAllTestRecommendations,
  getTestRecommendationById,  
  createTestRecommendation,
  updateTestRecommendation,
  deleteTestRecommendation,
  getRecommendationsByUser,
  getRecommendationsByStatus
}