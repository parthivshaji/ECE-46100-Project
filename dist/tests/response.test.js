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
const responsivenessMetric_1 = require("../responsivenessMetric"); // Adjust path as needed
// Mock GitHub and npm API URLs
const GITHUB_API_URL = 'https://api.github.com';
const NPM_API_URL = 'https://registry.npmjs.org';
describe('Responsiveness Metrics', () => {
    afterEach(() => {
        nock_1.default.cleanAll(); // Clean up mocks after each test
    });
    describe('GitHub Responsiveness', () => {
        it('should calculate responsiveness metric for a GitHub repository', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock GitHub issues endpoint
            (0, nock_1.default)(GITHUB_API_URL)
                .get('/repos/test-owner/test-repo/issues')
                .query({ state: 'all', per_page: 100, page: 1 })
                .reply(200, [
                // One issue closes in 1 day, another in 2 days
                { number: 1, created_at: '2022-01-01T00:00:00Z', closed_at: '2022-01-02T00:00:00Z' },
                { number: 2, created_at: '2022-01-01T00:00:00Z', closed_at: '2022-01-03T00:00:00Z' },
            ]);
            // Mock individual GitHub issue details (though not needed as both are returned in the first request)
            (0, nock_1.default)(GITHUB_API_URL)
                .get('/repos/test-owner/test-repo/issues/1')
                .reply(200, { created_at: '2022-01-01T00:00:00Z', closed_at: '2022-01-02T00:00:00Z' });
            (0, nock_1.default)(GITHUB_API_URL)
                .get('/repos/test-owner/test-repo/issues/2')
                .reply(200, { created_at: '2022-01-01T00:00:00Z', closed_at: '2022-01-03T00:00:00Z' });
            // Expected: average response time = (1 day + 2 days) / 2 = 1.5 days; max response time = 2 days
            const result = yield (0, responsivenessMetric_1.calculateGitResponsiveness)('test-owner', 'test-repo', 'fake-github-token');
            // Responsiveness: 1 - (average / max) = 1 - (1.5 / 365) = 0.25
            expect(result[0]).toBeCloseTo(0.995, 2);
        }));
        it('should return 0 when there are no valid response times', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock GitHub issues endpoint but no valid response times
            (0, nock_1.default)(GITHUB_API_URL)
                .get('/repos/test-owner/test-repo/issues')
                .query({ state: 'all', per_page: 100, page: 1 })
                .reply(200, []); // No issues
            const result = yield (0, responsivenessMetric_1.calculateGitResponsiveness)('test-owner', 'test-repo', 'fake-github-token');
            expect(result[0]).toBe(0); // No valid response times
        }));
        it('should handle failure when fetching GitHub issues gracefully', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock GitHub issues endpoint to fail
            (0, nock_1.default)(GITHUB_API_URL)
                .get('/repos/test-owner/test-repo/issues')
                .query({ state: 'all', per_page: 100, page: 1 })
                .reply(403); // Forbidden error
            const result = yield (0, responsivenessMetric_1.calculateGitResponsiveness)('test-owner', 'test-repo', 'fake-github-token');
            expect(result[0]).toBe(0); // Responsiveness should be 0 on failure
        }));
    });
    describe('npm Responsiveness', () => {
        it('should calculate responsiveness metric for an npm package linked to GitHub', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock npm registry metadata
            (0, nock_1.default)(NPM_API_URL)
                .get('/test-package')
                .reply(200, {
                repository: { url: 'https://github.com/test-owner/test-repo.git' },
            });
            // Mock GitHub issues endpoint for linked repo
            (0, nock_1.default)(GITHUB_API_URL)
                .get('/repos/test-owner/test-repo/issues')
                .query({ state: 'all', per_page: 100, page: 1 })
                .reply(200, [
                { number: 1, created_at: '2022-01-01T00:00:00Z', closed_at: '2022-01-02T00:00:00Z' },
            ]);
            (0, nock_1.default)(GITHUB_API_URL)
                .get('/repos/test-owner/test-repo/issues/1')
                .reply(200, { created_at: '2022-01-01T00:00:00Z', closed_at: '2022-01-02T00:00:00Z' });
            const result = yield (0, responsivenessMetric_1.calculateNpmResponsiveness)('test-package');
            expect(result.responsiveness).toBeCloseTo(1); // Perfect responsiveness (1 day for closure)
        }));
        it('should return responsiveness as 1 if no GitHub repository is linked', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock npm registry metadata without a GitHub repository
            (0, nock_1.default)(NPM_API_URL)
                .get('/test-package')
                .reply(200, {});
            const result = yield (0, responsivenessMetric_1.calculateNpmResponsiveness)('test-package');
            expect(result.responsiveness).toBe(1); // Assume perfect responsiveness without GitHub repo
        }));
        it('should handle failure when fetching npm metadata gracefully', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock npm registry metadata failure
            (0, nock_1.default)(NPM_API_URL)
                .get('/test-package')
                .reply(500); // Internal server error
            const result = yield (0, responsivenessMetric_1.calculateNpmResponsiveness)('test-package');
            expect(result.responsiveness).toBe(-1); // Responsiveness should be -1 on failure
        }));
    });
});
