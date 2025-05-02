class BaseController {
  constructor(model) {
    this.model = model;
  }

  // Create a new document
  create = async (req, res, next) => {
    try {
      const doc = await this.model.create({
        ...req.body,
        metadata: {
          ...req.body.metadata,
          createdBy: req.user?._id
        }
      });

      res.status(201).json(doc);
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          message: 'Validation Error',
          errors: Object.values(error.errors).map(err => err.message)
        });
      }
      next(error);
    }
  };

  // Get all documents with pagination and filtering
  getAll = async (req, res, next) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const skip = (page - 1) * limit;
      
      // Build query
      let query = { 'metadata.status': { $ne: 'archived' } };
      
      // Add filters if provided
      if (req.query.category) {
        query.category = req.query.category;
      }

      // Execute query with pagination
      const [docs, total] = await Promise.all([
        this.model
          .find(query)
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 }),
        this.model.countDocuments(query)
      ]);

      res.status(200).json({
        data: docs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  };

  // Get a single document by ID
  getOne = async (req, res, next) => {
    try {
      const doc = await this.model.findById(req.params.id);
      
      if (!doc) {
        return res.status(404).json({
          message: 'Document not found'
        });
      }

      res.status(200).json(doc);
    } catch (error) {
      next(error);
    }
  };

  // Update a document
  update = async (req, res, next) => {
    try {
      const doc = await this.model.findById(req.params.id);

      if (!doc) {
        return res.status(404).json({
          message: 'Document not found'
        });
      }

      Object.assign(doc, req.body);
      await doc.save();

      res.status(200).json(doc);
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          message: 'Validation Error',
          errors: Object.values(error.errors).map(err => err.message)
        });
      }
      next(error);
    }
  };

  // Delete a document (soft delete)
  delete = async (req, res, next) => {
    try {
      const doc = await this.model.findById(req.params.id);

      if (!doc) {
        return res.status(404).json({
          message: 'Document not found'
        });
      }

      doc.metadata = {
        ...doc.metadata,
        status: 'archived'
      };
      await doc.save();

      res.status(200).json(doc);
    } catch (error) {
      next(error);
    }
  };

  // Restore a soft-deleted document
  restore = async (req, res, next) => {
    try {
      const doc = await this.model.findById(req.params.id);

      if (!doc) {
        return res.status(404).json({
          message: 'Document not found'
        });
      }

      doc.metadata = {
        ...doc.metadata,
        status: 'active'
      };
      await doc.save();

      res.status(200).json(doc);
    } catch (error) {
      next(error);
    }
  };
}
module.exports ={
  BaseController,
  create: (model) => new BaseController(model).create,
  getAll: (model) => new BaseController(model).getAll,
  getOne: (model) => new BaseController(model).getOne,
  update: (model) => new BaseController(model).update,
  delete: (model) => new BaseController(model).delete,
  restore: (model) => new BaseController(model).restore
}
module.exports = BaseController;