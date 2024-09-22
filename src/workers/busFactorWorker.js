const { parentPort, workerData } = require('worker_threads');
const bm = require('../../dist/BusFactor');

(async () => {
    try {
        let result;

        if (workerData.type === 'npm') {
            result = await bm.calculateNpmBusFactor(workerData.packageName);
        } else if (workerData.type === 'github') {

            result = await bm.calculateBusFactor(workerData.owner, workerData.repo, process.env.GITHUB_TOKEN || '');
        }

        parentPort.postMessage({ success: true, data: result });
    } catch (error) {
        parentPort.postMessage({ success: false, error: error.message });
    }
})();
