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
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateRampUpMetric = calculateRampUpMetric;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Function to calculate the ramp-up time score
function calculateRampUpMetric(repoPath) {
    // Check if the repository has a README file
    const readmePath = path.join(repoPath, 'README.md');
    let rampUpScore = 0;
    // Give a score based on the presence and size of the README
    if (fs.existsSync(readmePath)) {
        const stats = fs.statSync(readmePath);
        const fileSizeInKB = stats.size / 1024; // Size in KB
        if (fileSizeInKB > 50) {
            rampUpScore += 10; // Large README implies good documentation
        }
        else if (fileSizeInKB > 20) {
            rampUpScore += 7; // Medium README
        }
        else {
            rampUpScore += 3; // Small README
        }
    }
    else {
        rampUpScore += 1; // No README, poor documentation
    }
    return rampUpScore;
}
