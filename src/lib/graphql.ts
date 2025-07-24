import { Query, QueryParameter, ValidationResult } from './types';

export interface ExecuteQueryOptions {
  query: Query;
  parameters: Record<string, string>;
  subgraphUrl: string;
  apiKey?: string;
}

export interface ExecuteQueryResult {
  data: Record<string, unknown>;
  error?: string;
  executionTime: number;
}

export const executeQuery = async (
  options: ExecuteQueryOptions
): Promise<ExecuteQueryResult> => {
  const { query, parameters, subgraphUrl, apiKey } = options;

  try {
    // Replace parameters in the query
    let processedQuery = query.query;
    Object.entries(parameters).forEach(([key, value]) => {
      const regex = new RegExp(`\\$\\{${key}\\}`, 'g');

      // Find the parameter definition to get its type
      const parameter = query.parameters.find((p) => p.name === key);
      const paramType = parameter?.type || 'string';

      // Apply type-appropriate substitution
      let processedValue = value;
      if (paramType === 'number' || paramType === 'boolean') {
        // Don't quote numbers or booleans
        processedValue = value;
      } else {
        // Quote strings
        processedValue = `"${value}"`;
      }

      processedQuery = processedQuery.replace(regex, processedValue);
    });

    // Use the API route instead of direct GraphQL request
    const response = await fetch('/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: processedQuery,
        variables: {},
        subgraphUrl,
        apiKeyEnvVar: apiKey, // Pass the environment variable name
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        data: {},
        error: result.error || 'Failed to execute query',
        executionTime: 0,
      };
    }

    return {
      data: result.data || {},
      error: result.error,
      executionTime: result.executionTime || 0,
    };
  } catch (error) {
    return {
      data: {},
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      executionTime: 0,
    };
  }
};

export const extractParametersFromQuery = (
  queryString: string
): QueryParameter[] => {
  const parameterRegex = /\$\{([^}]+)\}/g;
  const parameters: QueryParameter[] = [];
  const seen = new Set<string>();

  let match;
  while ((match = parameterRegex.exec(queryString)) !== null) {
    const paramName = match[1];
    if (!seen.has(paramName)) {
      seen.add(paramName);

      // Determine parameter type based on context
      const beforeMatch = queryString.substring(0, match.index);
      const numericPatterns = [
        /block:\s*\{number:\s*$/,
        /amount_gt:\s*$/,
        /amount_gte:\s*$/,
        /amount_lt:\s*$/,
        /amount_lte:\s*$/,
        /count:\s*$/,
        /limit:\s*$/,
        /offset:\s*$/,
        /first:\s*$/,
        /skip:\s*$/,
      ];

      const isNumericContext = numericPatterns.some((pattern) =>
        pattern.test(beforeMatch)
      );

      const paramType = isNumericContext ? 'number' : 'string';

      parameters.push({
        id: crypto.randomUUID(),
        name: paramName,
        value: '',
        type: paramType,
        description: `Parameter: ${paramName} (${paramType})`,
      });
    }
  }

  return parameters;
};

export const validateQuery = (
  queryString: string
): { isValid: boolean; error?: string } => {
  if (!queryString.trim()) {
    return { isValid: false, error: 'Query cannot be empty' };
  }

  // Basic GraphQL validation - check for common syntax issues
  const trimmed = queryString.trim();

  if (!trimmed.startsWith('{') && !trimmed.startsWith('query')) {
    return {
      isValid: false,
      error: 'Query must start with { or query keyword',
    };
  }

  if (!trimmed.includes('{') || !trimmed.includes('}')) {
    return {
      isValid: false,
      error: 'Query must contain opening and closing braces',
    };
  }

  return { isValid: true };
};

export const executeValidationFunction = (
  validationFunction: string,
  data: Record<string, unknown>
): ValidationResult => {
  const startTime = Date.now();

  try {
    // Create a debug object to capture variables
    const debugVars: Record<string, unknown> = {};

    // Create a debug function that can be used in validation functions
    const debug = (name: string, value: unknown) => {
      debugVars[name] = value;
    };

    // Create a safe execution environment with debug function
    const func = new Function('data', 'debug', validationFunction);
    const result = func(data, debug);

    return {
      passed: Boolean(result),
      results: [
        {
          name: 'Custom Validation',
          passed: Boolean(result),
          lhs: data,
          rhs: result,
          message: result ? 'Validation passed' : 'Validation failed',
          debugVariables:
            Object.keys(debugVars).length > 0 ? debugVars : undefined,
        },
      ],
      executionTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      passed: false,
      results: [
        {
          name: 'Custom Validation',
          passed: false,
          lhs: data,
          rhs: null,
          message:
            error instanceof Error
              ? error.message
              : 'Validation function error',
        },
      ],
      executionTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
