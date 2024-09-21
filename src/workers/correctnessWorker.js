const { parentPort, workerData } = require('worker_threads');
const cm = require('../../dist/correctnessMetric');

(async () => {
    if (workerData.type === 'npm') {
        const result = await cm.calculateNpmCorrectness(workerData.packageName);
        parentPort.postMessage(result);
    } else if (workerData.type === 'github') {
        const result = await cm.calculateGitHubCorrectness(workerData.owner, workerData.repo, process.env.GITHUB_TOKEN || '');
        parentPort.postMessage(result);
    }
})();