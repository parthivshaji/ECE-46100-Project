const { parentPort, workerData } = require('worker_threads');
const ramp = require('../../dist/rampUpMetric');

(async () => {
    if (workerData.type === 'npm') {
        const result = await ramp.calculateNpmRampUpMetric(workerData.packageName);
        parentPort.postMessage(result);
    } else if (workerData.type === 'github') {
        const result = await ramp.calculateGitRampUpMetric(workerData.owner, workerData.repo, process.env.GITHUB_TOKEN || '');
        parentPort.postMessage(result);
    }
})();