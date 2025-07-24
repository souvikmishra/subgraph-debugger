'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { History, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { QueryHistory as QueryHistoryType, Query, Subgraph } from '@/lib/types';
import { getHistory, deleteHistoryEntry, clearHistory } from '@/lib/storage';

export function QueryHistory() {
  const [history, setHistory] = useState<QueryHistoryType[]>([]);
  const [queries, setQueries] = useState<Query[]>([]);
  const [subgraphs, setSubgraphs] = useState<Subgraph[]>([]);

  useEffect(() => {
    const loadData = () => {
      const storedHistory = getHistory();
      const storedQueries = JSON.parse(
        localStorage.getItem('subgraph-debugger-queries') || '[]'
      );
      const storedSubgraphs = JSON.parse(
        localStorage.getItem('subgraph-debugger-subgraphs') || '[]'
      );

      setHistory(storedHistory);
      setQueries(storedQueries);
      setSubgraphs(storedSubgraphs);
    };

    loadData();

    // Listen for storage changes
    const handleStorageChange = () => {
      loadData();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleDeleteEntry = (id: string) => {
    deleteHistoryEntry(id);
    setHistory(getHistory());
  };

  const handleClearAllHistory = () => {
    clearHistory();
    setHistory([]);
  };

  const getQueryName = (queryId: string) => {
    const query = queries.find((q) => q.id === queryId);
    return query?.name || 'Unknown Query';
  };

  const getSubgraphName = (subgraphId: string) => {
    const subgraph = subgraphs.find((s) => s.id === subgraphId);
    return subgraph?.name || 'Unknown Subgraph';
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatData = (data: Record<string, unknown>, depth = 0): string => {
    if (depth > 5) return '... (max depth reached)';

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

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <History className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No History</h3>
          <p className="text-muted-foreground text-center mb-4">
            Execute some queries to see your history here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">
            Execution History ({history.length})
          </h3>
          <p className="text-sm text-muted-foreground">
            View and manage your query execution history
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear All History</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete all execution history? This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleClearAllHistory}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Clear All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* History List */}
      <div className="space-y-4">
        {history.map((entry) => (
          <Card key={entry.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <div>
                    <CardTitle className="text-base">
                      {getQueryName(entry.queryId)}
                    </CardTitle>
                    <CardDescription>
                      {getSubgraphName(entry.subgraphId)} •{' '}
                      {formatTimestamp(entry.timestamp)}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={entry.result.error ? 'destructive' : 'default'}
                  >
                    {entry.result.error ? 'Error' : 'Success'}
                  </Badge>
                  {entry.result.validationResult && (
                    <Badge
                      variant={
                        entry.result.validationResult.passed
                          ? 'default'
                          : 'destructive'
                      }
                    >
                      {entry.result.validationResult.passed
                        ? 'Validated'
                        : 'Failed'}
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {entry.result.executionTime}ms
                  </span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete History Entry
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this history entry?
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="data" className="w-full">
                <TabsList>
                  <TabsTrigger value="data">Data</TabsTrigger>
                  <TabsTrigger value="parameters">Parameters</TabsTrigger>
                  {entry.result.validationResult && (
                    <TabsTrigger value="validation">Validation</TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="data" className="space-y-4">
                  {entry.result.error ? (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <div className="flex items-center space-x-2 text-destructive">
                        <XCircle className="h-4 w-4" />
                        <span className="font-medium">Error</span>
                      </div>
                      <p className="mt-2 text-sm">{entry.result.error}</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-64 w-full rounded-md border p-4">
                      <pre className="text-sm font-mono whitespace-pre-wrap">
                        {formatData(entry.result.data)}
                      </pre>
                    </ScrollArea>
                  )}
                </TabsContent>

                <TabsContent value="parameters" className="space-y-4">
                  {Object.keys(entry.parameters).length === 0 ? (
                    <p className="text-muted-foreground">No parameters used</p>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(entry.parameters).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex justify-between items-center p-2 bg-muted rounded"
                        >
                          <span className="font-medium">{key}</span>
                          <span className="text-sm font-mono">{value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {entry.result.validationResult && (
                  <TabsContent value="validation" className="space-y-4">
                    <div className="flex items-center space-x-2">
                      {entry.result.validationResult.passed ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className="font-medium">
                        Validation{' '}
                        {entry.result.validationResult.passed
                          ? 'Passed'
                          : 'Failed'}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({entry.result.validationResult.executionTime}ms)
                      </span>
                    </div>

                    {entry.result.validationResult.error && (
                      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-sm text-destructive">
                          {entry.result.validationResult.error}
                        </p>
                      </div>
                    )}

                    {entry.result.validationResult.results.length > 0 && (
                      <div className="space-y-2">
                        {entry.result.validationResult.results.map(
                          (check, index) => (
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
                                <span className="font-medium">
                                  {check.name}
                                </span>
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
                          )
                        )}
                      </div>
                    )}
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
