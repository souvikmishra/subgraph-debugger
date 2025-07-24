export interface Subgraph {
  id: string;
  name: string;
  url: string;
  apiKeyEnvVar: string;
  createdAt: number;
}

export interface Query {
  id: string;
  subgraphId: string;
  name: string;
  query: string;
  parameters: QueryParameter[];
  validationFunction?: string;
  createdAt: number;
  updatedAt: number;
}

export interface QueryParameter {
  id: string;
  name: string;
  value: string;
  type: 'string' | 'number' | 'boolean';
  description?: string;
}

export interface QueryResult {
  id: string;
  queryId: string;
  subgraphId: string;
  data: Record<string, unknown>;
  error?: string;
  executionTime: number;
  timestamp: number;
  validationResult?: ValidationResult;
}

export interface ValidationResult {
  passed: boolean;
  results: ValidationCheck[];
  executionTime: number;
  error?: string;
}

export interface ValidationCheck {
  name: string;
  passed: boolean;
  lhs?: unknown;
  rhs?: unknown;
  message?: string;
  debugVariables?: Record<string, unknown>;
}

export interface QueryHistory {
  id: string;
  queryId: string;
  subgraphId: string;
  parameters: Record<string, string>;
  result: QueryResult;
  timestamp: number;
}
