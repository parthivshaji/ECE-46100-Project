import nock from 'nock';
import * as bm from '../BusFactor';
import { calculateBusFactor } from '../BusFactor'; // Adjust path as needed
// Mock GitHub API URL
const GITHUB_API_URL = 'https://api.github.com';

describe('Bus Factor Metrics', () => {
    afterEach(() => {
        nock.cleanAll(); // Clean any mocks after each test
    });

    describe('GitHub Bus Factor', () => {
        it('should calculate Bus Factor for a GitHub repository', async () => {
            // Mock GitHub contributors endpoint
            nock(GITHUB_API_URL, {
                reqheaders: {
                    authorization: 'token ' + process.env.GITHUB_TOKEN || '',
                    'user-agent': 'axios/1.7.7',
                }
            })
            .get('/repos/test-owner/test-repo/contributors')
            .reply(200, [
                { login: 'user1' },
                { login: 'user2' }
            ]);

            const { busFactor } = await calculateBusFactor('test-owner', 'test-repo', process.env.GITHUB_TOKEN || '');
            expect(busFactor).toBeCloseTo(0.5, 2); // (1 / 2 contributors) = 0.5
        });

        it('should return Bus Factor as 0 when there are no contributors', async () => {
            // Mock GitHub contributors endpoint with no contributors
            nock(GITHUB_API_URL, {
                reqheaders: {
                    authorization: 'token ' + process.env.GITHUB_TOKEN || '',
                    'user-agent': 'axios/1.7.7',
                }
            })
            .get('/repos/test-owner/test-repo/contributors')
            .reply(200, []);

            const { busFactor } = await calculateBusFactor('test-owner', 'test-repo', process.env.GITHUB_TOKEN || '');
            expect(busFactor).toBe(0); // Bus Factor should be 0 if no contributors
        });

        it('should handle errors gracefully', async () => {
            // Mock GitHub contributors endpoint to return an error
            nock(GITHUB_API_URL)
            .get('/repos/test-owner/test-repo/contributors')
            .reply(404);

            const { busFactor } = await calculateBusFactor('test-owner', 'test-repo', process.env.GITHUB_TOKEN || '');
            expect(busFactor).toBe(-1); // Should return -1 on error
        });
    });

    describe('npm Bus Factor', () => {
        it('should calculate Bus Factor for an npm package', async () => {
            // Mock npm package info endpoint
            nock('https://registry.npmjs.org')
            .get('/test-package')
            .reply(200, {
                repository: { url: 'https://github.com/test-owner/test-repo' }
            });

            // Mock GitHub contributors endpoint
            nock(GITHUB_API_URL, {
                reqheaders: {
                    authorization: 'token ' + process.env.GITHUB_TOKEN || '',
                    'user-agent': 'axios/1.7.7',
                }
            })
            .get('/repos/test-owner/test-repo/contributors')
            .reply(200, [
                { login: 'user1' },
                { login: 'user2' }
            ]);

            const { busFactor } = await bm.calculateNpmBusFactor('test-package');
            expect(busFactor).toBeCloseTo(0.5, 2); // (1 / 2 contributors) = 0.5
        });

        it('should return Bus Factor as 0 when no GitHub repo is found', async () => {
            // Mock npm package info endpoint without repository
            nock('https://registry.npmjs.org')
            .get('/test-package')
            .reply(200, {});

            const { busFactor } = await bm.calculateNpmBusFactor('test-package');
            expect(busFactor).toBe(0); // Default to 0 if no GitHub repo is found
        });

        it('should handle errors gracefully for npm package', async () => {
            // Mock npm package info endpoint to return an error
            nock('https://registry.npmjs.org')
            .get('/test-package')
            .reply(404);

            const { busFactor } = await bm.calculateNpmBusFactor('test-package');
            expect(busFactor).toBe(-1); // Should return -1 on error
        });
    });
});
