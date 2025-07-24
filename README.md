# Subgraph Debugger

A modern, feature-rich testing suite tool for querying and debugging subgraph data quickly. Built with Next.js, TypeScript, and shadcn/ui.

## Features

- **Multi-Subgraph Support**: Manage multiple subgraphs with easy configuration
- **Dynamic Query Management**: Create, edit, and organize GraphQL queries per subgraph
- **Parameter Extraction**: Automatically extract and manage query parameters
- **Custom Validation**: Write JavaScript functions to validate query results
- **Execution History**: Track and review all query executions
- **Modern UI**: Clean, responsive interface with dark/light mode support
- **Browser Storage**: All data stored locally in your browser for privacy
- **Code Editors**: Professional GraphQL and JavaScript editors with syntax highlighting

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- The Graph Studio API keys

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd subgraph-debugger
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp example.env .env
```

4. Edit `.env` and add your API keys:

```env
MY_SUBGRAPH_API_KEY=your_actual_api_key_here
MARLIN_STAKING_API_KEY=your_actual_api_key_here
```

5. Start the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### 1. Adding Subgraphs

1. Go to the "Subgraphs" tab
2. Click "Add Subgraph"
3. Fill in:
   - **Name**: A descriptive name for your subgraph
   - **URL**: The GraphQL endpoint URL from The Graph Studio
   - **API Key Variable**: The environment variable name for your API key
4. Copy the generated environment variable template to your `.env` file
5. Add your actual API key to the `.env` file

### 2. Creating Queries

1. Select a subgraph
2. Go to the "Queries" tab
3. Click "Add Query"
4. Fill in:
   - **Query Name**: A descriptive name for your query
   - **GraphQL Query**: Your GraphQL query with parameters using `${parameterName}` syntax
   - **Validation Function** (optional): JavaScript code to validate results

#### Example Query with Parameters:

```graphql
{
  delegators(
    where: { address: \${address} }
    block: { number: \${blockNumber} }
  ) {
    pendingRewards(where: { amount_gt: \${minAmount} }) {
      amount
    }
    totalPendingReward
  }
}
```

**Parameter Types:**

- **String parameters** (like `address`) are automatically quoted
- **Numeric parameters** (like `blockNumber`, `amount_gt`) are not quoted
- Parameter types are automatically detected based on context

#### Example Validation Function:

```javascript
// Return true if validation passes, false otherwise
// The 'data' parameter contains the direct GraphQL response
// Use debug(name, value) to capture variables for inspection

const delegators = data.delegators;
if (!delegators || delegators.length === 0) {
  return false;
}

const pendingRewards = delegators[0].pendingRewards;
if (!pendingRewards || pendingRewards.length === 0) {
  return false;
}

// Capture debug variables
const amounts = pendingRewards.map((entry) => BigInt(entry.amount));
const totalSum = amounts.reduce((acc, val) => acc + val, 0n);
const totalPending = BigInt(delegators[0].totalPendingReward);

debug(
  'individual_amounts',
  amounts.map((a) => a.toString())
);
debug('total_sum', totalSum.toString());
debug('total_pending', totalPending.toString());
debug('comparison_result', totalSum === totalPending);

return totalSum === totalPending;
```

### 3. Executing Queries

1. Go to the "Execute" tab
2. Select a query to execute
3. Fill in the parameter values
4. Click "Execute Query"
5. View results and validation status
6. Check debug variables in validation results for detailed insights

### 4. Viewing History

1. Go to the "History" tab
2. Browse all executed queries
3. View detailed results, parameters, and validation outcomes
4. Delete individual entries or clear all history

## Environment Variables

The tool uses environment variables for API keys. Each subgraph gets its own environment variable:

- Variable format: `SUBGRAPH_NAME_API_KEY`
- Example: `MARLIN_STAKING_API_KEY=your_api_key_here`

## Debug Variables

When writing validation functions, you can use the `debug(name, value)` function to capture variables for inspection. These variables will be displayed in the validation results, helping you understand what values were compared and why a validation passed or failed.

### Example:

```javascript
// Capture intermediate values
const amounts = data.delegators[0].pendingRewards.map((entry) =>
  BigInt(entry.amount)
);
debug(
  'individual_amounts',
  amounts.map((a) => a.toString())
);

const totalSum = amounts.reduce((acc, val) => acc + val, 0n);
debug('total_sum', totalSum.toString());

const totalPending = BigInt(data.delegators[0].totalPendingReward);
debug('total_pending', totalPending.toString());

debug('comparison_result', totalSum === totalPending);
return totalSum === totalPending;
```

## Parameter Types

The tool automatically detects parameter types based on their usage context:

### **String Parameters**

Used for addresses, IDs, and text values:

```graphql
where: { address: \${address} }
```

### **Numeric Parameters**

Used for block numbers, amounts, limits, and counts:

```graphql
block: { number: \${blockNumber} }
amount_gt: \${minAmount}
limit: \${count}
```

### **Automatic Detection**

The system automatically detects parameter types based on common GraphQL patterns:

- `block: {number: ...}` → numeric
- `amount_gt: ...` → numeric
- `limit: ...` → numeric
- `first: ...` → numeric
- `skip: ...` → numeric
- `count: ...` → numeric
- All others → string

## Data Storage

All data is stored locally in your browser's localStorage:

- Subgraph configurations
- Queries and parameters
- Execution history
- Validation functions

You can clear all data using the trash icon in the header.

## Built-in Example Queries

The tool comes with two example queries for testing:

### 1. Pending Rewards

```graphql
{
  delegators(where: { address: \${address} }) {
    pendingRewards(where: { amount_gt: 0 }) {
      amount
    }
    totalPendingReward
  }
}
```

### 2. Rewards Claimed

```graphql
{
  delegators(
    where: { address: \${address} }
    block: { number: \${blockNumber} }
  ) {
    historicalRewardWithdrawl {
      amount
    }
    totalRewardsClaimed
  }
}
```

## Development

### Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Query
- **GraphQL**: graphql-request
- **Icons**: Lucide React

### Project Structure

```
src/
├── app/                 # Next.js app directory
│   ├── layout.tsx      # Root layout with providers
│   ├── page.tsx        # Main dashboard page
│   └── providers.tsx   # React Query provider
├── components/         # React components
│   ├── ui/            # shadcn/ui components
│   ├── subgraph-manager.tsx
│   ├── query-manager.tsx
│   ├── query-executor.tsx
│   ├── query-history.tsx
│   └── theme-toggle.tsx
└── lib/               # Utilities and types
    ├── types.ts       # TypeScript interfaces
    ├── storage.ts     # localStorage utilities
    ├── graphql.ts     # GraphQL utilities
    └── utils.ts       # General utilities
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
