const { validationResult } = require('express-validator');

/**
 * Middleware que lee los errores de express-validator
 * y devuelve un 400 si hay alguno.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

module.exports = validate;
