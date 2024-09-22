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
exports.calculateNpmResponsiveness = exports.calculateGitResponsiveness = void 0;
const axios_1 = __importDefault(require("axios"));
const logging_1 = require("./logging"); // Assuming there's a logging utility
const GITHUB_API_BASE = 'https://api.github.com';
// Helper function to get the response time of a GitHub issue
function getGitIssueResponseTime(issueNumber, owner, repo, token) {
    return __awaiter(this, void 0, void 0, function* () {
        const issueUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/issues/${issueNumber}`;
        try {
            (0, logging_1.log)(`Fetching issue ${issueNumber} from ${owner}/${repo}`, 2); // Debug level log
            const response = yield axios_1.default.get(issueUrl, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const issueData = response.data;
            const createdAt = new Date(issueData.created_at).getTime();
            const closedAt = issueData.closed_at ? new Date(issueData.closed_at).getTime() : Date.now();
            const responseTime = closedAt - createdAt; // Time in milliseconds
            (0, logging_1.log)(`Response time for issue ${issueNumber}: ${responseTime / (1000 * 60 * 60 * 24)} days`, 2);
            return responseTime / (1000 * 60 * 60 * 24); // Convert to days
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            (0, logging_1.log)(`Error fetching issue ${issueNumber}: ${errorMessage}`, 1); // Error level log
            return 0; // Return 0 for invalid response times
        }
    });
}
// Helper function to get all issues and PR numbers from GitHub
function getGitIssuesAndPRs(state = 'all', owner, repo, token) {
    return __awaiter(this, void 0, void 0, function* () {
        const issueNumbers = [];
        let page = 1;
        const perPage = 100;
        while (page < 10) {
            const issuesUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/issues?state=${state}&per_page=${perPage}&page=${page}`;
            try {
                (0, logging_1.log)(`Fetching issues from ${owner}/${repo}, page ${page}`, 2); // Debug level log
                const response = yield axios_1.default.get(issuesUrl, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const issues = response.data;
                if (issues.length === 0)
                    break; // Exit loop if no more issues
                issueNumbers.push(...issues.map((issue) => issue.number));
                page++;
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                (0, logging_1.log)(`Error fetching issues for ${owner}/${repo}: ${errorMessage}`, 1); // Error level log
                break; // Exit loop if there's a failure, e.g., 403 Forbidden
            }
        }
        (0, logging_1.log)(`Found ${issueNumbers.length} issues for ${owner}/${repo}`, 2); // Debug level log
        return issueNumbers;
    });
}
// Function to calculate responsiveness based on GitHub issues
const calculateGitResponsiveness = function (owner, repo, token) {
    return __awaiter(this, void 0, void 0, function* () {
        const start = performance.now();
        try {
            (0, logging_1.log)(`Calculating GitHub responsiveness for ${owner}/${repo}`, 1); // Info level log
            const issuesAndPRs = yield getGitIssuesAndPRs('all', owner, repo, token);
            // Use Promise.all to fetch response times in parallel
            const responseTimes = yield Promise.all(issuesAndPRs.map((issueNumber) => getGitIssueResponseTime(issueNumber, owner, repo, token)));
            // Filter out invalid response times and calculate metrics
            const validResponseTimes = responseTimes.filter((rt) => rt > 0);
            const end = performance.now();
            const latency = end - start;
            if (validResponseTimes.length === 0) {
                (0, logging_1.log)('No valid response times found.', 2); // Debug level log
                return [0, latency];
            }
            const averageResponseTime = validResponseTimes.reduce((sum, rt) => sum + rt, 0) / validResponseTimes.length;
            let maxResponseTime = Math.max(...validResponseTimes);
            maxResponseTime = Math.max(maxResponseTime, 365);
            const responsiveness = 1 - averageResponseTime / maxResponseTime;
            (0, logging_1.log)(`Responsiveness for ${owner}/${repo}: ${responsiveness}`, 1); // Info level log
            return [responsiveness, latency];
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            (0, logging_1.log)(`Error calculating responsiveness for ${owner}/${repo}: ${errorMessage}`, 1); // Error level log
            return [0, performance.now() - start];
        }
    });
};
exports.calculateGitResponsiveness = calculateGitResponsiveness;
// Function to calculate responsiveness for npm packages
const calculateNpmResponsiveness = (packageName) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const start = performance.now(); // Record start time
    try {
        (0, logging_1.log)(`Fetching download stats for npm package ${packageName}`, 2); // Debug level log
        const response = yield axios_1.default.get(`https://api.npmjs.org/downloads/point/last-month/${packageName}`);
        const downloadCount = response.data.downloads;
        (0, logging_1.log)(`Download count for ${packageName}: ${downloadCount}`, 2); // Debug level log
        // Fetch bugs from the GitHub repository of the npm package if available
        const packageResponse = yield axios_1.default.get(`https://registry.npmjs.org/${packageName}`);
        const repoUrl = (_a = packageResponse.data.repository) === null || _a === void 0 ? void 0 : _a.url;
        if (repoUrl && repoUrl.includes('github.com')) {
            (0, logging_1.log)(`Found GitHub repository for ${packageName}: ${repoUrl}`, 2); // Debug level log
            const [owner, repo] = repoUrl.split('github.com/')[1].split('/');
            const result = yield (0, exports.calculateGitResponsiveness)(owner, repo.split('.git')[0], process.env.GITHUB_TOKEN || '');
            const end = performance.now(); // Record end time
            const latency = end - start; // Calculate latency
            (0, logging_1.log)(`Responsiveness for npm package ${packageName}: ${result[0]}`, 1); // Info level log
            return { responsiveness: result[0], latency };
        }
        const end = performance.now(); // Record end time if no GitHub repo is found
        const latency = end - start; // Calculate latency
        (0, logging_1.log)(`No GitHub repository found for ${packageName}, assuming perfect responsiveness`, 1); // Info level log
        return { responsiveness: 1, latency }; // If no GitHub repo is found, assume responsiveness is perfect
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        (0, logging_1.log)(`Error calculating npm responsiveness for package ${packageName}: ${errorMessage}`, 1); // Error level log
        const end = performance.now(); // Record end time in case of error
        const latency = end - start; // Calculate latency
        return { responsiveness: -1, latency }; // Return default values in case of error
    }
});
exports.calculateNpmResponsiveness = calculateNpmResponsiveness;
