'use client';

import { useState, useEffect } from 'react';
import { SubgraphManager } from '@/components/subgraph-manager';
import { QueryManager } from '@/components/query-manager';
import { QueryExecutor } from '@/components/query-executor';
import { QueryHistory } from '@/components/query-history';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
import { Trash2, Database, Code, History, Settings } from 'lucide-react';
import { clearAllData } from '@/lib/storage';
import { Subgraph, Query } from '@/lib/types';

export default function HomePage() {
  const [subgraphs, setSubgraphs] = useState<Subgraph[]>([]);
  const [queries, setQueries] = useState<Query[]>([]);
  const [selectedSubgraph, setSelectedSubgraph] = useState<Subgraph | null>(
    null
  );
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    const loadData = () => {
      const storedSubgraphs = JSON.parse(
        localStorage.getItem('subgraph-debugger-subgraphs') || '[]'
      );
      const storedQueries = JSON.parse(
        localStorage.getItem('subgraph-debugger-queries') || '[]'
      );

      setSubgraphs(storedSubgraphs);
      setQueries(storedQueries);

      // Set first subgraph as selected if available
      if (storedSubgraphs.length > 0 && !selectedSubgraph) {
        setSelectedSubgraph(storedSubgraphs[0]);
      }
    };

    loadData();
  }, [selectedSubgraph]);

  const handleSubgraphsChange = (newSubgraphs: Subgraph[]) => {
    setSubgraphs(newSubgraphs);
    localStorage.setItem(
      'subgraph-debugger-subgraphs',
      JSON.stringify(newSubgraphs)
    );

    // Update selected subgraph if it was deleted
    if (
      selectedSubgraph &&
      !newSubgraphs.find((s) => s.id === selectedSubgraph.id)
    ) {
      setSelectedSubgraph(newSubgraphs[0] || null);
    }
  };

  const handleQueriesChange = (newQueries: Query[]) => {
    setQueries(newQueries);
    localStorage.setItem(
      'subgraph-debugger-queries',
      JSON.stringify(newQueries)
    );

    // Update selected query if it was deleted
    if (selectedQuery && !newQueries.find((q) => q.id === selectedQuery.id)) {
      setSelectedQuery(null);
    }
  };

  const handleClearAllData = () => {
    clearAllData();
    setSubgraphs([]);
    setQueries([]);
    setSelectedSubgraph(null);
    setSelectedQuery(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Subgraph Debugger</h1>
          </div>
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear All Data</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all subgraphs, queries, and
                    history stored in your browser. This action cannot be
                    undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearAllData}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Clear All Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="subgraphs" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger
              value="subgraphs"
              className="flex items-center space-x-2"
            >
              <Database className="h-4 w-4" />
              <span>Subgraphs</span>
            </TabsTrigger>
            <TabsTrigger
              value="queries"
              className="flex items-center space-x-2"
            >
              <Code className="h-4 w-4" />
              <span>Queries</span>
            </TabsTrigger>
            <TabsTrigger
              value="execute"
              className="flex items-center space-x-2"
            >
              <Settings className="h-4 w-4" />
              <span>Execute</span>
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex items-center space-x-2"
            >
              <History className="h-4 w-4" />
              <span>History</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subgraphs" className="space-y-6">
            <Card>
              <CardContent>
                <SubgraphManager
                  subgraphs={subgraphs}
                  onSubgraphsChange={handleSubgraphsChange}
                  selectedSubgraph={selectedSubgraph}
                  onSubgraphSelect={setSelectedSubgraph}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="queries" className="space-y-6">
            <Card>
              <CardContent>
                <QueryManager
                  queries={queries}
                  onQueriesChange={handleQueriesChange}
                  selectedQuery={selectedQuery}
                  onQuerySelect={setSelectedQuery}
                  selectedSubgraph={selectedSubgraph}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="execute" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Query Execution</CardTitle>
                <CardDescription>
                  Execute queries against your subgraphs and view results with
                  validation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QueryExecutor
                  selectedSubgraph={selectedSubgraph}
                  selectedQuery={selectedQuery}
                  queries={queries}
                  onQuerySelect={setSelectedQuery}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardContent>
                <QueryHistory />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
