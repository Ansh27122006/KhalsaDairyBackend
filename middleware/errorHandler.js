/**
 * Global Express error handler.
 * Mirrors the try/catch + ErrorResponseDTO pattern from Spring Boot controllers.
 * Shape: { error: string, message: string }
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
    return res.status(400).json({ error: 'VALIDATION_ERROR', message });
  }

  // Mongoose duplicate key (e.g. unique phone)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      error: 'DUPLICATE_ERROR',
      message: `${field} already exists`,
    });
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'INVALID_ID',
      message: `Invalid value for ${err.path}`,
    });
  }

  // Default
  res.status(err.statusCode || 500).json({
    error: err.error || 'INTERNAL_ERROR',
    message: err.message || 'Something went wrong',
  });
};

module.exports = errorHandler;
