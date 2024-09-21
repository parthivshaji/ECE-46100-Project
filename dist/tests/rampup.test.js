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
const rampUpMetric_1 = require("../rampUpMetric"); // Replace with your module path
const GITHUB_API_BASE = 'https://api.github.com';
const NPM_API_BASE = 'https://registry.npmjs.org';
describe('Ramp-up Metrics', () => {
    afterEach(() => {
        nock_1.default.cleanAll();
    });
    describe('calculateGitRampUpMetric', () => {
        it('should return correct ramp-up score for a large README', () => __awaiter(void 0, void 0, void 0, function* () {
            const owner = 'owner';
            const repo = 'repo';
            const token = 'fake-token';
            // Mock GitHub API response for README
            (0, nock_1.default)(GITHUB_API_BASE)
                .get(`/repos/${owner}/${repo}/contents/README.md`)
                .reply(200, 'a'.repeat(60 * 1024), { 'Content-Length': '60' }); // Large README
            const [rampupScore, latency] = yield (0, rampUpMetric_1.calculateGitRampUpMetric)(owner, repo, token);
            expect(rampupScore).toBe(1); // 10/10 for large README
            expect(latency).toBeGreaterThan(0);
        }));
        it('should return correct ramp-up score for a small README', () => __awaiter(void 0, void 0, void 0, function* () {
            const owner = 'owner';
            const repo = 'repo';
            const token = 'fake-token';
            // Mock GitHub API response for small README
            (0, nock_1.default)(GITHUB_API_BASE)
                .get(`/repos/${owner}/${repo}/contents/README.md`)
                .reply(200, 'Small README content');
            const [rampupScore, latency] = yield (0, rampUpMetric_1.calculateGitRampUpMetric)(owner, repo, token);
            expect(rampupScore).toBe(0.3); // 3/10 for small README
            expect(latency).toBeGreaterThan(0);
        }));
        it('should return 0 score if README is not found', () => __awaiter(void 0, void 0, void 0, function* () {
            const owner = 'owner';
            const repo = 'repo';
            const token = 'fake-token';
            // Mock GitHub API to return 404 for README not found
            (0, nock_1.default)(GITHUB_API_BASE)
                .get(`/repos/${owner}/${repo}/contents/README.md`)
                .reply(404);
            const [rampupScore, latency] = yield (0, rampUpMetric_1.calculateGitRampUpMetric)(owner, repo, token);
            expect(rampupScore).toBe(0); // No README found, score is 0
            expect(latency).toBeGreaterThan(0);
        }));
        it('should handle API errors', () => __awaiter(void 0, void 0, void 0, function* () {
            const owner = 'owner';
            const repo = 'repo';
            const token = 'fake-token';
            // Mock GitHub API to return 500 server error
            (0, nock_1.default)(GITHUB_API_BASE)
                .get(`/repos/${owner}/${repo}/contents/README.md`)
                .reply(500);
            const [rampupScore, latency] = yield (0, rampUpMetric_1.calculateGitRampUpMetric)(owner, repo, token);
            expect(rampupScore).toBe(0); // Error case should return 0 score
            expect(latency).toBeGreaterThan(0);
        }));
    });
    describe('calculateNpmRampUpMetric', () => {
        it('should calculate ramp-up for an npm package with a GitHub repo', () => __awaiter(void 0, void 0, void 0, function* () {
            const packageName = 'test-package';
            const owner = 'owner';
            const repo = 'repo';
            // Mock npm API to return download stats
            (0, nock_1.default)('https://api.npmjs.org')
                .get(`/downloads/point/last-month/${packageName}`)
                .reply(200, { downloads: 10000 });
            // Mock npm registry API to return repository URL
            (0, nock_1.default)(NPM_API_BASE)
                .get(`/${packageName}`)
                .reply(200, {
                repository: {
                    url: `git+https://github.com/${owner}/${repo}.git`,
                },
            });
            // Mock GitHub API response for README
            (0, nock_1.default)(GITHUB_API_BASE)
                .get(`/repos/${owner}/${repo}/contents/README.md`)
                .reply(200, 'a'.repeat(60 * 1024)); // Large README
            const result = yield (0, rampUpMetric_1.calculateNpmRampUpMetric)(packageName);
            expect(result.rampup).toBe(1); // 10/10 for large README, ramp-up score is 1
            expect(result.latency).toBeGreaterThan(0);
        }));
        it('should handle npm package without GitHub repo', () => __awaiter(void 0, void 0, void 0, function* () {
            const packageName = 'test-package';
            // Mock npm API to return download stats
            (0, nock_1.default)('https://api.npmjs.org')
                .get(`/downloads/point/last-month/${packageName}`)
                .reply(200, { downloads: 10000 });
            // Mock npm registry API to return no repository URL
            (0, nock_1.default)(NPM_API_BASE)
                .get(`/${packageName}`)
                .reply(200, {
                repository: {},
            });
            const result = yield (0, rampUpMetric_1.calculateNpmRampUpMetric)(packageName);
            expect(result.rampup).toBe(1); // No GitHub repo, assume perfect ramp-up
            expect(result.latency).toBeGreaterThan(0);
        }));
        it('should handle errors in npm package ramp-up calculation', () => __awaiter(void 0, void 0, void 0, function* () {
            const packageName = 'test-package';
            // Mock npm API to return error
            (0, nock_1.default)('https://api.npmjs.org')
                .get(`/downloads/point/last-month/${packageName}`)
                .reply(500);
            const result = yield (0, rampUpMetric_1.calculateNpmRampUpMetric)(packageName);
            expect(result.rampup).toBe(-1); // Error case should return -1 score
            expect(result.latency).toBeGreaterThan(0);
        }));
    });
});
