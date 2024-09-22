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
const axios_1 = __importDefault(require("axios"));
const BusFactor_1 = require("../BusFactor"); // Update with the correct path
jest.mock('axios');
describe('Bus Factor Calculations', () => {
    const mockGithubToken = 'fake-github-token';
    afterEach(() => {
        jest.clearAllMocks(); // Clear mocks after each test
    });
    describe('calculateBusFactor', () => {
        test('should calculate Bus Factor successfully with contributors', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockContributorsResponse = {
                data: Array(8).fill({}), // Mocking 8 contributors
            };
            axios_1.default.get.mockResolvedValueOnce(mockContributorsResponse);
            const { busFactor, latency } = yield (0, BusFactor_1.calculateBusFactor)('owner', 'repo', mockGithubToken);
            expect(busFactor).toBeCloseTo(1 / 8); // Expecting Bus Factor 1/8
            expect(latency).toBeGreaterThan(0); // Latency should be positive
        }));
        test('should return Bus Factor 0 when no contributors are found', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockContributorsResponse = {
                data: [], // No contributors
            };
            axios_1.default.get.mockResolvedValueOnce(mockContributorsResponse);
            const { busFactor, latency } = yield (0, BusFactor_1.calculateBusFactor)('owner', 'repo', mockGithubToken);
            expect(busFactor).toBe(0); // Bus Factor should be 0 when no contributors
            expect(latency).toBeGreaterThan(0); // Latency should still be measured
        }));
        test('should handle errors and return Bus Factor -1', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockError = new Error('GitHub API error');
            axios_1.default.get.mockRejectedValueOnce(mockError);
            const { busFactor, latency } = yield (0, BusFactor_1.calculateBusFactor)('owner', 'repo', mockGithubToken);
            expect(busFactor).toBe(-1); // Bus Factor should be -1 in case of error
            expect(latency).toBeGreaterThan(0); // Latency should be measured
        }));
    });
    describe('calculateNpmBusFactor', () => {
        test('should calculate NPM Bus Factor successfully with valid GitHub repo', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockRepoUrl = 'https://github.com/owner/repo';
            const mockNpmResponse = {
                repository: { url: mockRepoUrl },
            };
            const mockContributorsResponse = {
                data: Array(5).fill({}), // Mocking 5 contributors
            };
            // Mock the NPM package info response
            axios_1.default.get.mockResolvedValueOnce({ data: mockNpmResponse });
            // Mock the GitHub contributors response
            axios_1.default.get.mockResolvedValueOnce(mockContributorsResponse);
            const { busFactor, latency } = yield (0, BusFactor_1.calculateNpmBusFactor)('valid-package');
            expect(busFactor).toBeCloseTo(1 / 5); // Expecting Bus Factor 1/5 for 5 contributors
            expect(latency).toBeGreaterThan(0); // Latency should be positive
        }));
        test('should return Bus Factor 0 when no GitHub repository URL is found', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockNpmResponse = {
                repository: { url: 'https://example.com/some-repo' }, // No GitHub URL
            };
            // Mock the NPM package info response
            axios_1.default.get.mockResolvedValueOnce({ data: mockNpmResponse });
            const { busFactor, latency } = yield (0, BusFactor_1.calculateNpmBusFactor)('package-with-no-github');
            expect(busFactor).toBe(0); // Bus Factor should be 0 when no GitHub URL is found
            expect(latency).toBeGreaterThan(0); // Latency should be measured
        }));
        test('should handle errors and return Bus Factor -1 for NPM package', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockError = new Error('NPM fetch failed');
            axios_1.default.get.mockRejectedValueOnce(mockError);
            const { busFactor, latency } = yield (0, BusFactor_1.calculateNpmBusFactor)('invalid-package');
            expect(busFactor).toBe(-1); // Bus Factor should be -1 in case of error
            expect(latency).toBeGreaterThan(0); // Latency should be measured
        }));
    });
});
