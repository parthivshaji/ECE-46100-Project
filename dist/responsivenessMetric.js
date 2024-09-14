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
const GITHUB_API_BASE = 'https://api.github.com';
function getGitIssueResponseTime(issueNumber, owner, repo, token) {
    return __awaiter(this, void 0, void 0, function* () {
        const issueUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/issues/${issueNumber}`;
        try {
            const response = yield axios_1.default.get(issueUrl, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const issueData = response.data;
            const createdAt = new Date(issueData.created_at).getTime();
            const closedAt = issueData.closed_at ? new Date(issueData.closed_at).getTime() : Date.now();
            const responseTime = closedAt - createdAt; // Time in milliseconds
            return responseTime / (1000 * 60 * 60 * 24); // Convert to days
        }
        catch (error) {
            console.error(`Failed to get issue response time for #${issueNumber}:`, error);
            return 0;
        }
    });
}
function getGitIssuesAndPRs(state = 'all', owner, repo, token) {
    return __awaiter(this, void 0, void 0, function* () {
        const issueNumbers = [];
        let page = 1;
        const perPage = 100;
        while (true) {
            const issuesUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/issues?state=${state}&per_page=${perPage}&page=${page}`;
            try {
                const response = yield axios_1.default.get(issuesUrl, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                const issues = response.data;
                if (issues.length === 0)
                    break;
                issueNumbers.push(...issues.map((issue) => issue.number));
                page++;
            }
            catch (error) {
                console.error('Failed to fetch issues and PRs:', error);
                break;
            }
        }
        return issueNumbers;
    });
}
const calculateGitResponsiveness = function (owner, repo, token) {
    return __awaiter(this, void 0, void 0, function* () {
        const start = performance.now();
        try {
            const issuesAndPRs = yield getGitIssuesAndPRs('all', owner, repo, token);
            // Use Promise.all to fetch response times in parallel
            const responseTimes = yield Promise.all(issuesAndPRs.map(issueNumber => getGitIssueResponseTime(issueNumber, owner, repo, token)));
            // Filter out invalid response times and calculate metrics
            const validResponseTimes = responseTimes.filter(rt => rt > 0);
            const end = performance.now();
            const latency = end - start;
            if (validResponseTimes.length === 0) {
                return [0, latency];
            }
            const averageResponseTime = validResponseTimes.reduce((sum, rt) => sum + rt, 0) / validResponseTimes.length;
            const maxResponseTime = Math.max(...validResponseTimes);
            const responsiveness = 1 - (averageResponseTime / maxResponseTime);
            return [responsiveness, latency];
        }
        catch (error) {
            console.error('Failed to calculate responsiveness:', error);
            return [0, performance.now() - start];
        }
    });
};
exports.calculateGitResponsiveness = calculateGitResponsiveness;
// Function to calculate correctness for npm URLs
const calculateNpmResponsiveness = (packageName) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const start = performance.now(); // Record start time
    try {
        // Fetch download stats from npm
        const response = yield axios_1.default.get(`https://api.npmjs.org/downloads/point/last-month/${packageName}`);
        const downloadCount = response.data.downloads;
        // Fetch bugs from the GitHub repository of the npm package if available
        // Assuming the repository is linked in the package.json
        const packageResponse = yield axios_1.default.get(`https://registry.npmjs.org/${packageName}`);
        const repoUrl = (_a = packageResponse.data.repository) === null || _a === void 0 ? void 0 : _a.url;
        if (repoUrl && repoUrl.includes('github.com')) {
            const [owner, repo] = repoUrl.split('github.com/')[1].split('/');
            const result = yield (0, exports.calculateGitResponsiveness)(owner, repo.split('.git')[0], process.env.GITHUB_TOKEN || '');
            // Calculate latency for npm correctness
            const end = performance.now(); // Record end time
            const latency = end - start; // Calculate latency
            // Return combined results
            return { responsiveness: result[0], latency: latency }; // Add latencies if needed
        }
        const end = performance.now(); // Record end time if no GitHub repo is found
        const latency = end - start; // Calculate latency
        return { responsiveness: 1, latency }; // If no GitHub repo is found, assume correctness is perfect
    }
    catch (error) {
        let errorMessage = "Failed to calculate correctness for npm package";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        console.log(errorMessage);
        const end = performance.now(); // Record end time in case of error
        const latency = end - start; // Calculate latency
        // Return default values for correctness and latency in case of error
        return { responsiveness: -1, latency: 0 };
    }
});
exports.calculateNpmResponsiveness = calculateNpmResponsiveness;
