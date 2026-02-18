describe('Dynamic Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules(); // clears the cache
    process.env = { ...originalEnv }; // reset env vars
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should use default values when env vars are not set', () => {
    // Ensure relevant env vars are unset
    delete process.env.RATE_LIMIT_GENERAL_MAX;
    delete process.env.MAX_TOPUP_AMOUNT;

    const { config } = require('@/lib/config');

    expect(config.rateLimit.generalMax).toBe(100);
    expect(config.transactionLimits.maxTopupAmount).toBe(10000);
  });

  it('should use environment variables when set', () => {
    process.env.RATE_LIMIT_GENERAL_MAX = '500';
    process.env.MAX_TOPUP_AMOUNT = '20000';

    const { config } = require('@/lib/config');

    expect(config.rateLimit.generalMax).toBe(500);
    expect(config.transactionLimits.maxTopupAmount).toBe(20000);
  });

  it('should fallback to default when env var is invalid', () => {
    process.env.RATE_LIMIT_GENERAL_MAX = 'invalid-number';

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const { config } = require('@/lib/config');

    expect(config.rateLimit.generalMax).toBe(100);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid value for RATE_LIMIT_GENERAL_MAX')
    );
    
    consoleSpy.mockRestore();
  });
});
