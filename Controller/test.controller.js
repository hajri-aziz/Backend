const BaseController = require('./base.controller');
const Test = require('../Models/test.model');
const mongoose = require('mongoose');


  // Override getAll to match expected response format
 const getAll = async (req, res, next) => {
    try {
      const { page = 1, limit = 10, category } = req.query;
      const query = { 'metadata.status': { $ne: 'archived' } };

      if (category && mongoose.Types.ObjectId.isValid(category)) {
        query.category = new mongoose.Types(category);
      }

      const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: { createdAt: -1 }
      };

      const result = await Test.paginate(query, options);
      res.json({
        tests: result.docs,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.totalDocs,
          pages: result.totalPages
        }
      });
    } catch (error) {
      next(error);
    }
  };

  // Override create to handle test-specific validation
  const create = async (req, res, next) => {
    try {
      console.log('Request body:', req.body);

      // Check for required fields
      const requiredFields = ['name', 'description', 'type', 'category', 'duration', 'configuration', 'questions', 'scoringAlgorithm'];
      const missingFields = {};
      requiredFields.forEach(field => {
        if (!req.body[field]) {
          missingFields[field] = true;
        }
      });

      if (Object.keys(missingFields).length > 0) {
        console.log('Missing fields:', missingFields);
        return res.status(400).json({
          error: 'Missing required fields',
          missingFields
        });
      }

      if (!mongoose.Types.ObjectId.isValid(req.body.category)) {
        return res.status(400).json({
          error: 'Invalid category ID'
        });
      }

      if (!mongoose.Types.ObjectId.isValid(req.body.scoringAlgorithm)) {
        return res.status(400).json({
          error: 'Invalid scoring algorithm ID'
        });
      }

      // Create test object
      const test = {
        ...req.body,
        category: new mongoose.Types(req.body.category),
        questions: req.body.questions.map(id => new mongoose.Types.String(id)),
        scoringAlgorithm: new mongoose.Types(req.body.scoringAlgorithm),
        traits: [],
        metadata: {
          ...(req.body.metadata || {}), // Preserve existing metadata if provided
          status: 'active',
          version: 1,
          difficulty: 'intermediate',
          validationStatus: 'pending'
        },
        targetTraits: []
      };

      console.log('Test object:', test);

      // Create and save the test
      const savedTest = await Test.create(test);
      res.status(201).json(savedTest);
    } catch (error) {
      console.error('Error creating test:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          error: error.message
        });
      }
      res.status(500).json({
        error: 'Error creating test'
      });
    }
  };

  // @desc    Get all tests
  const getAllTests = async (req, res) => {
    try {
      const tests = await Test.find()
        .populate('categoryId', 'name description')
        .populate('questions', 'text optionsType options')
        .populate('targetTraits', 'name dimension')
        .sort({ createdAt: -1 });

      res.status(200).json(tests);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  // @desc    Get single test by ID
  const getTestById = async (req, res) => {
    try {
      const test = await Test.findById(req.params.id)
        .populate('categoryId')
        .populate('questions')
        .populate('targetTraits');

      if (!test) {
        return res.status(404).json({ message: 'Test not found' });
      }

      res.status(200).json(test);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  // @desc    Update test
  const updateTest = async (req, res) => {
    try {
      const updateData = {
        ...req.body,
        updatedAt: Date.now()
      };

      const updatedTest = await Test.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('categoryId')
        .populate('questions')
        .populate('targetTraits');

      if (!updatedTest) {
        return res.status(404).json({ message: 'Test not found' });
      }

      res.status(200).json(updatedTest);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };

  // @desc    Delete test
  const deleteTest = async (req, res) => {
    try {
      const deletedTest = await Test.findByIdAndDelete(req.params.id);
      
      if (!deletedTest) {
        return res.status(404).json({ message: 'Test not found' });
      }

      res.status(200).json({ 
        message: 'Test deleted successfully',
        deletedId: deletedTest._id 
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  // @desc    Get tests by category
  const getTestsByCategory = async (req, res) => {
    try {
      const tests = await Test.find({ categoryId: req.params.categoryId })
        .populate('questions', 'text')
        .populate('targetTraits', 'name')
        .sort({ title: 1 });

      res.status(200).json(tests);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  // @desc    Toggle test status
  const toggleTestStatus = async (req, res) => {
    try {
      const test = await Test.findById(req.params.id);
      
      if (!test) {
        return res.status(404).json({ message: 'Test not found' });
      }

      test.isActive = !test.isActive;
      test.updatedAt = Date.now();
      
      const updatedTest = await test.save();
      res.status(200).json(updatedTest);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };


module.exports = {
  getAll,  // for GET /
  create,  // for POST /
  getById: getTestById,  // for GET /:id
  update: updateTest,    // for PUT /:id
  delete: deleteTest,    // for DELETE /:id
  getByCategory: getTestsByCategory,
  toggleStatus: toggleTestStatus
};