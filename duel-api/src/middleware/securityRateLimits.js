const rateLimit = require('express-rate-limit');

function limiter(windowMs, max) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test',
    message: { success: false, error: 'Trop de tentatives, veuillez réessayer plus tard.' }
  });
}

module.exports = {
  registerLimiter: limiter(60 * 60 * 1000, 5),
  loginLimiter: limiter(15 * 60 * 1000, 10),
  otpVerifyLimiter: limiter(15 * 60 * 1000, 10),
  adminLoginLimiter: limiter(15 * 60 * 1000, 5),
  invitationLimiter: limiter(60 * 60 * 1000, 10)
};
