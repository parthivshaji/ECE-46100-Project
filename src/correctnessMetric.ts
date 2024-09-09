import axios from 'axios';

// Function to calculate correctness for GitHub URLs
export const calculateGitHubCorrectness = async (owner: string, repo: string, githubToken: string): Promise<{ correctness: number; latency: number }> => {
    const start = performance.now(); // Record start time
    try {
        // Fetch all issues labeled as "bug"
        const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/issues`, {
            headers: { Authorization: `token ${githubToken}` },
            params: { labels: 'bug', state: 'all' }
        });

        const bugIssuesCount = response.data.length;

        // Popularity is based on stargazers (as a proxy for popularity)
        const repoResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
            headers: { Authorization: `token ${githubToken}` }
        });

        const stargazersCount = repoResponse.data.stargazers_count;

        // Avoid division by zero
        const correctness = stargazersCount === 0 ? 1 : 1 - (bugIssuesCount / stargazersCount);

        const end = performance.now(); // Record end time
        const latency = end - start; // Calculate latency

        return { correctness, latency };

    } catch (error) {
        let errorMessage = "Failed to calculate correctness for GitHub repository";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        console.log(errorMessage);
        const end = performance.now(); // Record end time in case of error
        const latency = end - start; // Calculate latency

        // Return default values for correctness and latency in case of error
        return { correctness: -1, latency };
    }
};

// Function to calculate correctness for npm URLs
export const calculateNpmCorrectness = async (packageName: string): Promise<{ correctness: number; latency: number }> => {
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
            const { correctness: githubCorrectness, latency: githubLatency } = await calculateGitHubCorrectness(owner, repo.split('.git')[0], process.env.GITHUB_TOKEN || '');
            
            // Calculate latency for npm correctness
            const end = performance.now(); // Record end time
            const latency = end - start; // Calculate latency

            // Return combined results
            return { correctness: githubCorrectness, latency: latency + githubLatency }; // Add latencies if needed

        }

        const end = performance.now(); // Record end time if no GitHub repo is found
        const latency = end - start; // Calculate latency
        return { correctness: 1, latency }; // If no GitHub repo is found, assume correctness is perfect

    } catch (error) {
        let errorMessage = "Failed to calculate correctness for npm package";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        console.log(errorMessage);
        
        const end = performance.now(); // Record end time in case of error
        const latency = end - start; // Calculate latency
        
        // Return default values for correctness and latency in case of error
        return { correctness: -1, latency };
    }
};