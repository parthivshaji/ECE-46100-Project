import axios from 'axios';

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
const isLicenseCompatibleWithLGPLv21 = (licenseId: string): boolean => {
    return compatibleLicenses.includes(licenseId);
};

// Function to fetch license information for a GitHub repository
export const calculateGitHubLicenseMetric = async (owner: string, repo: string, githubToken: string): Promise<{ score: number; latency: number }> => {
    const start = performance.now(); // Record start time
    try {
        // Fetch repository license information using GitHub API
        const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/license`, {
            headers: { Authorization: `token ${githubToken}` }
        });

        const license = response.data.license?.spdx_id || ''; // Get the SPDX ID of the license

        const end = performance.now(); // Record end time
        const latency = end - start; // Calculate latency

        // Check if the license is compatible with LGPL v2.1
        const score = isLicenseCompatibleWithLGPLv21(license) ? 1 : 0;
        return { score, latency };

    } catch (error) {
        let errorMessage = "Failed to fetch license information for GitHub repository";
        if (error instanceof Error) {
            
        }
        const end = performance.now(); // Record end time in case of error
        const latency = end - start; // Calculate latency

        // Return default values for score and latency in case of error
        return { score: 0, latency };
    }
};

// Function to calculate license metric for npm packages
export const calculateNpmLicenseMetric = async (packageName: string): Promise<{ score: number; latency: number }> => {
    const start = performance.now(); // Record start time
    try {
        // Fetch package metadata from the npm registry
        const packageResponse = await axios.get(`https://registry.npmjs.org/${packageName}`);
        const repoUrl = packageResponse.data.repository?.url;

        if (repoUrl && repoUrl.includes('github.com')) {
            // Extract GitHub owner and repository name from the URL
            const match = repoUrl.match(/github\.com[/:](.*?)(?:\.git)?$/);
            if (match && match[1]) {
                const [owner, repo] = match[1].split('/');
                const { score, latency } = await calculateGitHubLicenseMetric(owner, repo, process.env.GITHUB_TOKEN || '');

                // Calculate total latency
                const end = performance.now(); // Record end time
                const totalLatency = end - start + latency; // Add latencies if needed

                return { score, latency: totalLatency };
            }
        }

        const end = performance.now(); // Record end time if no GitHub repo is found
        const latency = end - start; // Calculate latency
        return { score: 0, latency }; // If no GitHub repo is found, assume no license

    } catch (error) {
        let errorMessage = "Failed to calculate license metric for npm package";
        if (error instanceof Error) {
           
        }
       
        const end = performance.now(); // Record end time in case of error
        const latency = end - start; // Calculate latency

        // Return default values for score and latency in case of error
        return { score: 0, latency };
    }
};

