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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
// Define the GitHub repository owner and name
const owner = 'aryansri0208'; // Replace with the actual owner of the repository
const repo = 'ECE-46100-Project'; // Replace with the actual repository name
// Define the GitHub API URL to fetch repository data
const url = `https://api.github.com/repos/${owner}/${repo}`;
// Function to fetch repository data from GitHub API
function fetchRepoData() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield (0, node_fetch_1.default)(url, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            if (response.ok) {
                const data = yield response.json();
                console.log('Repository Data:', data);
            }
            else {
                console.log(`Error: ${response.status} ${response.statusText}`);
            }
        }
        catch (error) {
            console.error('Failed to fetch repository data:', error);
        }
    });
}
// Call the function to fetch repository data
fetchRepoData();
