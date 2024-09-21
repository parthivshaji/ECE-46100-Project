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
exports.calculateNpmRampUpMetric = void 0;
exports.calculateGitRampUpMetric = calculateGitRampUpMetric;
const axios_1 = __importDefault(require("axios"));
// Define GitHub API base
const GITHUB_API_BASE = 'https://api.github.com';
// Helper function to download a file from GitHub with enhanced error handling
function downloadFile(url, token) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const response = yield axios_1.default.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github.v3.raw', // Request the raw file content
                },
            });
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                const status = (_a = error.response) === null || _a === void 0 ? void 0 : _a.status;
                if (status === 403) {
                    console.error('Access forbidden: You might be rate-limited or lack permission.');
                }
                else if (status === 401) {
                    console.error('Unauthorized: Check your GitHub token or permissions.');
                }
                else if (status === 404) {
                    console.error('File not found.');
                }
                else {
                    console.error('Failed to download file:', error.message);
                }
            }
            else {
                console.error('Unexpected error:', error);
            }
            return ''; // Return empty string if download fails
        }
    });
}
// Function to calculate the ramp-up metric based on README.md
function calculateGitRampUpMetric(owner, repo, token) {
    return __awaiter(this, void 0, void 0, function* () {
        const start = performance.now(); // Start timing
        // Construct URL for the README.md file
        const readmeUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/README.md`;
        try {
            // Download the README.md file
            const readmeContent = yield downloadFile(readmeUrl, token);
            let rampUpScore = 0;
            // Score based on the README file
            if (readmeContent.length > 0) {
                const fileSizeInKB = Buffer.byteLength(readmeContent) / 1024; // Size in KB
                if (fileSizeInKB > 50) {
                    rampUpScore += 10; // Large README implies good documentation
                }
                else if (fileSizeInKB > 20) {
                    rampUpScore += 7; // Medium README
                }
                else {
                    rampUpScore += 3; // Small README
                }
            }
            else {
                rampUpScore += 1; // No README, poor documentation
            }
            const end = performance.now(); // End timing
            const latency = end - start; // Calculate latency
            return [rampUpScore / 10, latency];
        }
        catch (error) {
            console.error('Failed to calculate ramp-up metric:', error);
            return [0, performance.now() - start]; // Return 0 score and elapsed time in case of error
        }
    });
}
// Function to calculate correctness for npm URLs
const calculateNpmRampUpMetric = (packageName) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const start = performance.now(); // Record start time
    try {
        // Fetch download stats from npm
        const response = yield axios_1.default.get(`https://api.npmjs.org/downloads/point/last-month/${packageName}`);
        const downloadCount = response.data.downloads;
        // Fetch package metadata from npm registry
        const packageResponse = yield axios_1.default.get(`https://registry.npmjs.org/${packageName}`);
        const repoUrl = (_a = packageResponse.data.repository) === null || _a === void 0 ? void 0 : _a.url;
        if (repoUrl && repoUrl.includes('github.com')) {
            // Extract owner and repo from the URL
            const cleanedRepoUrl = repoUrl.replace(/^git\+/, '').replace(/\.git$/, '');
            const [owner, repo] = cleanedRepoUrl.split('github.com/')[1].split('/');
            // Calculate ramp-up using GitHub repository information
            const result = yield calculateGitRampUpMetric(owner, repo, process.env.GITHUB_TOKEN || '');
            const end = performance.now(); // Record end time
            const latency = end - start; // Calculate latency
            // Return combined results
            return { rampup: result[0], latency }; // Add latencies if needed
        }
        // Handle case where GitHub repository is not found
        const end = performance.now(); // Record end time if no GitHub repo is found
        const latency = end - start; // Calculate latency
        return { rampup: 1, latency }; // Assume perfect ramp-up if no GitHub repo is found
    }
    catch (error) {
        console.error("Error calculating ramp-up for npm package:", error);
        const end = performance.now(); // Record end time in case of error
        const latency = end - start; // Calculate latency
        // Return default values for ramp-up and latency in case of error
        return { rampup: -1, latency };
    }
});
exports.calculateNpmRampUpMetric = calculateNpmRampUpMetric;
