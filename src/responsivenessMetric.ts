import axios from 'axios';

const GITHUB_API_BASE = 'https://api.github.com';

// Helper function to get the response time of a GitHub issue
async function getGitIssueResponseTime(issueNumber: number, owner: string, repo: string, token: string): Promise<number> {
    const issueUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/issues/${issueNumber}`;
    try {
        const response = await axios.get(issueUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const issueData = response.data;
        const createdAt = new Date(issueData.created_at).getTime();
        const closedAt = issueData.closed_at ? new Date(issueData.closed_at).getTime() : Date.now();

        const responseTime = closedAt - createdAt; // Time in milliseconds
        return responseTime / (1000 * 60 * 60 * 24); // Convert to days

    } catch {
        // Silent catch to handle errors like 403 without logging or interrupting execution
        return 0; // Return 0 for invalid response times
    }
}

// Helper function to get all issues and PR numbers from GitHub
async function getGitIssuesAndPRs(state: string = 'all', owner: string, repo: string, token: string): Promise<number[]> {
    const issueNumbers: number[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
        const issuesUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/issues?state=${state}&per_page=${perPage}&page=${page}`;
        try {
            const response = await axios.get(issuesUrl, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const issues = response.data;
            if (issues.length === 0) break; // Exit loop if no more issues

            issueNumbers.push(...issues.map((issue: any) => issue.number));
            page++;
        } catch {
            // Silent catch to skip over errors and break the loop
            break; // Exit loop if there's a failure, e.g., 403 Forbidden
        }
    }

    return issueNumbers;
}

// Function to calculate responsiveness based on GitHub issues
export const calculateGitResponsiveness = async function (owner: string, repo: string, token: string): Promise<[number, number]> {
    const start = performance.now();
    try {
        const issuesAndPRs = await getGitIssuesAndPRs('all', owner, repo, token);

        // Use Promise.all to fetch response times in parallel
        const responseTimes = await Promise.all(
            issuesAndPRs.map((issueNumber) => getGitIssueResponseTime(issueNumber, owner, repo, token))
        );

        // Filter out invalid response times and calculate metrics
        const validResponseTimes = responseTimes.filter((rt) => rt > 0);

        const end = performance.now();
        const latency = end - start;

        if (validResponseTimes.length === 0) {
            return [0, latency];
        }

        const averageResponseTime = validResponseTimes.reduce((sum, rt) => sum + rt, 0) / validResponseTimes.length;
        const maxResponseTime = Math.max(...validResponseTimes);

        const responsiveness = 1 - averageResponseTime / maxResponseTime;
        return [responsiveness, latency];
    } catch {
        return [0, performance.now() - start];
    }
};

// Function to calculate responsiveness for npm packages
export const calculateNpmResponsiveness = async (packageName: string): Promise<{ responsiveness: number; latency: number }> => {
    const start = performance.now(); // Record start time
    try {
        // Fetch download stats from npm
        const response = await axios.get(`https://api.npmjs.org/downloads/point/last-month/${packageName}`);
        const downloadCount = response.data.downloads;

        // Fetch bugs from the GitHub repository of the npm package if available
        // Assuming the repository is linked in the package.json
        const packageResponse = await axios.get(`https://registry.npmjs.org/${packageName}`);
        const repoUrl = packageResponse.data.repository?.url;

        if (repoUrl && repoUrl.includes('github.com')) {
            const [owner, repo] = repoUrl.split('github.com/')[1].split('/');
            const result = await calculateGitResponsiveness(owner, repo.split('.git')[0], process.env.GITHUB_TOKEN || '');

            // Calculate latency for npm responsiveness
            const end = performance.now(); // Record end time
            const latency = end - start; // Calculate latency

            // Return combined results
            return { responsiveness: result[0], latency }; // Add latencies if needed
        }

        const end = performance.now(); // Record end time if no GitHub repo is found
        const latency = end - start; // Calculate latency
        return { responsiveness: 1, latency }; // If no GitHub repo is found, assume responsiveness is perfect
    } catch {
        const end = performance.now(); // Record end time in case of error
        const latency = end - start; // Calculate latency

        return { responsiveness: -1, latency }; // Return default values in case of error
    }
};