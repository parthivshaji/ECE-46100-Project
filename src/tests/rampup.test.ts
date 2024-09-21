import nock from 'nock';
import { calculateGitRampUpMetric, calculateNpmRampUpMetric } from '../rampUpMetric'; // Replace with your module path

const GITHUB_API_BASE = 'https://api.github.com';
const NPM_API_BASE = 'https://registry.npmjs.org';

describe('Ramp-up Metrics', () => {
    afterEach(() => {
        nock.cleanAll();
    });

    describe('calculateGitRampUpMetric', () => {
        it('should return correct ramp-up score for a large README', async () => {
            const owner = 'owner';
            const repo = 'repo';
            const token = 'fake-token';

            // Mock GitHub API response for README
            nock(GITHUB_API_BASE)
                .get(`/repos/${owner}/${repo}/contents/README.md`)
                .reply(200, 'a'.repeat(60 * 1024), { 'Content-Length': '60' }); // Large README

            const [rampupScore, latency] = await calculateGitRampUpMetric(owner, repo, token);

            expect(rampupScore).toBe(1); // 10/10 for large README
            expect(latency).toBeGreaterThan(0);
        });

        it('should return correct ramp-up score for a small README', async () => {
            const owner = 'owner';
            const repo = 'repo';
            const token = 'fake-token';

            // Mock GitHub API response for small README
            nock(GITHUB_API_BASE)
                .get(`/repos/${owner}/${repo}/contents/README.md`)
                .reply(200, 'Small README content');

            const [rampupScore, latency] = await calculateGitRampUpMetric(owner, repo, token);

            expect(rampupScore).toBe(0.3); // 3/10 for small README
            expect(latency).toBeGreaterThan(0);
        });

        it('should return 0 score if README is not found', async () => {
            const owner = 'owner';
            const repo = 'repo';
            const token = 'fake-token';

            // Mock GitHub API to return 404 for README not found
            nock(GITHUB_API_BASE)
                .get(`/repos/${owner}/${repo}/contents/README.md`)
                .reply(404);

            const [rampupScore, latency] = await calculateGitRampUpMetric(owner, repo, token);

            expect(rampupScore).toBe(0); // No README found, score is 0
            expect(latency).toBeGreaterThan(0);
        });

        it('should handle API errors', async () => {
            const owner = 'owner';
            const repo = 'repo';
            const token = 'fake-token';

            // Mock GitHub API to return 500 server error
            nock(GITHUB_API_BASE)
                .get(`/repos/${owner}/${repo}/contents/README.md`)
                .reply(500);

            const [rampupScore, latency] = await calculateGitRampUpMetric(owner, repo, token);

            expect(rampupScore).toBe(0); // Error case should return 0 score
            expect(latency).toBeGreaterThan(0);
        });
    });

    describe('calculateNpmRampUpMetric', () => {
        it('should calculate ramp-up for an npm package with a GitHub repo', async () => {
            const packageName = 'test-package';
            const owner = 'owner';
            const repo = 'repo';

            // Mock npm API to return download stats
            nock('https://api.npmjs.org')
                .get(`/downloads/point/last-month/${packageName}`)
                .reply(200, { downloads: 10000 });

            // Mock npm registry API to return repository URL
            nock(NPM_API_BASE)
                .get(`/${packageName}`)
                .reply(200, {
                    repository: {
                        url: `git+https://github.com/${owner}/${repo}.git`,
                    },
                });

            // Mock GitHub API response for README
            nock(GITHUB_API_BASE)
                .get(`/repos/${owner}/${repo}/contents/README.md`)
                .reply(200, 'a'.repeat(60 * 1024)); // Large README

            const result = await calculateNpmRampUpMetric(packageName);

            expect(result.rampup).toBe(1); // 10/10 for large README, ramp-up score is 1
            expect(result.latency).toBeGreaterThan(0);
        });

        it('should handle npm package without GitHub repo', async () => {
            const packageName = 'test-package';

            // Mock npm API to return download stats
            nock('https://api.npmjs.org')
                .get(`/downloads/point/last-month/${packageName}`)
                .reply(200, { downloads: 10000 });

            // Mock npm registry API to return no repository URL
            nock(NPM_API_BASE)
                .get(`/${packageName}`)
                .reply(200, {
                    repository: {},
                });

            const result = await calculateNpmRampUpMetric(packageName);

            expect(result.rampup).toBe(1); // No GitHub repo, assume perfect ramp-up
            expect(result.latency).toBeGreaterThan(0);
        });

        it('should handle errors in npm package ramp-up calculation', async () => {
            const packageName = 'test-package';

            // Mock npm API to return error
            nock('https://api.npmjs.org')
                .get(`/downloads/point/last-month/${packageName}`)
                .reply(500);

            const result = await calculateNpmRampUpMetric(packageName);

            expect(result.rampup).toBe(-1); // Error case should return -1 score
            expect(result.latency).toBeGreaterThan(0);
        });
    });
});
