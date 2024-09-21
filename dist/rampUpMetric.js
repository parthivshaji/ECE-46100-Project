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
const logging_1 = require("./logging"); // Assuming the logging module exports a log function
// Define GitHub API base
const GITHUB_API_BASE = 'https://api.github.com';
// Helper function to download a file from GitHub with enhanced error handling
function downloadFile(url, token) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            (0, logging_1.log)(`Downloading file from URL: ${url}`, 2); // Debug level log
            const response = yield axios_1.default.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github.v3.raw', // Request the raw file content
                },
            });
            (0, logging_1.log)(`Downloaded file successfully from ${url}`, 2); // Debug log
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                const status = (_a = error.response) === null || _a === void 0 ? void 0 : _a.status;
                if (status === 403) {
                    (0, logging_1.log)('Access forbidden: You might be rate-limited or lack permission.', 1); // Info level log
                }
                else if (status === 401) {
                    (0, logging_1.log)('Unauthorized: Check your GitHub token or permissions.', 1); // Info level log
                }
                else if (status === 404) {
                    (0, logging_1.log)('File not found.', 1); // Info log
                }
                else {
                    (0, logging_1.log)(`Failed to download file: ${error.message}`, 1); // Info log
                }
            }
            else {
                (0, logging_1.log)(`Unexpected error: ${error}`, 1); // Info log
            }
            return ''; // Return empty string if download fails
        }
    });
}
// Function to calculate the ramp-up metric based on README.md
function calculateGitRampUpMetric(owner, repo, token) {
    return __awaiter(this, void 0, void 0, function* () {
        const start = performance.now(); // Start timing
        (0, logging_1.log)(`Calculating ramp-up metric for GitHub repository ${owner}/${repo}`, 1); // Info log
        // Construct URL for the README.md file
        const readmeUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/README.md`;
        try {
            // Download the README.md file
            const readmeContent = yield downloadFile(readmeUrl, token);
            let rampUpScore = 0;
            // Score based on the README file
            if (readmeContent.length > 0) {
                const fileSizeInKB = Buffer.byteLength(readmeContent) / 1024; // Size in KB
                (0, logging_1.log)(`README file size: ${fileSizeInKB} KB`, 2); // Debug log
                if (fileSizeInKB > 50) {
                    rampUpScore += 10; // Large README implies good documentation
                    (0, logging_1.log)('Large README implies good documentation. Score: 10', 2); // Debug log
                }
                else if (fileSizeInKB > 20) {
                    rampUpScore += 7; // Medium README
                    (0, logging_1.log)('Medium README. Score: 7', 2); // Debug log
                }
                else {
                    rampUpScore += 3; // Small README
                    (0, logging_1.log)('Small README. Score: 3', 2); // Debug log
                }
            }
            else {
                rampUpScore += 0; // No README, poor documentation
                (0, logging_1.log)('No README found. Score: 1', 2); // Debug log
            }
            const end = performance.now(); // End timing
            const latency = end - start; // Calculate latency
            (0, logging_1.log)(`Ramp-up metric calculation completed for ${owner}/${repo}. Score: ${rampUpScore / 10}, Latency: ${latency}`, 1); // Info log
            return [rampUpScore / 10, latency];
        }
        catch (error) {
            (0, logging_1.log)(`Failed to calculate ramp-up metric for ${owner}/${repo}: ${error}`, 1); // Info log
            return [0, performance.now() - start]; // Return 0 score and elapsed time in case of error
        }
    });
}
exports.calculateGitRampUpMetric = calculateGitRampUpMetric;
// Function to calculate ramp-up for npm packages
const calculateNpmRampUpMetric = (packageName) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const start = performance.now(); // Record start time
    (0, logging_1.log)(`Calculating ramp-up for npm package: ${packageName}`, 1); // Info log
    try {
        (0, logging_1.log)(`Fetching npm download stats for ${packageName}`, 2); // Debug log
        // Fetch download stats from npm
        const response = yield axios_1.default.get(`https://api.npmjs.org/downloads/point/last-month/${packageName}`);
        const downloadCount = response.data.downloads;
        (0, logging_1.log)(`Download count for ${packageName}: ${downloadCount}`, 2); // Debug log
        (0, logging_1.log)(`Fetching package metadata for ${packageName}`, 2); // Debug log
        // Fetch package metadata from npm registry
        const packageResponse = yield axios_1.default.get(`https://registry.npmjs.org/${packageName}`);
        const repoUrl = (_a = packageResponse.data.repository) === null || _a === void 0 ? void 0 : _a.url;
        if (repoUrl && repoUrl.includes('github.com')) {
            (0, logging_1.log)(`Found GitHub repository URL for ${packageName}: ${repoUrl}`, 2); // Debug log
            // Extract owner and repo from the URL
            const cleanedRepoUrl = repoUrl.replace(/^git\+/, '').replace(/\.git$/, '');
            const [owner, repo] = cleanedRepoUrl.split('github.com/')[1].split('/');
            (0, logging_1.log)(`Calculating ramp-up metric for GitHub repository ${owner}/${repo}`, 1); // Info log
            // Calculate ramp-up using GitHub repository information
            const result = yield calculateGitRampUpMetric(owner, repo, process.env.GITHUB_TOKEN || '');
            const end = performance.now(); // Record end time
            const latency = end - start; // Calculate latency
            (0, logging_1.log)(`Ramp-up metric for npm package ${packageName} completed. Score: ${result[0]}, Latency: ${latency}`, 1); // Info log
            // Return combined results
            return { rampup: result[0], latency }; // Add latencies if needed
        }
        (0, logging_1.log)(`No GitHub repository found for ${packageName}. Assuming perfect ramp-up score of 1.`, 1); // Info log
        const end = performance.now(); // Record end time if no GitHub repo is found
        const latency = end - start; // Calculate latency
        return { rampup: 1, latency }; // Assume perfect ramp-up if no GitHub repo is found
    }
    catch (error) {
        (0, logging_1.log)(`Error calculating ramp-up for npm package ${packageName}: ${error}`, 1); // Info log
        const end = performance.now(); // Record end time in case of error
        const latency = end - start; // Calculate latency
        // Return default values for ramp-up and latency in case of error
        return { rampup: -1, latency };
    }
});
exports.calculateNpmRampUpMetric = calculateNpmRampUpMetric;
