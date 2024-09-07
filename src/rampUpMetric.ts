import * as fs from 'fs';
import * as path from 'path';


// Function to calculate the ramp-up time score
export function calculateRampUpMetric(repoPath: string): number {
    // Check if the repository has a README file
    const readmePath = path.join(repoPath, 'README.md');
    let rampUpScore = 0;

    // Give a score based on the presence and size of the README
    if (fs.existsSync(readmePath)) {
        const stats = fs.statSync(readmePath);
        const fileSizeInKB = stats.size / 1024; // Size in KB

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

    return rampUpScore;
}
