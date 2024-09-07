import fetch from 'node-fetch';

// Define the GitHub repository owner and name
const owner = 'aryansri0208'; // Replace with the actual owner of the repository
const repo = 'ECE-46100-Project';   // Replace with the actual repository name

// Define the GitHub API URL to fetch repository data
const url = `https://api.github.com/repos/${owner}/${repo}`;

// Function to fetch repository data from GitHub API
async function fetchRepoData() {
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Repository Data:', data);
    } else {
      console.log(`Error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Failed to fetch repository data:', error);
  }
}

// Call the function to fetch repository data
fetchRepoData();
