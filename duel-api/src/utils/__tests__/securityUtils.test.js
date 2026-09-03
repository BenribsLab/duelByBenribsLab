const { sanitizeForResponse } = require('../safeData');
const { createTrackingToken, verifyTrackingToken } = require('../trackingToken');
const { detectImageType } = require('../../middleware/upload');
const { validateSecurityConfig } = require('../../config/security');

describe('security utilities', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'u'.repeat(40);
    process.env.TRACKING_SECRET = 't'.repeat(40);
  });

  test('removes secrets recursively from API responses', () => {
    const result = sanitizeForResponse({
      id: 1,
      passwordHash: 'secret',
      nested: [{ pseudo: 'alice', otpCode: '123456', pushToken: 'fcm' }]
    });
    expect(result).toEqual({ id: 1, nested: [{ pseudo: 'alice' }] });
  });

  test('accepts a valid invitation token and rejects tampering', () => {
    const token = createTrackingToken(42, Date.now() + 60_000);
    expect(verifyTrackingToken(token).invitationId).toBe(42);
    expect(verifyTrackingToken(`${token}x`)).toBeNull();
  });

  test('rejects expired invitation tokens', () => {
    const token = createTrackingToken(42, Date.now() - 1);
    expect(verifyTrackingToken(token)).toBeNull();
  });

  test('detects images from their bytes, not their filename', () => {
    const png = Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), Buffer.alloc(8)]);
    expect(detectImageType(png)).toEqual({ extension: '.png', mime: 'image/png' });
    expect(detectImageType(Buffer.from('<script>alert(1)</script>'))).toBeNull();
  });

  test('refuses weak production secrets', () => {
    const previousEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'short';
    expect(() => validateSecurityConfig()).toThrow(/Secrets absents ou trop courts/);
    process.env.NODE_ENV = previousEnv;
  });
});
