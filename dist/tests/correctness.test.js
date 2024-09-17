"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nock_1 = __importDefault(require("nock"));
const correctnessMetric_1 = require("../correctnessMetric"); // Adjust path as needed
// Mock GitHub and npm API URLs
const GITHUB_API_URL = 'https://api.github.com';
const NPM_API_URL = 'https://registry.npmjs.org';
describe('Correctness Metrics', () => {
    afterEach(() => {
        nock_1.default.cleanAll(); // Clean any mocks after each test
    });
    describe('GitHub Correctness', () => {
        it('should calculate correctness metric for a GitHub repository', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock GitHub issues endpoint
            (0, nock_1.default)(GITHUB_API_URL, {
                reqheaders: {
                    accept: 'application/json, text/plain, */*', // Only match the essential headers
                    authorization: 'token ' + process.env.GITHUB_TOKEN || '',
                    'user-agent': 'axios/1.7.7',
                    'accept-encoding': 'gzip, compress, deflate, br'
                }
            })
                .get('/repos/test-owner/test-repo/issues')
                .query({ labels: 'bug', state: 'all' }) // Ensure the query matches exactly
                .reply(200, [
                { id: 1, title: 'Bug 1' },
                { id: 2, title: 'Bug 2' }
            ]);
            // Mock GitHub repository endpoint (for stargazers count)
            (0, nock_1.default)(GITHUB_API_URL)
                .get('/repos/test-owner/test-repo')
                .reply(200, {
                stargazers_count: 100
            });
            const correctness = yield (0, correctnessMetric_1.calculateGitHubCorrectness)('test-owner', 'test-repo', process.env.GITHUB_TOKEN || '');
            expect(correctness.correctness).toBeCloseTo(0.98, 2); // (1 - (2/100)) = 0.98
        }));
        it('should return correctness as 1 when there are no stars', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock GitHub issues endpoint
            (0, nock_1.default)(GITHUB_API_URL, {
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
            (0, nock_1.default)(GITHUB_API_URL)
                .get('/repos/test-owner/test-repo')
                .reply(200, {
                stargazers_count: 0
            });
            const correctness = yield (0, correctnessMetric_1.calculateGitHubCorrectness)('test-owner', 'test-repo', process.env.GITHUB_TOKEN || '');
            expect(correctness.correctness).toBe(1); // Default to 1 if popularity is 0
        }));
    });
    describe('npm Correctness', () => {
        it('should calculate correctness metric for an npm package', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock npm package details endpoint
            (0, nock_1.default)(NPM_API_URL)
                .get('/test-package')
                .reply(200, {
                repository: { url: 'https://github.com/test-owner/test-repo' }
            });
            (0, nock_1.default)(GITHUB_API_URL)
                .get('/repos/test-owner/test-repo')
                .reply(200, {
                stargazers_count: 1000
            });
            // Mock GitHub issues for the linked repo
            (0, nock_1.default)(GITHUB_API_URL, {
                reqheaders: {
                    accept: 'application/json, text/plain, */*',
                }
            })
                .get('/repos/test-owner/test-repo/issues')
                .query({ labels: 'bug', state: 'all' })
                .reply(200, [
                { id: 1, title: 'Bug 1' }
            ]);
            const correctness = yield (0, correctnessMetric_1.calculateNpmCorrectness)('test-package');
            expect(correctness.correctness).toBeCloseTo(0.999, 3); // (1 - (1/1000)) = 0.999
        }));
        it('should return correctness as 1 when there are no downloads', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock npm package details endpoint
            (0, nock_1.default)(NPM_API_URL)
                .get('/test-package')
                .reply(200, {
                repository: { url: 'https://github.com/test-owner/test-repo' }
            });
            // Mock GitHub repository endpoint with 0 stars
            (0, nock_1.default)(GITHUB_API_URL)
                .get('/repos/test-owner/test-repo')
                .reply(200, {
                stargazers_count: 0
            });
            // Mock GitHub issues for the linked repo
            (0, nock_1.default)(GITHUB_API_URL, {
                reqheaders: {
                    accept: 'application/json, text/plain, */*',
                }
            })
                .get('/repos/test-owner/test-repo/issues')
                .query({ labels: 'bug', state: 'all' })
                .reply(200, [
                { id: 1, title: 'Bug 1' }
            ]);
            const correctness = yield (0, correctnessMetric_1.calculateNpmCorrectness)('test-package');
            expect(correctness.correctness).toBe(1); // Default to 1 if downloads are 0
        }));
    });
});
