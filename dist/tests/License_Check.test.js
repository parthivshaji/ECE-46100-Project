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
const License_Check_1 = require("../License_Check"); // Adjust path as needed
// Mock GitHub and npm API URLs
const GITHUB_API_URL = 'https://api.github.com';
const NPM_API_URL = 'https://registry.npmjs.org';
describe('License Metrics', () => {
    afterEach(() => {
        nock_1.default.cleanAll(); // Clean any mocks after each test
    });
    describe('GitHub License Metric', () => {
        it('should calculate license score for a GitHub repository with compatible license', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock GitHub license endpoint
            (0, nock_1.default)(GITHUB_API_URL, {
                reqheaders: {
                    accept: 'application/json, text/plain, */*',
                    authorization: 'token ' + process.env.GITHUB_TOKEN || '',
                    'user-agent': 'axios/1.7.7',
                    'accept-encoding': 'gzip, compress, deflate, br'
                }
            })
                .get('/repos/test-owner/test-repo/license')
                .reply(200, {
                license: { spdx_id: 'MIT' }
            });
            const licenseResult = yield (0, License_Check_1.calculateGitHubLicenseMetric)('test-owner', 'test-repo', process.env.GITHUB_TOKEN || '');
            expect(licenseResult.score).toBe(1); // MIT is a compatible license
        }));
        it('should calculate license score for a GitHub repository with incompatible license', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock GitHub license endpoint
            (0, nock_1.default)(GITHUB_API_URL)
                .get('/repos/test-owner/test-repo/license')
                .reply(200, {
                license: { spdx_id: 'GPL-3.0' } // An incompatible license
            });
            const licenseResult = yield (0, License_Check_1.calculateGitHubLicenseMetric)('test-owner', 'test-repo', process.env.GITHUB_TOKEN || '');
            expect(licenseResult.score).toBe(0); // GPL-3.0 is not compatible with LGPL-2.1
        }));
        it('should return license score as 0 when no license is found', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock GitHub license endpoint with no license
            (0, nock_1.default)(GITHUB_API_URL)
                .get('/repos/test-owner/test-repo/license')
                .reply(404, {});
            const licenseResult = yield (0, License_Check_1.calculateGitHubLicenseMetric)('test-owner', 'test-repo', process.env.GITHUB_TOKEN || '');
            expect(licenseResult.score).toBe(0); // No license means score 0
        }));
    });
    describe('npm License Metric', () => {
        it('should calculate license score for an npm package with GitHub repository', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock npm package details endpoint
            (0, nock_1.default)(NPM_API_URL)
                .get('/test-package')
                .reply(200, {
                repository: { url: 'https://github.com/test-owner/test-repo' }
            });
            // Mock GitHub license endpoint for the repo
            (0, nock_1.default)(GITHUB_API_URL)
                .get('/repos/test-owner/test-repo/license')
                .reply(200, {
                license: { spdx_id: 'Apache-2.0' }
            });
            const licenseResult = yield (0, License_Check_1.calculateNpmLicenseMetric)('test-package');
            expect(licenseResult.score).toBe(1); // Apache-2.0 is compatible with LGPL-2.1
        }));
        it('should return license score as 0 for an npm package with no GitHub repository', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock npm package details without a GitHub repository
            (0, nock_1.default)(NPM_API_URL)
                .get('/test-package')
                .reply(200, {});
            const licenseResult = yield (0, License_Check_1.calculateNpmLicenseMetric)('test-package');
            expect(licenseResult.score).toBe(0); // No GitHub repository means no license check, score is 0
        }));
        it('should return license score as 0 when GitHub repo has an incompatible license', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock npm package details endpoint
            (0, nock_1.default)(NPM_API_URL)
                .get('/test-package')
                .reply(200, {
                repository: { url: 'https://github.com/test-owner/test-repo' }
            });
            // Mock GitHub license endpoint with an incompatible license
            (0, nock_1.default)(GITHUB_API_URL)
                .get('/repos/test-owner/test-repo/license')
                .reply(200, {
                license: { spdx_id: 'GPL-3.0' }
            });
            const licenseResult = yield (0, License_Check_1.calculateNpmLicenseMetric)('test-package');
            expect(licenseResult.score).toBe(0); // GPL-3.0 is not compatible
        }));
    });
});
