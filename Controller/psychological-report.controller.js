const PsychologicalReport = require('../Models/psychological-report.model');

const createReport = async (req, res) => {
  try {
    const newReport = new PsychologicalReport({
      ...req.body,
      updatedAt: new Date()
    });
    const savedReport = await newReport.save();
    res.status(201).json(savedReport);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAllReports = async (req, res) => {
  try {
    const reports = await PsychologicalReport.find()
      .populate('UserId', 'name email')
      .populate('psychologistId', 'name credentials')
      .populate('relatedTests', 'testName date');
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getReportById = async (req, res) => {
  try {
    const report = await PsychologicalReport.findById(req.params.id)
      .populate('UserId', 'name email')
      .populate('psychologistId', 'name credentials')
      .populate('relatedTests', 'testName date results');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateReport = async (req, res) => {
  try {
    const updatedData = {
      ...req.body,
      updatedAt: new Date()
    };

    const updatedReport = await PsychologicalReport.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true, runValidators: true }
    )
    .populate('UserId', 'name email')
    .populate('psychologistId', 'name credentials');

    if (!updatedReport) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.json(updatedReport);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteReport = async (req, res) => {
  try {
    const deletedReport = await PsychologicalReport.findByIdAndDelete(req.params.id);
    if (!deletedReport) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Additional controller methods
const getReportsByUser = async (req, res) => {
  try {
    const reports = await PsychologicalReport.find({ UserId: req.params.UserId })
      .populate('psychologistId', 'name credentials')
      .populate('relatedTests', 'testName date');
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getReportsByPsychologist = async (req, res) => {
  try {
    const reports = await PsychologicalReport.find({ psychologistId: req.params.psychologistId })
      .populate('UserId', 'name email')
      .populate('relatedTests', 'testName date');
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const updatedReport = await PsychologicalReport.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!updatedReport) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.json(updatedReport);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
module.exports ={
  createReport,
  getAllReports,
  getReportById,
  updateReport,
  deleteReport,
  getReportsByUser,
  getReportsByPsychologist,
  updateReportStatus,
};