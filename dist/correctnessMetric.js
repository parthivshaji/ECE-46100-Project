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
exports.calculateNpmCorrectness = exports.calculateGitHubCorrectness = void 0;
const axios_1 = __importDefault(require("axios"));
const logging_1 = require("./logging");
// Function to calculate correctness for GitHub URLs
const calculateGitHubCorrectness = (owner, repo, githubToken) => __awaiter(void 0, void 0, void 0, function* () {
    const start = performance.now(); // Record start time
    try {
        (0, logging_1.log)(`Fetching GitHub issues for ${owner}/${repo}`, 2); // Debug level logging
        // Fetch all issues labeled as "bug"
        const response = yield axios_1.default.get(`https://api.github.com/repos/${owner}/${repo}/issues`, {
            headers: { Authorization: `token ${githubToken}` },
            params: { labels: 'bug', state: 'all' }
        });
        const bugIssuesCount = response.data.length;
        (0, logging_1.log)(`Found ${bugIssuesCount} bug issues for ${owner}/${repo}`, 2); // Debug
        // Popularity is based on stargazers (as a proxy for popularity)
        const repoResponse = yield axios_1.default.get(`https://api.github.com/repos/${owner}/${repo}`, {
            headers: { Authorization: `token ${githubToken}` }
        });
        const stargazersCount = repoResponse.data.stargazers_count;
        (0, logging_1.log)(`${owner}/${repo} has ${stargazersCount} stars (popularity)`, 2); // Debug
        // Avoid division by zero
        const correctness = stargazersCount === 0 ? 1 : 1 - (bugIssuesCount / stargazersCount);
        (0, logging_1.log)(`Calculated correctness for ${owner}/${repo}: ${correctness}`, 1);
        const end = performance.now(); // Record end time
        const latency = end - start; // Calculate latency
        return { correctness, latency };
    }
    catch (error) {
        let errorMessage = "Failed to calculate correctness for GitHub repository";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        (0, logging_1.log)(`Error calculating GitHub correctness for ${owner}/${repo}: ${errorMessage}`, 1); // Info level logging
        const end = performance.now(); // Record end time in case of error
        const latency = end - start; // Calculate latency
        // Return default values for correctness and latency in case of error
        return { correctness: -1, latency };
    }
});
exports.calculateGitHubCorrectness = calculateGitHubCorrectness;
// Function to calculate correctness for npm URLs
const calculateNpmCorrectness = (packageName) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const start = performance.now(); // Record start time
    try {
        (0, logging_1.log)(`Fetching npm package info for ${packageName}`, 2); // Debug level
        // Fetch download stats from npm
        const response = yield axios_1.default.get(`https://api.npmjs.org/downloads/point/last-month/${packageName}`);
        const downloadCount = response.data.downloads;
        (0, logging_1.log)(`Fetching GitHub repository URL for ${packageName}`, 2); // Debug level
        // Fetch bugs from the GitHub repository of the npm package if available
        // Assuming the repository is linked in the package.json
        const packageResponse = yield axios_1.default.get(`https://registry.npmjs.org/${packageName}`);
        const repoUrl = (_a = packageResponse.data.repository) === null || _a === void 0 ? void 0 : _a.url;
        if (repoUrl && repoUrl.includes('github.com')) {
            (0, logging_1.log)(`Found GitHub repository URL for ${packageName}, calculating correctness for GitHub repository`, 1); // Info
            const [owner, repo] = repoUrl.split('github.com/')[1].split('/');
            const { correctness: githubCorrectness, latency: githubLatency } = yield (0, exports.calculateGitHubCorrectness)(owner, repo.split('.git')[0], process.env.GITHUB_TOKEN || '');
            // Calculate latency for npm correctness
            const end = performance.now(); // Record end time
            const latency = end - start; // Calculate latency
            // Return combined results
            return { correctness: githubCorrectness, latency: latency + githubLatency }; // Add latencies if needed
        }
        (0, logging_1.log)(`Could not find GitHub repository URL for ${packageName}, assuming correctness to be 1`, 1); // Info
        const end = performance.now(); // Record end time if no GitHub repo is found
        const latency = end - start; // Calculate latency
        return { correctness: 1, latency }; // If no GitHub repo is found, assume correctness is perfect
    }
    catch (error) {
        let errorMessage = "Failed to calculate correctness for npm package";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        (0, logging_1.log)(`Error: ${errorMessage}`, 1); // Info
        const end = performance.now(); // Record end time in case of error
        const latency = end - start; // Calculate latency
        // Return default values for correctness and latency in case of error
        return { correctness: -1, latency };
    }
});
exports.calculateNpmCorrectness = calculateNpmCorrectness;
