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
