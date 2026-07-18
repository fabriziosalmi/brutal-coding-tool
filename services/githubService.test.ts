import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchGitHubRepoData, formatContext } from './githubService';

describe('formatContext', () => {
  it('renders every named section with the supplied values', () => {
    const out = formatContext({
      fileTree: 'src/index.ts',
      readme: 'Hello World',
      commits: 'abc1234 2025-11-01 [Jane]: init',
      criticalFiles: '--- package.json ---',
      sourceSamples: '--- SOURCE SAMPLE: src/index.ts ---',
    });

    expect(out).toContain('[README]');
    expect(out).toContain('Hello World');
    expect(out).toContain('[COMMITS (Latest 20)]');
    expect(out).toContain('abc1234 2025-11-01 [Jane]: init');
    expect(out).toContain('[FILE TREE]');
    expect(out).toContain('[CRITICAL CONFIG FILES]');
    expect(out).toContain('[ACTUAL SOURCE CODE SAMPLES (FOR INTELLIGENCE CHECK)]');
  });
});

describe('fetchGitHubRepoData', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects a non-GitHub URL before hitting the network', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    await expect(fetchGitHubRepoData('not-a-real-url')).rejects.toThrow(
      /Invalid GitHub URL/,
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('surfaces a clear rate-limit error on HTTP 403', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 403 }),
    );

    await expect(
      fetchGitHubRepoData('https://github.com/owner/repo'),
    ).rejects.toThrow(/403/);
  });
});
