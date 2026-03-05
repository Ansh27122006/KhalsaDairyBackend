/**
 * Wraps an async controller function and forwards any errors to Express's
 * next() — eliminating try/catch boilerplate in every route handler.
 *
 * Usage:  router.get('/', asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
