"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
const bm = __importStar(require("../BusFactor"));
const BusFactor_1 = require("../BusFactor"); // Adjust path as needed
// Mock GitHub API URL
const GITHUB_API_URL = 'https://api.github.com';
describe('Bus Factor Metrics', () => {
    afterEach(() => {
        nock_1.default.cleanAll(); // Clean any mocks after each test
    });
    describe('GitHub Bus Factor', () => {
        it('should calculate Bus Factor for a GitHub repository', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock GitHub contributors endpoint
            (0, nock_1.default)(GITHUB_API_URL, {
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
            const { busFactor } = yield (0, BusFactor_1.calculateBusFactor)('test-owner', 'test-repo', process.env.GITHUB_TOKEN || '');
            expect(busFactor).toBeCloseTo(0.5, 2); // (1 / 2 contributors) = 0.5
        }));
        it('should return Bus Factor as 0 when there are no contributors', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock GitHub contributors endpoint with no contributors
            (0, nock_1.default)(GITHUB_API_URL, {
                reqheaders: {
                    authorization: 'token ' + process.env.GITHUB_TOKEN || '',
                    'user-agent': 'axios/1.7.7',
                }
            })
                .get('/repos/test-owner/test-repo/contributors')
                .reply(200, []);
            const { busFactor } = yield (0, BusFactor_1.calculateBusFactor)('test-owner', 'test-repo', process.env.GITHUB_TOKEN || '');
            expect(busFactor).toBe(0); // Bus Factor should be 0 if no contributors
        }));
        it('should handle errors gracefully', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock GitHub contributors endpoint to return an error
            (0, nock_1.default)(GITHUB_API_URL)
                .get('/repos/test-owner/test-repo/contributors')
                .reply(404);
            const { busFactor } = yield (0, BusFactor_1.calculateBusFactor)('test-owner', 'test-repo', process.env.GITHUB_TOKEN || '');
            expect(busFactor).toBe(-1); // Should return -1 on error
        }));
    });
    describe('npm Bus Factor', () => {
        it('should calculate Bus Factor for an npm package', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock npm package info endpoint
            (0, nock_1.default)('https://registry.npmjs.org')
                .get('/test-package')
                .reply(200, {
                repository: { url: 'https://github.com/test-owner/test-repo' }
            });
            // Mock GitHub contributors endpoint
            (0, nock_1.default)(GITHUB_API_URL, {
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
            const { busFactor } = yield bm.calculateNpmBusFactor('test-package');
            expect(busFactor).toBeCloseTo(0.5, 2); // (1 / 2 contributors) = 0.5
        }));
        it('should return Bus Factor as 0 when no GitHub repo is found', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock npm package info endpoint without repository
            (0, nock_1.default)('https://registry.npmjs.org')
                .get('/test-package')
                .reply(200, {});
            const { busFactor } = yield bm.calculateNpmBusFactor('test-package');
            expect(busFactor).toBe(0); // Default to 0 if no GitHub repo is found
        }));
        it('should handle errors gracefully for npm package', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock npm package info endpoint to return an error
            (0, nock_1.default)('https://registry.npmjs.org')
                .get('/test-package')
                .reply(404);
            const { busFactor } = yield bm.calculateNpmBusFactor('test-package');
            expect(busFactor).toBe(-1); // Should return -1 on error
        }));
    });
});
