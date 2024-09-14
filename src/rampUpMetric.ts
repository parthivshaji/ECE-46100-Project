import axios from 'axios';

// Define GitHub API base
const GITHUB_API_BASE = 'https://api.github.com';

// Helper function to download a file from GitHub
async function downloadFile(url: string, token: string): Promise<string> {
    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github.v3.raw', // Request the raw file content
            },
        });

        return response.data;
    } catch (error) {
        console.error('Failed to download file:', error);
        return ''; // Return empty string if download fails
    }
}

// Function to calculate the ramp-up metric based on README.md
export async function calculateGitRampUpMetric(owner: string, repo: string, token: string): Promise<[number, number]> {
    const start = performance.now(); // Start timing

    // Construct URL for the README.md file
    const readmeUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/README.md`;

    try {
        // Download the README.md file
        const readmeContent = await downloadFile(readmeUrl, token);

        let rampUpScore = 0;

        // Score based on the README file
        if (readmeContent.length > 0) {
            const fileSizeInKB = Buffer.byteLength(readmeContent) / 1024; // Size in KB

            if (fileSizeInKB > 50) {
                rampUpScore += 10; // Large README implies good documentation
            } else if (fileSizeInKB > 20) {
                rampUpScore += 7; // Medium README
            } else {
                rampUpScore += 3; // Small README
            }
        } else {
            rampUpScore += 1; // No README, poor documentation
        }

        const end = performance.now(); // End timing
        const latency = end - start; // Calculate latency

        return [rampUpScore, latency];

    } catch (error) {
        console.error('Failed to calculate ramp-up metric:', error);
        return [0, performance.now() - start]; // Return 0 score and elapsed time in case of error
    }
}

// Function to calculate correctness for npm URLs
export const calculateNpmRampUpMetric = async (packageName: string): Promise<{ rampup: number; latency: number }> => {
    const start = performance.now(); // Record start time
    try {
        // Fetch download stats from npm
        const response = await axios.get(`https://api.npmjs.org/downloads/point/last-month/${packageName}`);
        const downloadCount = response.data.downloads;

        // Fetch package metadata from npm registry
        const packageResponse = await axios.get(`https://registry.npmjs.org/${packageName}`);
        const repoUrl = packageResponse.data.repository?.url;

        if (repoUrl && repoUrl.includes('github.com')) {
            // Extract owner and repo from the URL
            const cleanedRepoUrl = repoUrl.replace(/^git\+/, '').replace(/\.git$/, '');
            const [owner, repo] = cleanedRepoUrl.split('github.com/')[1].split('/');
            
            // Calculate ramp-up using GitHub repository information
            const result = await calculateGitRampUpMetric(owner, repo, process.env.GITHUB_TOKEN || '');
            
            const end = performance.now(); // Record end time
            const latency = end - start; // Calculate latency

            // Return combined results
            return { rampup: result[0], latency }; // Add latencies if needed
        }

        // Handle case where GitHub repository is not found
        const end = performance.now(); // Record end time if no GitHub repo is found
        const latency = end - start; // Calculate latency
        return { rampup: 1, latency }; // Assume perfect ramp-up if no GitHub repo is found

    } catch (error) {
        console.error("Error calculating ramp-up for npm package:", error);

        const end = performance.now(); // Record end time in case of error
        const latency = end - start; // Calculate latency
        
        // Return default values for ramp-up and latency in case of error
        return { rampup: -1, latency };
    }
};
