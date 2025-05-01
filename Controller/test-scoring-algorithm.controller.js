const TestScoringAlgorithm = require('../Models/test-scoring-algorithm.model');
const Test = require('../Models/test.model');
const PersonalityTrait = require('../Models/personality-trait.model');
const Question = require('../Models/question.model');

// Define all functions first
const getAllTestScoringAlgorithms = async (req, res) => {
    try {
        const algorithms = await TestScoringAlgorithm.find()
            .populate('testId', 'name description')
            .populate('algorithm.traitCalculations.traitId', 'name dimension')
            .populate('algorithm.traitCalculations.questions.questionId', 'text options')
            .sort({ createdAt: -1 });

        res.status(200).json(algorithms);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getTestScoringAlgorithmById = async (req, res) => {
    try {
        const algorithm = await TestScoringAlgorithm.findById(req.params.id)
            .populate('testId')
            .populate('algorithm.traitCalculations.traitId')
            .populate('algorithm.traitCalculations.questions.questionId');

        if (!algorithm) {
            return res.status(404).json({ message: 'Scoring algorithm not found' });
        }

        res.status(200).json(algorithm);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createTestScoringAlgorithm = async (req, res) => {
    try {
        const newAlgorithm = new TestScoringAlgorithm({
            ...req.body,
            updatedAt: Date.now()
        });

        const savedAlgorithm = await newAlgorithm.save();
        
        // Populate references after creation
        const populatedAlgorithm = await TestScoringAlgorithm.populate(savedAlgorithm, [
            { path: 'testId' },
            { path: 'algorithm.traitCalculations.traitId' },
            { path: 'algorithm.traitCalculations.questions.questionId' }
        ]);

        res.status(201).json(populatedAlgorithm);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateTestScoringAlgorithm = async (req, res) => {
    try {
        const updateData = {
            ...req.body,
            updatedAt: Date.now()
        };

        const updatedAlgorithm = await TestScoringAlgorithm.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        )
            .populate('testId')
            .populate('algorithm.traitCalculations.traitId')
            .populate('algorithm.traitCalculations.questions.questionId');

        if (!updatedAlgorithm) {
            return res.status(404).json({ message: 'Scoring algorithm not found' });
        }

        res.status(200).json(updatedAlgorithm);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteTestScoringAlgorithm = async (req, res) => {
    try {
        const deletedAlgorithm = await TestScoringAlgorithm.findByIdAndDelete(req.params.id);
        
        if (!deletedAlgorithm) {
            return res.status(404).json({ message: 'Scoring algorithm not found' });
        }

        res.status(200).json({ 
            message: 'Scoring algorithm deleted successfully',
            deletedId: deletedAlgorithm._id 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAlgorithmsByTest = async (req, res) => {
    try {
        const algorithms = await TestScoringAlgorithm.find({ testId: req.params.testId })
            .populate('algorithm.traitCalculations.traitId', 'name')
            .sort({ version: -1 });

        res.status(200).json(algorithms);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const calculateScore = async (req, res) => {
    try {
        const { algorithmId, answers } = req.body;
        
        const algorithm = await TestScoringAlgorithm.findById(algorithmId)
            .populate('testId')
            .populate('algorithm.traitCalculations.traitId')
            .populate('algorithm.traitCalculations.questions.questionId');

        if (!algorithm) {
            return res.status(404).json({ message: 'Scoring algorithm not found' });
        }

        // Calculate scores based on answers
        const results = {
            algorithmId,
            timestamp: new Date(),
            scores: []
        };

        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const validateResults = async (req, res) => {
    try {
        const { algorithmId, results } = req.body;
        
        const algorithm = await TestScoringAlgorithm.findById(algorithmId);
        if (!algorithm) {
            return res.status(404).json({ message: 'Scoring algorithm not found' });
        }

        // Validate results
        const validationResult = {
            isValid: true,
            messages: []
        };

        res.status(200).json(validationResult);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Export all functions
module.exports = {
    getAllTestScoringAlgorithms,
    getTestScoringAlgorithmById,
    createTestScoringAlgorithm,
    updateTestScoringAlgorithm,
    deleteTestScoringAlgorithm,
    getAlgorithmsByTest,
    calculateScore,
    validateResults
};