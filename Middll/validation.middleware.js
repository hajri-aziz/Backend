const { validationResult } = require('express-validator');

const validationMiddleware = {
  validateRequest: (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: errors.array()[0].msg
      });
    }
    next();
  },

  handleMongooseError: (err, req, res, next) => {
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        error: Object.values(err.errors)[0].message
      });
    }
    if (err.code === 11000) {
      return res.status(400).json({
        error: 'Duplicate key error'
      });
    }
    next(err);
  },

  errorHandler: (error, req, res, next) => {
    console.error('Error:', error);

    res.status(error.status || 500).json({
      error: error.message || 'Internal server error'
    });
  }
};

module.exports = validationMiddleware;