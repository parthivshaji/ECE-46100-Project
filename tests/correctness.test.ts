import nock from 'nock';
import { calculateGitHubCorrectness, calculateNpmCorrectness } from '../src/correctnessMetric'; // Adjust path as needed

// Mock GitHub and npm API URLs
const GITHUB_API_URL = 'https://api.github.com';
const NPM_API_URL = 'https://registry.npmjs.org';

describe('Correctness Metrics', () => {
    afterEach(() => {
        nock.cleanAll(); // Clean any mocks after each test
    });

    describe('GitHub Correctness', () => {
        it('should calculate correctness metric for a GitHub repository', async () => {
            // Mock GitHub issues endpoint
            nock(GITHUB_API_URL, {
                reqheaders: {
                    accept: 'application/json, text/plain, */*', // Only match the essential headers
                    authorization: 'token ' + process.env.GITHUB_TOKEN || '',
                    'user-agent': 'axios/1.7.7',
                    'accept-encoding': 'gzip, compress, deflate, br'
                }
            })
            .get('/repos/test-owner/test-repo/issues')
            .query({ labels: 'bug', state: 'all' })  // Ensure the query matches exactly
            .reply(200, [
                { id: 1, title: 'Bug 1' },
                { id: 2, title: 'Bug 2' }
            ]);

            // Mock GitHub repository endpoint (for stargazers count)
            nock(GITHUB_API_URL)
            .get('/repos/test-owner/test-repo')
            .reply(200, {
                stargazers_count: 100
            });

            const correctness = await calculateGitHubCorrectness('test-owner', 'test-repo', process.env.GITHUB_TOKEN || '');
            expect(correctness.correctness).toBeCloseTo(0.98, 2); // (1 - (2/100)) = 0.98
        });

        it('should return correctness as 1 when there are no stars', async () => {
            // Mock GitHub issues endpoint
            nock(GITHUB_API_URL, {
                reqheaders: {
                    accept: 'application/json, text/plain, */*', // Only match the essential headers
                    authorization: 'token ' + process.env.GITHUB_TOKEN || '',
                    'user-agent': 'axios/1.7.7',
                    'accept-encoding': 'gzip, compress, deflate, br'
                }
            })
            .get('/repos/test-owner/test-repo/issues')
            .query({ labels: 'bug', state: 'all' })
            .reply(200, [
                { id: 1, title: 'Bug 1' },
                { id: 2, title: 'Bug 2' }
            ]);

            // Mock GitHub repository endpoint with 0 stars
            nock(GITHUB_API_URL)
            .get('/repos/test-owner/test-repo')
            .reply(200, {
                stargazers_count: 0
            });

            const correctness = await calculateGitHubCorrectness('test-owner', 'test-repo', process.env.GITHUB_TOKEN || '');
            expect(correctness.correctness).toBe(1); // Default to 1 if popularity is 0
        });
    });

    describe('npm Correctness', () => {
        it('should calculate correctness metric for an npm package', async () => {
            // Mock npm package details endpoint
            nock(NPM_API_URL)
            .get('/test-package')
            .reply(200, {
                repository: { url: 'https://github.com/test-owner/test-repo' }
            });

            nock(GITHUB_API_URL)
            .get('/repos/test-owner/test-repo')
            .reply(200, {
                stargazers_count: 1000
            });

            // Mock GitHub issues for the linked repo
            nock(GITHUB_API_URL, {
                reqheaders: {
                    accept: 'application/json, text/plain, */*',
                }
            })
            .get('/repos/test-owner/test-repo/issues')
            .query({ labels: 'bug', state: 'all' })
            .reply(200, [
                { id: 1, title: 'Bug 1' }
            ]);

            const correctness = await calculateNpmCorrectness('test-package');
            expect(correctness.correctness).toBeCloseTo(0.999, 3); // (1 - (1/1000)) = 0.999
        });

        it('should return correctness as 1 when there are no downloads', async () => {
            // Mock npm package details endpoint
            nock(NPM_API_URL)
            .get('/test-package')
            .reply(200, {
                repository: { url: 'https://github.com/test-owner/test-repo' }
            });

            // Mock GitHub repository endpoint with 0 stars
            nock(GITHUB_API_URL)
            .get('/repos/test-owner/test-repo')
            .reply(200, {
                stargazers_count: 0
            });

            // Mock GitHub issues for the linked repo
            nock(GITHUB_API_URL, {
                reqheaders: {
                    accept: 'application/json, text/plain, */*',
                }
            })
            .get('/repos/test-owner/test-repo/issues')
            .query({ labels: 'bug', state: 'all' })
            .reply(200, [
                { id: 1, title: 'Bug 1' }
            ]);

            const correctness = await calculateNpmCorrectness('test-package');
            expect(correctness.correctness).toBe(1); // Default to 1 if downloads are 0
        });
    });
});