import { execSync } from 'child_process';

// Function to calculate the bus factor score based on Git history
export function calculateBusFactorMetric(repoPath: string): number {
    let busFactorScore = 0;

    try {
        // Get a list of unique contributors from the Git log
        const contributors = execSync(
            `git shortlog -sn < /dev/null`,
            { cwd: repoPath }
        )
            .toString()
            .split('\n')
            .filter(line => line.trim() !== '')
            .map(line => line.trim().split('\t')[1]);

        const numberOfContributors = contributors.length;

        // Give a score based on the number of contributors
        if (numberOfContributors >= 10) {
            busFactorScore += 10; // High bus factor, low risk
        } else if (numberOfContributors >= 5) {
            busFactorScore += 7; // Medium bus factor, moderate risk
        } else if (numberOfContributors > 1) {
            busFactorScore += 3; // Low bus factor, higher risk
        } else {
            busFactorScore += 1; // Single contributor, very high risk
        }
    } catch (error) {
        console.error("Error calculating bus factor:", error);
        busFactorScore += 1; // If there's an error, assume poor bus factor
    }

    return busFactorScore;
}
