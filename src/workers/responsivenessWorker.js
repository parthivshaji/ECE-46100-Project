const { parentPort, workerData } = require('worker_threads');
const resp = require('../../dist/responsivenessMetric');

(async () => {
    if (workerData.type === 'npm') {
        const result = await resp.calculateNpmResponsiveness(workerData.packageName);
        parentPort.postMessage(result);
    } else if (workerData.type === 'github') {
        const result = await resp.calculateGitResponsiveness(workerData.owner, workerData.repo, process.env.GITHUB_TOKEN || '');
        parentPort.postMessage(result);
    }
})();