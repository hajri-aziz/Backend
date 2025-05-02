const TestSession = require('../Models/test-session.model');
//const User = require('../Models/User');
const Test = require('../Models/test.model');
const Question = require('../Models/question.model');
const PersonalityTrait = require('../Models/personality-trait.model');
const TestScoringAlgorithm = require('../Models/test-scoring-algorithm.model');
const PsychologicalProfile = require('../Models/psychological-profile.model');

// @desc    Get all test sessions
exports.getAllTestSessions = async (req, res) => {
  try {
    const sessions = await TestSession.find()
      .populate('userId', 'firstName lastName email')
      .populate('testId', 'name categoryId')
      .populate('answers.questionId', 'text options')
      .populate('traitScores.traitId', 'name description')
      .sort({ createdAt: -1 });

    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single test session by ID
exports.getTestSessionById = async (req, res) => {
  try {
    const session = await TestSession.findById(req.params.id)
      .populate('userId')
      .populate('testId')
      .populate('answers.questionId')
      .populate('traitScores.traitId');

    if (!session) {
      return res.status(404).json({ message: 'Test session not found' });
    }

    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new test session
exports.createTestSession = async (req, res) => {
  try {
    const newSession = new TestSession({
      ...req.body,
      updatedAt: Date.now()
    });

    const savedSession = await newSession.save();
    
    // Populate references after creation
    const populatedSession = await TestSession.populate(savedSession, [
      { path: 'userId' },
      { path: 'testId' },
      { path: 'answers.questionId' }
    ]);

    res.status(201).json(populatedSession);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update test session
exports.updateTestSession = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedAt: Date.now()
    };

    const updatedSession = await TestSession.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('userId')
      .populate('testId')
      .populate('answers.questionId')
      .populate('traitScores.traitId');

    if (!updatedSession) {
      return res.status(404).json({ message: 'Test session not found' });
    }

    res.status(200).json(updatedSession);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete test session
exports.deleteTestSession = async (req, res) => {
  try {
    const deletedSession = await TestSession.findByIdAndDelete(req.params.id);
    
    if (!deletedSession) {
      return res.status(404).json({ message: 'Test session not found' });
    }

    res.status(200).json({ 
      message: 'Test session deleted successfully',
      deletedId: deletedSession._id 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get sessions by user
exports.getSessionsByUser = async (req, res) => {
  try {
    const sessions = await TestSession.find({ userId: req.params.userId })
      .populate('testId', 'name duration')
      .sort({ startTime: -1 });

    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get sessions by status
exports.getSessionsByStatus = async (req, res) => {
  try {
    const status = req.params.status.toUpperCase();
    const validStatuses = ['IN_PROGRESS', 'COMPLETED', 'ABANDONED'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const sessions = await TestSession.find({ status })
      .populate('userId', 'firstName lastName')
      .populate('testId', 'name')
      .sort({ updatedAt: -1 });

    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit test session answers and calculate scores
exports.submitTestSession = async (req, res) => {
  try {
    const session = await TestSession.findById(req.params.id)
      .populate('testId')
      .populate('answers.questionId');

    if (!session) {
      return res.status(404).json({ message: 'Test session not found' });
    }

    if (session.status === 'COMPLETED') {
      return res.status(400).json({ message: 'Session already completed' });
    }

    // Get scoring algorithm
    const scoringAlgorithm = await TestScoringAlgorithm.findOne({
      testId: session.testId._id
    });

    if (!scoringAlgorithm) {
      return res.status(404).json({ message: 'Scoring algorithm not found' });
    }

    // Calculate trait scores (implementation depends on your scoring logic)
    const traitScores = await calculateTraitScores(
      session.answers,
      scoringAlgorithm
    );

    // Update session
    session.answers = req.body.answers;
    session.traitScores = traitScores;
    session.endTime = Date.now();
    session.status = 'COMPLETED';
    session.updatedAt = Date.now();

    const updatedSession = await session.save();
    
    // Update psychological profile
    await PsychologicalProfile.findOneAndUpdate(
      { UserId: session.UserId },
      { $set: { traitScores } },
      { upsert: true, new: true }
    );

    res.status(200).json(updatedSession);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Helper function for score calculation
async function calculateTraitScores(answers, algorithm) {
  // Implement your specific scoring logic here
  // This is a placeholder implementation
  const traitScoresMap = new Map();

  algorithm.algorithm.traitCalculations.forEach((traitCalc) => {
    let score = 0;
    
    traitCalc.questions.forEach((q) => {
      const answer = answers.find(a => a.questionId.equals(q.questionId));
      if (answer) {
        score += answer.selectedOption * q.weight;
      }
    });

    // Normalize score
    const normalized = ((score - traitCalc.normalization.min) / 
                      (traitCalc.normalization.max - traitCalc.normalization.min)) * 100;

    traitScoresMap.set(traitCalc.traitId.toString(), {
      score: normalized,
      interpretation: getInterpretation(normalized)
    });
  });

  return Array.from(traitScoresMap).map(([traitId, data]) => ({
    traitId,
    score: data.score,
    interpretation: data.interpretation
  }));
}

function getInterpretation(score) {
  if (score < 33) return 'Low';
  if (score < 66) return 'Average';
  return 'High';
}

