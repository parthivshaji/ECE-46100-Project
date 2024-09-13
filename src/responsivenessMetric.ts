import axios from 'axios';

const GITHUB_API_BASE = 'https://api.github.com';

async function getGitIssueResponseTime(issueNumber: number, owner: string, repo: string, token: string): Promise<number> {
    const issueUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/issues/${issueNumber}`;
    try {
        const response = await axios.get(issueUrl, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const issueData = response.data;
        const createdAt = new Date(issueData.created_at).getTime();
        const closedAt = issueData.closed_at ? new Date(issueData.closed_at).getTime() : Date.now();

        const responseTime = closedAt - createdAt; // Time in milliseconds
        return responseTime / (1000 * 60 * 60 * 24); // Convert to days

    } catch (error) {
        console.error(`Failed to get issue response time for #${issueNumber}:`, error);
        return 0;
    }
}

async function getGitIssuesAndPRs(state: string = 'all', owner: string, repo: string, token: string): Promise<number[]> {
    const issueNumbers: number[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
        const issuesUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/issues?state=${state}&per_page=${perPage}&page=${page}`;
        try {
            const response = await axios.get(issuesUrl, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const issues = response.data;
            if (issues.length === 0) break;

            issueNumbers.push(...issues.map((issue: any) => issue.number));
            page++;
        } catch (error) {
            console.error('Failed to fetch issues and PRs:', error);
            break;
        }
    }

    return issueNumbers;
}

export const calculateGitResponsiveness = async function(owner: string, repo: string, token: string): Promise<[number, number]> {
    const start = performance.now();
    try {
        const issuesAndPRs = await getGitIssuesAndPRs('all', owner, repo, token);

        // Use Promise.all to fetch response times in parallel
        const responseTimes = await Promise.all(issuesAndPRs.map(issueNumber => 
            getGitIssueResponseTime(issueNumber, owner, repo, token)
        ));

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

    } catch (error) {
        console.error('Failed to calculate responsiveness:', error);
        return [0, performance.now() - start];
    }
}
