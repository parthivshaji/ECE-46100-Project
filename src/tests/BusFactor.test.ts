import axios from 'axios';
import { calculateBusFactor, calculateNpmBusFactor } from '../BusFactor'; // Update with the correct path

jest.mock('axios');

describe('Bus Factor Calculations', () => {
    const mockGithubToken = 'fake-github-token';

    afterEach(() => {
        jest.clearAllMocks(); // Clear mocks after each test
    });

    describe('calculateBusFactor', () => {
        test('should calculate Bus Factor successfully with contributors', async () => {
            const mockContributorsResponse = {
                data: Array(8).fill({}), // Mocking 8 contributors
            };
            (axios.get as jest.Mock).mockResolvedValueOnce(mockContributorsResponse);

            const { busFactor, latency } = await calculateBusFactor('owner', 'repo', mockGithubToken);

            expect(busFactor).toBeCloseTo(1 / 8); // Expecting Bus Factor 1/8
            expect(latency).toBeGreaterThan(0); // Latency should be positive
        });

        test('should return Bus Factor 0 when no contributors are found', async () => {
            const mockContributorsResponse = {
                data: [], // No contributors
            };
            (axios.get as jest.Mock).mockResolvedValueOnce(mockContributorsResponse);

            const { busFactor, latency } = await calculateBusFactor('owner', 'repo', mockGithubToken);

            expect(busFactor).toBe(0); // Bus Factor should be 0 when no contributors
            expect(latency).toBeGreaterThan(0); // Latency should still be measured
        });

        test('should handle errors and return Bus Factor -1', async () => {
            const mockError = new Error('GitHub API error');
            (axios.get as jest.Mock).mockRejectedValueOnce(mockError);

            const { busFactor, latency } = await calculateBusFactor('owner', 'repo', mockGithubToken);

            expect(busFactor).toBe(-1); // Bus Factor should be -1 in case of error
            expect(latency).toBeGreaterThan(0); // Latency should be measured
        });
    });

    describe('calculateNpmBusFactor', () => {
        test('should calculate NPM Bus Factor successfully with valid GitHub repo', async () => {
            const mockRepoUrl = 'https://github.com/owner/repo';
            const mockNpmResponse = {
                repository: { url: mockRepoUrl },
            };
            const mockContributorsResponse = {
                data: Array(5).fill({}), // Mocking 5 contributors
            };

            // Mock the NPM package info response
            (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockNpmResponse });
            // Mock the GitHub contributors response
            (axios.get as jest.Mock).mockResolvedValueOnce(mockContributorsResponse);

            const { busFactor, latency } = await calculateNpmBusFactor('valid-package');

            expect(busFactor).toBeCloseTo(1 / 5); // Expecting Bus Factor 1/5 for 5 contributors
            expect(latency).toBeGreaterThan(0); // Latency should be positive
        });

        test('should return Bus Factor 0 when no GitHub repository URL is found', async () => {
            const mockNpmResponse = {
                repository: { url: 'https://example.com/some-repo' }, // No GitHub URL
            };

            // Mock the NPM package info response
            (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockNpmResponse });

            const { busFactor, latency } = await calculateNpmBusFactor('package-with-no-github');

            expect(busFactor).toBe(0); // Bus Factor should be 0 when no GitHub URL is found
            expect(latency).toBeGreaterThan(0); // Latency should be measured
        });

        test('should handle errors and return Bus Factor -1 for NPM package', async () => {
            const mockError = new Error('NPM fetch failed');
            (axios.get as jest.Mock).mockRejectedValueOnce(mockError);

            const { busFactor, latency } = await calculateNpmBusFactor('invalid-package');

            expect(busFactor).toBe(-1); // Bus Factor should be -1 in case of error
            expect(latency).toBeGreaterThan(0); // Latency should be measured
        });
    });
});
