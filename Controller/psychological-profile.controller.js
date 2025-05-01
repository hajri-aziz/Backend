const PsychologicalProfile = require('../Models/psychological-profile.model');
const TestRecommendation = require('../Models/test-recommendation.model');

// CRUD Operations
const createProfile = async (req, res) => {
    try {
        const newProfile = new PsychologicalProfile({
            ...req.body,
            UserId: req.User._id,
            anonymousId: `prof_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            metadata: {
                status: 'draft',
                completionPercentage: 0,
                version: 1
            }
        });
        const savedProfile = await newProfile.save();
        res.status(201).json(savedProfile);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getAllProfiles = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const query = { 'metadata.status': { $ne: 'archived' } };
        
        if (req.query.status) {
            query['metadata.status'] = req.query.status;
        }

        const profiles = await PsychologicalProfile.find(query)
            .populate('UserId', 'username email')
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await PsychologicalProfile.countDocuments(query);

        res.json({
            profiles,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getProfileById = async (req, res) => {
    try {
        const profile = await PsychologicalProfile.findById(req.params.id)
            .populate('UserId', 'username email')
            .populate('traits.traitId', 'name category')
            .populate('recommendations');

        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        // Check if the profile is private and if the user has access
        if (profile.privacySettings?.isPublic === false && 
            profile.UserId._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const updatedData = {
            ...req.body,
            'metadata.version': req.body.metadata?.version + 1 || 1,
            updatedAt: new Date()
        };

        const profile = await PsychologicalProfile.findById(req.params.id);
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        // Check if user has permission to update
        if (profile.UserId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const updatedProfile = await PsychologicalProfile.findByIdAndUpdate(
            req.params.id,
            updatedData,
            { new: true, runValidators: true }
        ).populate('UserId', 'username email');

        res.json(updatedProfile);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteProfile = async (req, res) => {
    try {
        const profile = await PsychologicalProfile.findById(req.params.id);
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        // Check if user has permission to delete
        if (profile.UserId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        await PsychologicalProfile.findByIdAndDelete(req.params.id);
        res.json({ message: 'Profile deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Additional Methods
const getProfilesByUser = async (req, res) => {
    try {
        const profiles = await PsychologicalProfile.find({ 
            UserId: req.params.UserId,
            'metadata.status': { $ne: 'archived' }
        })
        .populate('traits.traitId', 'name category')
        .sort({ updatedAt: -1 });

        res.json(profiles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getProfileHistory = async (req, res) => {
    try {
        const profile = await PsychologicalProfile.findById(req.params.id);
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        res.json({
            assessmentHistory: profile.assessmentHistory,
            metadata: profile.metadata
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getProfileRecommendations = async (req, res) => {
    try {
        const profile = await PsychologicalProfile.findById(req.params.id)
            .populate('recommendations');
        
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        res.json(profile.recommendations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updatePrivacySettings = async (req, res) => {
    try {
        const profile = await PsychologicalProfile.findById(req.params.id);
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        if (profile.UserId.toString() !== req.User._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        profile.privacySettings = {
            ...profile.privacySettings,
            ...req.body,
            accessToken: req.body.isPublic ? undefined : Math.random().toString(36).substr(2, 15)
        };

        await profile.save();
        res.json({ message: 'Privacy settings updated successfully', profile });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const addTraitScore = async (req, res) => {
    try {
        const profile = await PsychologicalProfile.findById(req.params.id);
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        if (profile.UserId.toString() !== req.User._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        profile.traitScores.push({
            trait: req.body.traitId,
            score: req.body.score,
            confidence: req.body.confidence,
            assessedAt: new Date()
        });

        // Update completion percentage
        const totalTraits = profile.traitScores.length;
        const scoredTraits = profile.traitScores.filter(ts => ts.score != null).length;
        profile.metadata.completionPercentage = (scoredTraits / totalTraits) * 100;

        if (profile.metadata.completionPercentage === 100) {
            profile.metadata.status = 'complete';
        }

        await profile.save();
        res.json(profile);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getProfilesStats = async (req, res) => {
    try {
        const stats = await PsychologicalProfile.aggregate([
            {
                $group: {
                    _id: '$metadata.status',
                    count: { $sum: 1 },
                    avgCompletion: { $avg: '$metadata.completionPercentage' }
                }
            }
        ]);

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
module.exports ={
    createProfile,
    getAllProfiles,
    getProfileById,
    updateProfile,
    deleteProfile,
    getProfilesByUser,
    getProfileHistory,
    getProfileRecommendations,
    updatePrivacySettings,
    addTraitScore,
    getProfilesStats
}