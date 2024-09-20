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
exports.calculateNpmLicenseMetric = exports.calculateGitHubLicenseMetric = void 0;
const axios_1 = __importDefault(require("axios"));
// List of licenses compatible with GNU LGPL v2.1
const compatibleLicenses = [
    'LGPL-2.1',
    'LGPL-2.1-or-later',
    'MIT',
    'BSD-2-Clause',
    'BSD-3-Clause',
    'Apache-2.0',
    'Artistic-2.0'
];
// Function to check if a license is compatible with LGPL v2.1
const isLicenseCompatibleWithLGPLv21 = (licenseId) => {
    return compatibleLicenses.includes(licenseId);
};
// Function to fetch license information for a GitHub repository
const calculateGitHubLicenseMetric = (owner, repo, githubToken) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const start = performance.now(); // Record start time
    try {
        // Fetch repository license information using GitHub API
        const response = yield axios_1.default.get(`https://api.github.com/repos/${owner}/${repo}/license`, {
            headers: { Authorization: `token ${githubToken}` }
        });
        const license = ((_a = response.data.license) === null || _a === void 0 ? void 0 : _a.spdx_id) || ''; // Get the SPDX ID of the license
        const end = performance.now(); // Record end time
        const latency = end - start; // Calculate latency
        // Check if the license is compatible with LGPL v2.1
        const score = isLicenseCompatibleWithLGPLv21(license) ? 1 : 0;
        return { score, latency };
    }
    catch (error) {
        let errorMessage = "Failed to fetch license information for GitHub repository";
        if (error instanceof Error) {
        }
        const end = performance.now(); // Record end time in case of error
        const latency = end - start; // Calculate latency
        // Return default values for score and latency in case of error
        return { score: 0, latency };
    }
});
exports.calculateGitHubLicenseMetric = calculateGitHubLicenseMetric;
// Function to calculate license metric for npm packages
const calculateNpmLicenseMetric = (packageName) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const start = performance.now(); // Record start time
    try {
        // Fetch package metadata from the npm registry
        const packageResponse = yield axios_1.default.get(`https://registry.npmjs.org/${packageName}`);
        const repoUrl = (_b = packageResponse.data.repository) === null || _b === void 0 ? void 0 : _b.url;
        if (repoUrl && repoUrl.includes('github.com')) {
            // Extract GitHub owner and repository name from the URL
            const match = repoUrl.match(/github\.com[/:](.*?)(?:\.git)?$/);
            if (match && match[1]) {
                const [owner, repo] = match[1].split('/');
                const { score, latency } = yield (0, exports.calculateGitHubLicenseMetric)(owner, repo, process.env.GITHUB_TOKEN || '');
                // Calculate total latency
                const end = performance.now(); // Record end time
                const totalLatency = end - start + latency; // Add latencies if needed
                return { score, latency: totalLatency };
            }
        }
        const end = performance.now(); // Record end time if no GitHub repo is found
        const latency = end - start; // Calculate latency
        return { score: 0, latency }; // If no GitHub repo is found, assume no license
    }
    catch (error) {
        let errorMessage = "Failed to calculate license metric for npm package";
        if (error instanceof Error) {
        }
        const end = performance.now(); // Record end time in case of error
        const latency = end - start; // Calculate latency
        // Return default values for score and latency in case of error
        return { score: 0, latency };
    }
});
exports.calculateNpmLicenseMetric = calculateNpmLicenseMetric;
