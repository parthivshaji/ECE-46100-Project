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
exports.calculateLicenseMetric = calculateLicenseMetric;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Function to check if a license file exists and is valid
function calculateLicenseMetric(repoPath) {
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
        }
        else {
            licenseScore += 7; // Moderate score for valid but shorter license
        }
    }
    else {
        licenseScore += 1; // Low score for missing license
    }
    return licenseScore;
}
