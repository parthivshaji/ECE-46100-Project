import * as fs from 'fs';
import * as path from 'path';

// Function to check if a license file exists and is valid
export function calculateLicenseMetric(repoPath: string): number {
    // Common license filenames
    const licenseFilenames = ['LICENSE', 'LICENSE.txt', 'LICENSE.md', 'LICENSE.rst'];
    let licenseScore = 0;

    // Check if any common license files exist in the repository
    const licenseFile = licenseFilenames.find(filename => fs.existsSync(path.join(repoPath, filename)));

    if (licenseFile) {
        const licensePath = path.join(repoPath, licenseFile);
        const stats = fs.statSync(licensePath);
        const fileSizeInKB = stats.size / 1024; // Size in KB

        if (fileSizeInKB > 5) {
            // A larger license file may imply a comprehensive license
            licenseScore += 10; // High score for valid and comprehensive license
        } else {
            licenseScore += 7; // Moderate score for valid but shorter license
        }
    } else {
        licenseScore += 1; // Low score for missing license
    }

    return licenseScore;
}
