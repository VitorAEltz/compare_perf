# Serverless SQL Database Comparison (Azion x Cloudflare x Turso)

This script is designed to compare the performance of three different SQL database providers: Cloudflare D1, Azion Edge SQL, and Turso. It sends a series of requests to each endpoint and measures the response times, providing a detailed comparison of their performance.

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

### Environment Variables

Create a `.env` file in the root of the project to store your API keys. Add the following lines to the `.env` file:

```
azion_token=your_azion_token_here
cloudflare_key=your_cloudflare_key_here
turso_token=your_turso_token_here
```

Replace the placeholders with your actual API keys for each provider.

### Running the Script

To execute the performance comparison for all providers, run the following command:
```bash
node compare.js
```

You can also run the tests for a specific provider by using one of these flags:
```bash
node compare.js --cf      # Test Cloudflare only
node compare.js --azion   # Test Azion only
node compare.js --turso   # Test Turso only
```

### Output

- The script will output the duration of each request to the console.
- A summary table will be printed, showing the following performance metrics for all three providers:
  - Minimum response time
  - Maximum response time
  - Average response time
  - P95 (95th percentile) response time
  - P99 (99th percentile) response time
- All results are also saved to an `output.txt` file for future reference.

### Troubleshooting

- Ensure that the API endpoints are accessible and the authorization tokens are valid.
- Check for any network issues that might affect the performance results.

### License

This project is licensed under the MIT License. See the LICENSE file for details. 