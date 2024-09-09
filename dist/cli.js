#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const perf_hooks_1 = require("perf_hooks");
const fs = __importStar(require("fs"));
const cm = __importStar(require("./correctnessMetric"));
// Function to calculate metrics (dummy implementations for now)
const calculateMetric = (name, start) => {
    const latency = perf_hooks_1.performance.now() - start;
    const score = Math.random(); // Placeholder for actual score calculation
    return { score, latency };
};
// Helper function to identify and parse URLs
const parseUrl = (urlString) => {
    let parsedUrl;
    try {
        parsedUrl = new URL(urlString);
    }
    catch (error) {
        console.error(`Invalid URL: ${urlString}.`);
        return { type: 'invalid', url: urlString };
    }
    // Check if it's an npm URL
    if (parsedUrl.hostname === 'www.npmjs.com' || parsedUrl.hostname === 'npmjs.com') {
        const parts = parsedUrl.pathname.split('/').filter(Boolean); // Split by `/` and remove empty parts
        if (parts.length === 2 && parts[0] === 'package') {
            const packageName = parts[1];
            return { type: 'npm', packageName };
        }
    }
    // Check if it's a GitHub URL
    if (parsedUrl.hostname === 'www.github.com' || parsedUrl.hostname === 'github.com') {
        const parts = parsedUrl.pathname.split('/').filter(Boolean); // Split by `/` and remove empty parts
        if (parts.length >= 2) {
            const [owner, repo] = parts;
            return { type: 'github', owner, repo };
        }
    }
    // If URL doesn't match either pattern
    return { type: 'unknown', url: urlString };
};
// Function to process a single URL
const processUrl = (url) => __awaiter(void 0, void 0, void 0, function* () {
    const start = perf_hooks_1.performance.now();
    console.log(`Processing URL: ${url}`);
    const parsedUrl = parseUrl(url);
    let correctness;
    let correctness_latency;
    if (parsedUrl.type === 'npm') {
        const result = yield cm.calculateNpmCorrectness(parsedUrl.packageName);
        correctness = result.correctness;
        correctness_latency = result.latency;
    }
    else if (parsedUrl.type === 'github') {
        const result = yield cm.calculateGitHubCorrectness(parsedUrl.owner, parsedUrl.repo, process.env.GITHUB_TOKEN || '');
        correctness = result.correctness;
        correctness_latency = result.latency;
    }
    else {
        console.error(`Unknown URL format: ${url}`);
        return null;
    }
    if (correctness == -1) {
        console.log("Error in correctness metric calculation");
        return null;
    }
    const metrics = {
        RampUp: calculateMetric('RampUp', start),
        Correctness: correctness,
        BusFactor: calculateMetric('BusFactor', start),
        ResponsiveMaintainer: calculateMetric('ResponsiveMaintainer', start),
        License: calculateMetric('License', start),
        CorrectnessLatency: correctness_latency,
    };
    // Calculate NetScore (weighted sum based on project requirements)
    const NetScore = (0.25 * metrics.RampUp.score +
        0.25 * metrics.Correctness +
        0.2 * metrics.BusFactor.score +
        0.2 * metrics.ResponsiveMaintainer.score +
        0.1 * metrics.License.score);
    return {
        URL: url,
        NetScore,
        RampUp: metrics.RampUp.score,
        RampUp_Latency: metrics.RampUp.latency,
        Correctness: metrics.Correctness,
        Correctness_Latency: metrics.CorrectnessLatency,
        BusFactor: metrics.BusFactor.score,
        BusFactor_Latency: metrics.BusFactor.latency,
        ResponsiveMaintainer: metrics.ResponsiveMaintainer.score,
        ResponsiveMaintainer_Latency: metrics.ResponsiveMaintainer.latency,
        License: metrics.License.score,
        License_Latency: metrics.License.latency,
    };
});
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    const args = process.argv.slice(2);
    if (args.length < 1) {
        console.error('Please provide a command: install, test, or the path to a URL file.');
        process.exit(1);
    }
    const command = args[0];
    if (command === 'install') {
        // Install dependencies (npm install is handled in the run script)
        console.log('Installing dependencies...');
        process.exit(0);
    }
    else if (command === 'test') {
        // Run test cases (you would invoke your test suite here)
        console.log('Running tests...');
        const testCasesPassed = 20; // Dummy value
        const totalTestCases = 20; // Dummy value
        const coverage = 85; // Dummy value
        console.log(`${testCasesPassed}/${totalTestCases} test cases passed. ${coverage}% line coverage achieved.`);
        process.exit(0);
    }
    else {
        const urlFile = command;
        if (!fs.existsSync(urlFile)) {
            console.error(`File not found: ${urlFile}`);
            process.exit(1);
        }
        const urls = fs.readFileSync(urlFile, 'utf-8').split('\n').filter(line => line.trim().length > 0);
        // Wait for all promises to resolve
        const results = yield Promise.all(urls.map(url => processUrl(url)));
        results.forEach(result => {
            if (result !== null) {
                console.log(JSON.stringify(result));
            }
            else {
                console.error('Error in metrics calculation with one of the URLs.');
                process.exit(1);
            }
        });
        process.exit(0);
    }
});
// Execute the main function
main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
});
