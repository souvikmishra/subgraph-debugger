'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Query, Subgraph, QueryResult, ValidationResult } from '@/lib/types';
import { executeQuery, executeValidationFunction } from '@/lib/graphql';
import { addHistoryEntry } from '@/lib/storage';

interface QueryExecutorProps {
  selectedSubgraph: Subgraph | null;
  selectedQuery: Query | null;
  queries: Query[];
  onQuerySelect?: (query: Query | null) => void;
}

export function QueryExecutor({
  selectedSubgraph,
  selectedQuery,
  queries,
  onQuerySelect,
}: QueryExecutorProps) {
  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);

  const subgraphQueries = selectedSubgraph
    ? queries.filter((q) => q.subgraphId === selectedSubgraph.id)
    : [];

  const handleParameterChange = (paramName: string, value: string) => {
    setParameters((prev) => ({
      ...prev,
      [paramName]: value,
    }));
  };

  const handleExecuteQuery = async () => {
    if (!selectedSubgraph || !selectedQuery) return;

    setIsExecuting(true);
    setResult(null);
    setValidationResult(null);

    try {
      const queryResult = await executeQuery({
        query: selectedQuery,
        parameters,
        subgraphUrl: selectedSubgraph.url,
        apiKey: selectedSubgraph.apiKeyEnvVar, // Pass the environment variable name
      });

      const resultData: QueryResult = {
        id: crypto.randomUUID(),
        queryId: selectedQuery.id,
        subgraphId: selectedSubgraph.id,
        data: queryResult.data,
        error: queryResult.error,
        executionTime: queryResult.executionTime,
        timestamp: Date.now(),
      };

      setResult(resultData);

      // Execute validation if available
      if (selectedQuery.validationFunction && !queryResult.error) {
        const validation = executeValidationFunction(
          selectedQuery.validationFunction,
          queryResult.data
        );
        setValidationResult(validation);
        resultData.validationResult = validation;
      }

      // Add to history
      addHistoryEntry({
        id: crypto.randomUUID(),
        queryId: selectedQuery.id,
        subgraphId: selectedSubgraph.id,
        parameters,
        result: resultData,
        timestamp: Date.now(),
      });
    } catch (error) {
      setResult({
        id: crypto.randomUUID(),
        queryId: selectedQuery.id,
        subgraphId: selectedSubgraph.id,
        data: {},
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        executionTime: 0,
        timestamp: Date.now(),
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const formatData = (data: Record<string, unknown>, depth = 0): string => {
    if (depth > 10) return '... (max depth reached)';

    if (data === null) return 'null';
    if (data === undefined) return 'undefined';
    if (typeof data === 'string') return `"${data}"`;
    if (typeof data === 'number' || typeof data === 'boolean')
      return String(data);

    if (Array.isArray(data)) {
      if (data.length === 0) return '[]';
      return `[\n${data
        .map(
          (item) =>
            '  '.repeat(depth + 1) +
            formatData(item as unknown as Record<string, unknown>, depth + 1)
        )
        .join(',\n')}\n${'  '.repeat(depth)}]`;
    }

    if (typeof data === 'object') {
      const keys = Object.keys(data);
      if (keys.length === 0) return '{}';

      return `{\n${keys
        .map((key) => {
          const value = formatData(
            (data as Record<string, unknown>)[key] as Record<string, unknown>,
            depth + 1
          );
          return '  '.repeat(depth + 1) + `"${key}": ${value}`;
        })
        .join(',\n')}\n${'  '.repeat(depth)}}`;
    }

    return String(data);
  };

  if (!selectedSubgraph) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Subgraph Selected</h3>
          <p className="text-muted-foreground text-center">
            Select a subgraph first to execute queries.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!selectedQuery) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Query Selected</h3>
          <p className="text-muted-foreground text-center mb-4">
            Select a query to execute against {selectedSubgraph.name}.
          </p>
          {subgraphQueries.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Available Queries:</p>
              <div className="flex flex-wrap gap-2">
                {subgraphQueries.map((query) => (
                  <Button
                    key={query.id}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onQuerySelect?.(query);
                    }}
                  >
                    {query.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Query Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Query Selection</CardTitle>
          <CardDescription>
            Select a query to execute against {selectedSubgraph.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedQuery.id}
            onValueChange={(value) => {
              const query = queries.find((q) => q.id === value);
              if (query) {
                // Reset parameters when query changes
                setParameters({});
                setResult(null);
                setValidationResult(null);
                // Update the selected query
                onQuerySelect?.(query);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a query" />
            </SelectTrigger>
            <SelectContent>
              {subgraphQueries.map((query) => (
                <SelectItem key={query.id} value={query.id}>
                  {query.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Parameters */}
      {selectedQuery.parameters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Parameters</CardTitle>
            <CardDescription>
              Set values for the query parameters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {selectedQuery.parameters.map((param) => (
                <div key={param.id}>
                  <Label htmlFor={param.name}>{param.name}</Label>
                  <Input
                    id={param.name}
                    value={parameters[param.name] || ''}
                    onChange={(e) =>
                      handleParameterChange(param.name, e.target.value)
                    }
                    placeholder={`Enter ${param.name}`}
                  />
                  {param.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {param.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Execute Button */}
      <Card>
        <CardContent className="pt-6">
          <Button
            onClick={handleExecuteQuery}
            disabled={isExecuting}
            className="w-full"
          >
            {isExecuting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Execute Query
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Results</CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant={result.error ? 'destructive' : 'success'}>
                  {result.error ? 'HTTP Error' : '200 OK'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {result.executionTime}ms
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="validation" className="w-full">
              <TabsList>
                {validationResult && (
                  <TabsTrigger value="validation">Validation</TabsTrigger>
                )}
                <TabsTrigger value="data">Data</TabsTrigger>
              </TabsList>

              <TabsContent value="data" className="space-y-4">
                {result.error ? (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <div className="flex items-center space-x-2 text-destructive">
                      <XCircle className="h-4 w-4" />
                      <span className="font-medium">Error</span>
                    </div>
                    <p className="mt-2 text-sm">{result.error}</p>
                  </div>
                ) : (
                  <ScrollArea className="h-96 w-full rounded-md border p-4">
                    <pre className="text-sm font-mono whitespace-pre-wrap">
                      {formatData(result.data)}
                    </pre>
                  </ScrollArea>
                )}
              </TabsContent>

              {validationResult && (
                <TabsContent value="validation" className="space-y-4">
                  <div className="flex items-center space-x-2">
                    {validationResult.passed ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="font-medium">
                      Validation {validationResult.passed ? 'Passed' : 'Failed'}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({validationResult.executionTime}ms)
                    </span>
                  </div>

                  {validationResult.error && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <p className="text-sm text-destructive">
                        {validationResult.error}
                      </p>
                    </div>
                  )}

                  {validationResult.results.length > 0 && (
                    <div className="space-y-2">
                      {validationResult.results.map((check, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border ${
                            check.passed
                              ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                              : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            {check.passed ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="font-medium">{check.name}</span>
                          </div>
                          {check.message && (
                            <p className="text-sm mt-1">{check.message}</p>
                          )}
                          {check.debugVariables && (
                            <div className="mt-3 p-3 bg-muted/50 rounded border">
                              <p className="text-xs font-medium text-muted-foreground mb-2">
                                Debug Variables:
                              </p>
                              <div className="space-y-1">
                                {Object.entries(check.debugVariables).map(
                                  ([key, value]) => (
                                    <div
                                      key={key}
                                      className="flex justify-between text-xs"
                                    >
                                      <span className="font-mono text-muted-foreground">
                                        {key}:
                                      </span>
                                      <span className="font-mono">
                                        {typeof value === 'string'
                                          ? value
                                          : JSON.stringify(value, null, 2)}
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
