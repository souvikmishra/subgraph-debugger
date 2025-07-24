'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraphQLEditor } from '@/components/graphql-editor';
import { JavaScriptEditor } from '@/components/javascript-editor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Plus, Edit, Trash2, Code } from 'lucide-react';
import { Query, Subgraph } from '@/lib/types';
import { extractParametersFromQuery, validateQuery } from '@/lib/graphql';

interface QueryManagerProps {
  queries: Query[];
  onQueriesChange: (queries: Query[]) => void;
  selectedQuery: Query | null;
  onQuerySelect: (query: Query | null) => void;
  selectedSubgraph: Subgraph | null;
}

export function QueryManager({
  queries,
  onQueriesChange,
  selectedQuery,
  onQuerySelect,
  selectedSubgraph,
}: QueryManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingQuery, setEditingQuery] = useState<Query | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    query: '',
    validationFunction: '',
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  const subgraphQueries = selectedSubgraph
    ? queries.filter((q) => q.subgraphId === selectedSubgraph.id)
    : [];

  const handleAddQuery = () => {
    if (!selectedSubgraph || !formData.name || !formData.query) return;

    const validation = validateQuery(formData.query);
    if (!validation.isValid) {
      setValidationError(validation.error || 'Unknown validation error');
      return;
    }

    const parameters = extractParametersFromQuery(formData.query);

    const newQuery: Query = {
      id: crypto.randomUUID(),
      subgraphId: selectedSubgraph.id,
      name: formData.name,
      query: formData.query,
      parameters,
      validationFunction: formData.validationFunction || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updatedQueries = [...queries, newQuery];
    onQueriesChange(updatedQueries);

    // Select the new query if it's the first one for this subgraph
    if (subgraphQueries.length === 0) {
      onQuerySelect(newQuery);
    }

    resetFormData();
    setIsAddDialogOpen(false);
  };

  const handleEditQuery = () => {
    if (!editingQuery || !formData.name || !formData.query) return;

    const validation = validateQuery(formData.query);
    if (!validation.isValid) {
      setValidationError(validation.error || 'Unknown validation error');
      return;
    }

    const parameters = extractParametersFromQuery(formData.query);

    const updatedQuery: Query = {
      ...editingQuery,
      name: formData.name,
      query: formData.query,
      parameters,
      validationFunction: formData.validationFunction || undefined,
      updatedAt: Date.now(),
    };

    const updatedQueries = queries.map((q) =>
      q.id === editingQuery.id ? updatedQuery : q
    );
    onQueriesChange(updatedQueries);

    // Update selected query if it was the one being edited
    if (selectedQuery?.id === editingQuery.id) {
      onQuerySelect(updatedQuery);
    }

    setEditingQuery(null);
    resetFormData();
  };

  const handleDeleteQuery = (query: Query) => {
    const updatedQueries = queries.filter((q) => q.id !== query.id);
    onQueriesChange(updatedQueries);

    // Update selected query if it was deleted
    if (selectedQuery?.id === query.id) {
      onQuerySelect(null);
    }
  };

  const resetFormData = () => {
    setFormData({
      name: '',
      query: '',
      validationFunction: '',
    });
    setValidationError(null);
  };

  const openEditDialog = (query: Query) => {
    setEditingQuery(query);
    setFormData({
      name: query.name,
      query: query.query,
      validationFunction: query.validationFunction || '',
    });
    setValidationError(null);
  };

  const handleQueryChange = (query: string) => {
    setFormData({ ...formData, query });
    setValidationError(null);

    // Auto-extract parameters when query changes
    const parameters = extractParametersFromQuery(query);
    console.log('Extracted parameters:', parameters);
  };

  const validateCurrentQuery = () => {
    if (!formData.query) return;

    const validation = validateQuery(formData.query);
    if (!validation.isValid) {
      setValidationError(validation.error || 'Unknown validation error');
    } else {
      setValidationError(null);
      // Show success message
      alert('Query validation passed!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Query Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">
            Queries ({subgraphQueries.length})
            {selectedSubgraph && (
              <span className="text-sm text-muted-foreground ml-2">
                for {selectedSubgraph.name}
              </span>
            )}
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage GraphQL queries for your subgraphs
          </p>
        </div>
        <Dialog
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (open) {
              resetFormData();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button disabled={!selectedSubgraph}>
              <Plus className="h-4 w-4 mr-2" />
              Add Query
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full sm:max-w-5xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Query</DialogTitle>
              <DialogDescription>
                Create a new GraphQL query. Parameters will be automatically
                extracted from your query.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Query Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Pending Rewards Query"
                />
              </div>
              <div>
                <Label htmlFor="query">GraphQL Query</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Use $&#123;parameterName&#125; syntax for parameters. Example:
                  $&#123;address&#125;, $&#123;blockNumber&#125;
                </p>
                <GraphQLEditor
                  value={formData.query}
                  onChange={handleQueryChange}
                />
                {validationError && (
                  <p className="text-sm text-destructive mt-1">
                    {validationError}
                  </p>
                )}
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-muted-foreground">
                    Use $&#123;parameterName&#125; for dynamic parameters
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={validateCurrentQuery}
                  >
                    Validate Query
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="validationFunction">
                  Validation Function (Optional)
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Write JavaScript code to validate query results. Use
                  debug(name, value) to capture variables for inspection.
                </p>
                <JavaScriptEditor
                  value={formData.validationFunction}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      validationFunction: value,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Return true for success, false for failure. The
                  &apos;data&apos; parameter contains the direct GraphQL
                  response.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddQuery} disabled={!selectedSubgraph}>
                Add Query
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Queries List */}
      {!selectedSubgraph ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Code className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Subgraph Selected</h3>
            <p className="text-muted-foreground text-center mb-4">
              Select a subgraph first to manage its queries.
            </p>
          </CardContent>
        </Card>
      ) : subgraphQueries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Code className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Queries</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add your first query for {selectedSubgraph.name} to get started.
            </p>
            <Button
              onClick={() => {
                resetFormData();
                setIsAddDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Query
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {subgraphQueries.map((query) => (
            <Card
              key={query.id}
              className={`cursor-pointer transition-colors ${
                selectedQuery?.id === query.id
                  ? 'ring-2 ring-primary'
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => onQuerySelect(query)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Code className="h-5 w-5" />
                    <CardTitle className="text-lg">{query.name}</CardTitle>
                    {selectedQuery?.id === query.id && (
                      <Badge variant="secondary">Selected</Badge>
                    )}
                    {query.validationFunction && (
                      <Badge variant="outline">Has Validation</Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(query);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Query</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete &quot;{query.name}
                            &quot;? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteQuery(query)}
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
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">
                      Parameters ({query.parameters.length})
                    </Label>
                    {query.parameters.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {query.parameters.map((param) => (
                          <Badge
                            key={param.id}
                            variant="outline"
                            className="text-xs"
                          >
                            {param.name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No parameters
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Query Preview</Label>
                    <div className="mt-1 p-2 bg-muted rounded text-xs font-mono overflow-x-auto">
                      {query.query.length > 100
                        ? `${query.query.substring(0, 100)}...`
                        : query.query}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={!!editingQuery}
        onOpenChange={(open) => {
          if (!open) {
            setEditingQuery(null);
            resetFormData();
          }
        }}
      >
        <DialogContent className="w-full sm:max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Query</DialogTitle>
            <DialogDescription>
              Update the query configuration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Query Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Pending Rewards Query"
              />
            </div>
            <div>
              <Label htmlFor="edit-query">GraphQL Query</Label>
              <GraphQLEditor
                value={formData.query}
                onChange={handleQueryChange}
              />
              {validationError && (
                <p className="text-sm text-destructive mt-1">
                  {validationError}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="edit-validationFunction">
                Validation Function (Optional)
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Write JavaScript code to validate query results. Use debug(name,
                value) to capture variables for inspection.
              </p>
              <JavaScriptEditor
                value={formData.validationFunction}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    validationFunction: value,
                  })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Return true for success, false for failure. The &apos;data&apos;
                parameter contains the direct GraphQL response.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingQuery(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditQuery}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
