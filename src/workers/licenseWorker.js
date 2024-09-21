const { parentPort, workerData } = require('worker_threads');
const { calculateGitHubLicenseMetric, calculateNpmLicenseMetric } = require('../../dist/License_Check');

(async () => {
    if (workerData.type === 'npm') {
        const result = await calculateNpmLicenseMetric(workerData.packageName);
        parentPort.postMessage(result);
    } else if (workerData.type === 'github') {
        const result = await calculateGitHubLicenseMetric(workerData.owner, workerData.repo, process.env.GITHUB_TOKEN || '');
        parentPort.postMessage(result);
    }
})();