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
exports.calculateNpmBusFactor = exports.calculateBusFactor = void 0;
const axios_1 = __importDefault(require("axios"));
const logging_1 = require("./logging");
// Function to calculate Bus Factor for GitHub URLs
const calculateBusFactor = (owner, repo, githubToken) => __awaiter(void 0, void 0, void 0, function* () {
    const start = performance.now(); // Record start time
    try {
        (0, logging_1.log)(`Fetching GitHub contributors for ${owner}/${repo}`, 2); // Debug level logging
        // Fetch all contributors
        const response = yield axios_1.default.get(`https://api.github.com/repos/${owner}/${repo}/contributors`, {
            headers: { Authorization: `token ${githubToken}` },
            params: { anon: 'true' } // Include anonymous contributors
        });
        const contributors = response.data;
        const contributorCount = contributors.length;
        (0, logging_1.log)(`Found ${contributorCount} contributors for ${owner}/${repo}`, 2); // Debug
        // Calculate Bus Factor
        const busFactor = contributorCount > 0 ? 1 / contributorCount : 0;
        (0, logging_1.log)(`Calculated Bus Factor for ${owner}/${repo}: ${busFactor}`, 1);
        const end = performance.now(); // Record end time
        const latency = end - start; // Calculate latency
        return { busFactor, latency };
    }
    catch (error) {
        let errorMessage = "Failed to calculate Bus Factor for GitHub repository";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        (0, logging_1.log)(`Error calculating Bus Factor for ${owner}/${repo}: ${errorMessage}`, 1); // Info level logging
        const end = performance.now(); // Record end time in case of error
        const latency = end - start; // Calculate latency
        // Return default values for Bus Factor and latency in case of error
        return { busFactor: -1, latency };
    }
});
exports.calculateBusFactor = calculateBusFactor;
// Function to calculate Bus Factor for npm URLs
const calculateNpmBusFactor = (packageName) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const start = performance.now(); // Record start time
    try {
        (0, logging_1.log)(`Fetching npm package info for ${packageName}`, 2); // Debug level
        // Fetch package info from npm
        const response = yield axios_1.default.get(`https://registry.npmjs.org/${packageName}`);
        const packageInfo = response.data;
        (0, logging_1.log)(`Fetching GitHub repository URL for ${packageName}`, 2); // Debug level
        // Fetch GitHub repository URL from package.json
        const repoUrl = (_a = packageInfo.repository) === null || _a === void 0 ? void 0 : _a.url;
        if (repoUrl && repoUrl.includes('github.com')) {
            (0, logging_1.log)(`Found GitHub repository URL for ${packageName}, calculating Bus Factor for GitHub repository`, 1); // Info
            const [owner, repo] = repoUrl.split('github.com/')[1].split('/');
            const { busFactor: githubBusFactor, latency: githubLatency } = yield (0, exports.calculateBusFactor)(owner, repo.split('.git')[0], process.env.GITHUB_TOKEN || '');
            // Calculate latency for npm Bus Factor
            const end = performance.now(); // Record end time
            const latency = end - start; // Calculate latency
            // Return combined results
            return { busFactor: githubBusFactor, latency: latency + githubLatency }; // Add latencies if needed
        }
        (0, logging_1.log)(`Could not find GitHub repository URL for ${packageName}, assuming Bus Factor to be 0`, 1); // Info
        const end = performance.now(); // Record end time if no GitHub repo is found
        const latency = end - start; // Calculate latency
        return { busFactor: 0, latency }; // If no GitHub repo is found, assume Bus Factor is 0
    }
    catch (error) {
        let errorMessage = "Failed to calculate Bus Factor for npm package";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        (0, logging_1.log)(`Error: ${errorMessage}`, 1); // Info
        const end = performance.now(); // Record end time in case of error
        const latency = end - start; // Calculate latency
        // Return default values for Bus Factor and latency in case of error
        return { busFactor: -1, latency };
    }
});
exports.calculateNpmBusFactor = calculateNpmBusFactor;
