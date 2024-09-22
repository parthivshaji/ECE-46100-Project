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
exports.calculateNpmRampUpMetric = exports.calculateGitRampUpMetric = void 0;
const axios_1 = __importDefault(require("axios"));
const logging_1 = require("./logging"); // Assuming the logging module exports a log function
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const isomorphic_git_1 = __importDefault(require("isomorphic-git"));
const node_1 = __importDefault(require("isomorphic-git/http/node"));
// Define a function to clone the repository locally using isomorphic-git
function cloneRepo(owner, repo, token, cloneDir) {
    return __awaiter(this, void 0, void 0, function* () {
        const repoUrl = `https://github.com/${owner}/${repo}.git`;
        try {
            (0, logging_1.log)(`Cloning repository ${owner}/${repo} to ${cloneDir}`, 2);
            yield isomorphic_git_1.default.clone({
                fs,
                http: node_1.default,
                dir: cloneDir,
                url: repoUrl,
                onAuth: () => ({ username: token }),
                singleBranch: true,
                depth: 1, // Shallow clone for faster operations
            });
            (0, logging_1.log)(`Repository cloned successfully to ${cloneDir}`, 2);
        }
        catch (error) {
            // Narrowing the type of error to ensure it's an Error object
            if (error instanceof Error) {
                (0, logging_1.log)(`Error cloning repository: ${error.message}`, 1);
            }
            else {
                (0, logging_1.log)('An unknown error occurred while cloning the repository', 1);
            }
            throw error;
        }
    });
}
// Function to read the README.md file from the cloned repository
function readReadme(cloneDir) {
    return __awaiter(this, void 0, void 0, function* () {
        const readmePath = path.join(cloneDir, 'README.md');
        try {
            const readmeContent = yield fs.promises.readFile(readmePath, 'utf8');
            (0, logging_1.log)(`README.md found in the cloned repository`, 2);
            return readmeContent;
        }
        catch (error) {
            (0, logging_1.log)(`No README.md found in the cloned repository`, 1);
            return '';
        }
    });
}
// Function to calculate the ramp-up metric based on README.md
function calculateGitRampUpMetric(owner, repo, token) {
    return __awaiter(this, void 0, void 0, function* () {
        const start = performance.now(); // Start timing
        (0, logging_1.log)(`Calculating ramp-up metric for GitHub repository ${owner}/${repo}`, 1);
        const cloneDir = path.join('/tmp', `${owner}-${repo}`); // Directory to clone the repository
        try {
            // Clone the repository locally
            yield cloneRepo(owner, repo, token, cloneDir);
            // Read the README.md file from the cloned repository
            const readmeContent = yield readReadme(cloneDir);
            let rampUpScore = 0;
            // Score based on the README file
            if (readmeContent.length > 0) {
                const fileSizeInKB = Buffer.byteLength(readmeContent) / 1024; // Size in KB
                (0, logging_1.log)(`README file size: ${fileSizeInKB} KB`, 2);
                if (fileSizeInKB > 50) {
                    rampUpScore += 10; // Large README implies good documentation
                    (0, logging_1.log)('Large README implies good documentation. Score: 10', 2);
                }
                else if (fileSizeInKB > 20) {
                    rampUpScore += 7; // Medium README
                    (0, logging_1.log)('Medium README. Score: 7', 2);
                }
                else {
                    rampUpScore += 3; // Small README
                    (0, logging_1.log)('Small README. Score: 3', 2);
                }
            }
            else {
                rampUpScore += 0; // No README, poor documentation
                (0, logging_1.log)('No README found. Score: o', 2);
            }
            const end = performance.now(); // End timing
            const latency = end - start; // Calculate latency
            (0, logging_1.log)(`Ramp-up metric calculation completed for ${owner}/${repo}. Score: ${rampUpScore / 10}, Latency: ${latency}`, 1);
            return [rampUpScore / 10, latency];
        }
        catch (error) {
            (0, logging_1.log)(`Failed to calculate ramp-up metric for ${owner}/${repo}: ${error}`, 1);
            return [0, performance.now() - start]; // Return 0 score and elapsed time in case of error
        }
        finally {
            // Clean up: remove the cloned repository folder
            try {
                yield fs.promises.rm(cloneDir, { recursive: true });
                (0, logging_1.log)(`Removed cloned repository directory: ${cloneDir}`, 2);
            }
            catch (cleanupError) {
                // Narrowing the type of cleanupError
                if (cleanupError instanceof Error) {
                    (0, logging_1.log)(`Error cleaning up cloned directory: ${cleanupError.message}`, 1);
                }
                else {
                    (0, logging_1.log)('An unknown error occurred while cleaning up the cloned directory', 1);
                }
            }
        }
    });
}
exports.calculateGitRampUpMetric = calculateGitRampUpMetric;
// Function to calculate ramp-up for npm packages
const calculateNpmRampUpMetric = (packageName) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const start = performance.now(); // Record start time
    (0, logging_1.log)(`Calculating ramp-up for npm package: ${packageName}`, 1);
    try {
        (0, logging_1.log)(`Fetching npm download stats for ${packageName}`, 2);
        // Fetch download stats from npm
        const response = yield axios_1.default.get(`https://api.npmjs.org/downloads/point/last-month/${packageName}`);
        const downloadCount = response.data.downloads;
        (0, logging_1.log)(`Download count for ${packageName}: ${downloadCount}`, 2);
        (0, logging_1.log)(`Fetching package metadata for ${packageName}`, 2);
        // Fetch package metadata from npm registry
        const packageResponse = yield axios_1.default.get(`https://registry.npmjs.org/${packageName}`);
        const repoUrl = (_a = packageResponse.data.repository) === null || _a === void 0 ? void 0 : _a.url;
        if (repoUrl && repoUrl.includes('github.com')) {
            (0, logging_1.log)(`Found GitHub repository URL for ${packageName}: ${repoUrl}`, 2);
            // Extract owner and repo from the URL
            const cleanedRepoUrl = repoUrl.replace(/^git\+/, '').replace(/\.git$/, '');
            const [owner, repo] = cleanedRepoUrl.split('github.com/')[1].split('/');
            (0, logging_1.log)(`Calculating ramp-up metric for GitHub repository ${owner}/${repo}`, 1);
            // Calculate ramp-up using GitHub repository information
            const result = yield calculateGitRampUpMetric(owner, repo, process.env.GITHUB_TOKEN || '');
            const end = performance.now(); // Record end time
            const latency = end - start; // Calculate latency
            (0, logging_1.log)(`Ramp-up metric for npm package ${packageName} completed. Score: ${result[0]}, Latency: ${latency}`, 1);
            // Return combined results
            return { rampup: result[0], latency }; // Add latencies if needed
        }
        (0, logging_1.log)(`No GitHub repository found for ${packageName}. Assuming perfect ramp-up score of 1.`, 1);
        const end = performance.now(); // Record end time if no GitHub repo is found
        const latency = end - start; // Calculate latency
        return { rampup: 1, latency }; // Assume perfect ramp-up if no GitHub repo is found
    }
    catch (error) {
        (0, logging_1.log)(`Error calculating ramp-up for npm package ${packageName}: ${error}`, 1);
        const end = performance.now(); // Record end time in case of error
        const latency = end - start; // Calculate latency
        // Return default values for ramp-up and latency in case of error
        return { rampup: -1, latency };
    }
});
exports.calculateNpmRampUpMetric = calculateNpmRampUpMetric;
