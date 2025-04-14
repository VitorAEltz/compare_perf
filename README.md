# Performance Comparison Script

This script is designed to compare the performance of two different API endpoints: Cloudflare and Azion. It sends a series of requests to each endpoint and measures the response times, providing a detailed comparison of their performance.

## Getting Started

### Prerequisites

- Node.js and npm should be installed on your system. You can download them from [nodejs.org](https://nodejs.org/).
- Ensure you have internet access to reach the API endpoints.

### Installation

1. Clone this repository to your local machine:
   ```bash
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```bash
   cd <project-directory>
   ```

3. Install the required dependencies:
   ```bash
   npm install
   ```

### Configuration

- The script uses hardcoded API URLs and authorization tokens. Ensure these are correct and have the necessary permissions to access the endpoints.
- Update the `cloudflareURL`, `cfHeaders`, `azionURL`, and `azionHeaders` in `compare.js` if needed.

### Running the Script

To execute the performance comparison, run the following command:
```bash
node compare.js
```

### Output

- The script will output the duration of each request to the console.
- A summary table will be printed, showing the minimum, maximum, and average response times for both endpoints.

### Troubleshooting

- Ensure that the API endpoints are accessible and the authorization tokens are valid.
- Check for any network issues that might affect the performance results.

### License

This project is licensed under the MIT License. See the LICENSE file for details. 