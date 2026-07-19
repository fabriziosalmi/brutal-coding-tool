import { describe, expect, it } from 'vitest';
import { runAudit } from './geminiService';

describe('runAudit (BYO-key guard)', () => {
  it('throws when no API key is supplied, without touching the network', async () => {
    // The key must come from the caller (the UI). There is no build-time /
    // process.env fallback, so an empty key fails fast before any API call.
    await expect(
      runAudit('https://github.com/owner/repo', 'context', ''),
    ).rejects.toThrow(/Gemini API key is required/);
  });
});
