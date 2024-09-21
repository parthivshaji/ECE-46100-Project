"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/metrics/correctnessWorker.ts
const worker_threads_1 = require("worker_threads");
const correctnessMetric_1 = require("./correctnessMetric"); // Adjust path as needed
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const { url, type, owner, repo, packageName } = worker_threads_1.workerData;
        let correctness;
        try {
            if (type === 'github') {
                const correctness = yield (0, correctnessMetric_1.calculateGitHubCorrectness)(owner, repo, process.env.GITHUB_TOKEN || '');
            }
            else if (type === 'npm') {
                const correctness = yield (0, correctnessMetric_1.calculateNpmCorrectness)(packageName);
            }
            worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.postMessage({ correctness });
        }
        catch (error) {
            if (error instanceof Error) {
                worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.postMessage({ error: error.message });
            }
            else {
                worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.postMessage({ error: String(error) }); // Fallback for non-Error objects
            }
        }
    });
}
run();
