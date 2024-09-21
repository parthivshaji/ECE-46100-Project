import axios from 'axios';
import { log } from './logging';  // Assuming the logging module exports a log function

// Define GitHub API base
const GITHUB_API_BASE = 'https://api.github.com';

// Helper function to download a file from GitHub with enhanced error handling
async function downloadFile(url: string, token: string): Promise<string> {
    try {
        log(`Downloading file from URL: ${url}`, 2);  // Debug level log
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github.v3.raw', // Request the raw file content
            },
        });

        log(`Downloaded file successfully from ${url}`, 2);  // Debug log
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            if (status === 403) {
                log('Access forbidden: You might be rate-limited or lack permission.', 1);  // Info level log
            } else if (status === 401) {
                log('Unauthorized: Check your GitHub token or permissions.', 1);  // Info level log
            } else if (status === 404) {
                log('File not found.', 1);  // Info log
            } else {
                log(`Failed to download file: ${error.message}`, 1);  // Info log
            }
        } else {
            log(`Unexpected error: ${error}`, 1);  // Info log
        }
        return ''; // Return empty string if download fails
    }
}

// Function to calculate the ramp-up metric based on README.md
export async function calculateGitRampUpMetric(owner: string, repo: string, token: string): Promise<[number, number]> {
    const start = performance.now(); // Start timing
    log(`Calculating ramp-up metric for GitHub repository ${owner}/${repo}`, 1);  // Info log

    // Construct URL for the README.md file
    const readmeUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/README.md`;

    try {
        // Download the README.md file
        const readmeContent = await downloadFile(readmeUrl, token);

        let rampUpScore = 0;

        // Score based on the README file
        if (readmeContent.length > 0) {
            const fileSizeInKB = Buffer.byteLength(readmeContent) / 1024; // Size in KB
            log(`README file size: ${fileSizeInKB} KB`, 2);  // Debug log

            if (fileSizeInKB > 50) {
                rampUpScore += 10; // Large README implies good documentation
                log('Large README implies good documentation. Score: 10', 2);  // Debug log
            } else if (fileSizeInKB > 20) {
                rampUpScore += 7; // Medium README
                log('Medium README. Score: 7', 2);  // Debug log
            } else {
                rampUpScore += 3; // Small README
                log('Small README. Score: 3', 2);  // Debug log
            }
        } else {
            rampUpScore += 0; // No README, poor documentation
            log('No README found. Score: 1', 2);  // Debug log
        }

        const end = performance.now(); // End timing
        const latency = end - start; // Calculate latency
        log(`Ramp-up metric calculation completed for ${owner}/${repo}. Score: ${rampUpScore / 10}, Latency: ${latency}`, 1);  // Info log

        return [rampUpScore / 10, latency];

    } catch (error) {
        log(`Failed to calculate ramp-up metric for ${owner}/${repo}: ${error}`, 1);  // Info log
        return [0, performance.now() - start]; // Return 0 score and elapsed time in case of error
    }
}

// Function to calculate ramp-up for npm packages
export const calculateNpmRampUpMetric = async (packageName: string): Promise<{ rampup: number; latency: number }> => {
    const start = performance.now(); // Record start time
    log(`Calculating ramp-up for npm package: ${packageName}`, 1);  // Info log

    try {
        log(`Fetching npm download stats for ${packageName}`, 2);  // Debug log
        // Fetch download stats from npm
        const response = await axios.get(`https://api.npmjs.org/downloads/point/last-month/${packageName}`);
        const downloadCount = response.data.downloads;
        log(`Download count for ${packageName}: ${downloadCount}`, 2);  // Debug log

        log(`Fetching package metadata for ${packageName}`, 2);  // Debug log
        // Fetch package metadata from npm registry
        const packageResponse = await axios.get(`https://registry.npmjs.org/${packageName}`);
        const repoUrl = packageResponse.data.repository?.url;

        if (repoUrl && repoUrl.includes('github.com')) {
            log(`Found GitHub repository URL for ${packageName}: ${repoUrl}`, 2);  // Debug log

            // Extract owner and repo from the URL
            const cleanedRepoUrl = repoUrl.replace(/^git\+/, '').replace(/\.git$/, '');
            const [owner, repo] = cleanedRepoUrl.split('github.com/')[1].split('/');

            log(`Calculating ramp-up metric for GitHub repository ${owner}/${repo}`, 1);  // Info log
            // Calculate ramp-up using GitHub repository information
            const result = await calculateGitRampUpMetric(owner, repo, process.env.GITHUB_TOKEN || '');

            const end = performance.now(); // Record end time
            const latency = end - start; // Calculate latency

            log(`Ramp-up metric for npm package ${packageName} completed. Score: ${result[0]}, Latency: ${latency}`, 1);  // Info log

            // Return combined results
            return { rampup: result[0], latency }; // Add latencies if needed
        }

        log(`No GitHub repository found for ${packageName}. Assuming perfect ramp-up score of 1.`, 1);  // Info log
        const end = performance.now(); // Record end time if no GitHub repo is found
        const latency = end - start; // Calculate latency
        return { rampup: 1, latency }; // Assume perfect ramp-up if no GitHub repo is found

    } catch (error) {
        log(`Error calculating ramp-up for npm package ${packageName}: ${error}`, 1);  // Info log

        const end = performance.now(); // Record end time in case of error
        const latency = end - start; // Calculate latency
        
        // Return default values for ramp-up and latency in case of error
        return { rampup: -1, latency };
    }
};
