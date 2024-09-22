# ECE-46100-Project

Team Members:

Disha Maheshwari

Aryan Srivastava

Purva Grover

Parthiv Shaji
## Configuration

To install the necessary dependencies (for Linux users), run the following command:
```
./run install
```

To run the CLI and build the project, you can use the following commands:
```
./run <url-file>
```
To run the unit tests, run the following command: 
```
./run test
```

## Aim

The goal of this project is to calculate a score between 0 and 1 based on various metrics, as described in the documentation, for a given npm or GitHub repository. The repository link is provided through the command-line interface (CLI).
## Project Metrics Calculation

 The formulas used to calculate various metrics for evaluating repositories are outlined here

### 1. Correctness

- **Formula**:  
  ```
  Correctness Score = 1 - (Number of Bug Issues / Number of Downloads)
  ```
- **Description**:  
  The correctness score is calculated based on the number of bug issues in relation to the number of downloads. A lower ratio results in a higher score, indicating better correctness.

---

### 2. Ramp-up

- **Criteria**: The score is based on the size of the README file:
  - **Formula**:
    ```
    if README file size > 50 kb: score = 1.0
    if README file size > 20 kb and <= 50 kb: score = 0.7
    if README file size <= 20 kb: score = 0.3
    if README file not found: score = 0
    ```
- **Description**:  
  Larger README files generally indicate better documentation, which results in a higher score. If no README file is present, the score is 0.

---

### 3. Responsiveness

- **Formula**:
  ```
  Responsiveness Score = 1 - (Average Response Time in Days / Max(Response Time in Days, 365))
  ```
- **Description**:  
  This metric evaluates how quickly maintainers respond to issues or pull requests. A lower average response time leads to a higher score. The maximum possible response time is capped at 365 days.

---

### 4. License

- **Formula**:
  ```
  if license exists: score = 0
  if no license exists: score = 1
  ```
- **Description**:  
  A score of 1 is given if no valid license is found, while a score of 0 is assigned if a license is present. License should be from this list: (LGPL-2.1, LGPL-2.1 or later, MIT, BSD-2-Clause, BSD-3-Clause, Apache-2.0, Artistic-2.0)

---

### 5. Bus Factor

- **Description**:  
  The Bus Factor is a measure of project risk, representing the number of key contributors needed to keep the project running. A low Bus Factor indicates that a small number of individuals hold critical knowledge of the project, while a higher Bus Factor suggests that knowledge is spread across multiple contributors.

---

## Formula for Calculating Score
- **Formula**:
```
Score: 0.25 * license + 0.1 * Ramp Up time + 0.2 * Bus Factor + 0.25 * Correctness + 0.20 * Responsive Maintainer
```
