"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const rampUpMetric_1 = require("../rampUpMetric"); // Replace with the actual module name
const git = __importStar(require("isomorphic-git")); // You might need to mock this for GitHub repo cloning
const fs = __importStar(require("fs"));
const path_1 = __importDefault(require("path"));
// Mock isomorphic-git functions for repository cloning
jest.mock('isomorphic-git', () => ({
    clone: jest.fn(),
}));
describe('Ramp-up Metric Tests', () => {
    afterEach(() => {
        nock_1.default.cleanAll();
        jest.clearAllMocks();
    });
    describe('calculateGitRampUpMetric', () => {
        it('should calculate ramp-up metric successfully with large README', () => __awaiter(void 0, void 0, void 0, function* () {
            const owner = 'testOwner';
            const repo = 'testRepo';
            const token = 'fakeToken';
            const cloneDir = path_1.default.join('/tmp', `${owner}-${repo}`);
            // Mock GitHub repo clone (assuming success)
            git.clone.mockResolvedValueOnce(undefined);
            // Mock README.md file reading with large content
            jest.spyOn(fs.promises, 'readFile').mockResolvedValueOnce('A'.repeat(100 * 1024)); // Large README (100 KB)
            const result = yield (0, rampUpMetric_1.calculateGitRampUpMetric)(owner, repo, token);
            expect(result[0]).toBe(1); // Full score for large README
            expect(result[1]).toBeGreaterThan(0); // Latency should be a positive number
        }));
        it('should calculate ramp-up metric with small README', () => __awaiter(void 0, void 0, void 0, function* () {
            const owner = 'testOwner';
            const repo = 'testRepo';
            const token = 'fakeToken';
            // Mock GitHub repo clone
            git.clone.mockResolvedValueOnce(undefined);
            // Mock README.md file reading with small content
            jest.spyOn(fs.promises, 'readFile').mockResolvedValueOnce('Small README'); // Small README
            const result = yield (0, rampUpMetric_1.calculateGitRampUpMetric)(owner, repo, token);
            expect(result[0]).toBe(0.3); // Score for small README
        }));
        it('should return 0 if the repository has no README', () => __awaiter(void 0, void 0, void 0, function* () {
            const owner = 'testOwner';
            const repo = 'testRepo';
            const token = 'fakeToken';
            // Mock GitHub repo clone
            git.clone.mockResolvedValueOnce(undefined);
            // Mock a missing README.md
            jest.spyOn(fs.promises, 'readFile').mockRejectedValueOnce(new Error('File not found'));
            const result = yield (0, rampUpMetric_1.calculateGitRampUpMetric)(owner, repo, token);
            expect(result[0]).toBe(0); // No README should give 0 score
        }));
    });
    describe('calculateNpmRampUpMetric', () => {
        it('should calculate ramp-up metric for npm package with GitHub repo', () => __awaiter(void 0, void 0, void 0, function* () {
            const packageName = 'test-package';
            // Mock the npm API request for download stats
            (0, nock_1.default)('https://api.npmjs.org')
                .get(`/downloads/point/last-month/${packageName}`)
                .reply(200, {
                downloads: 5000,
            });
            // Mock the npm registry API request for package metadata (with GitHub repo URL)
            (0, nock_1.default)('https://registry.npmjs.org')
                .get(`/${packageName}`)
                .reply(200, {
                repository: {
                    url: 'git+https://github.com/testOwner/testRepo.git',
                },
            });
            // Mock GitHub repo ramp-up metric calculation
            git.clone.mockResolvedValueOnce(undefined);
            jest.spyOn(fs.promises, 'readFile').mockResolvedValueOnce('A'.repeat(50 * 1024)); // Medium README
            const result = yield (0, rampUpMetric_1.calculateNpmRampUpMetric)(packageName);
            expect(result.rampup).toBe(0.7); // Based on the medium README
            expect(result.latency).toBeGreaterThan(0); // Latency should be recorded
        }));
        it('should return a perfect ramp-up score if no GitHub repository is found', () => __awaiter(void 0, void 0, void 0, function* () {
            const packageName = 'test-package';
            // Mock the npm API request for download stats
            (0, nock_1.default)('https://api.npmjs.org')
                .get(`/downloads/point/last-month/${packageName}`)
                .reply(200, {
                downloads: 5000,
            });
            // Mock the npm registry API request (no GitHub repository)
            (0, nock_1.default)('https://registry.npmjs.org')
                .get(`/${packageName}`)
                .reply(200, {
                repository: null,
            });
            const result = yield (0, rampUpMetric_1.calculateNpmRampUpMetric)(packageName);
            expect(result.rampup).toBe(1); // Perfect score if no GitHub repo is found
        }));
        it('should return -1 if an error occurs while calculating npm ramp-up', () => __awaiter(void 0, void 0, void 0, function* () {
            const packageName = 'non-existent-package';
            // Mock the npm API request to return a 404 error
            (0, nock_1.default)('https://api.npmjs.org')
                .get(`/downloads/point/last-month/${packageName}`)
                .reply(404, {});
            const result = yield (0, rampUpMetric_1.calculateNpmRampUpMetric)(packageName);
            expect(result.rampup).toBe(-1); // Error case should return -1
        }));
    });
});
