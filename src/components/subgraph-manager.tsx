'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

import { Plus, Edit, Trash2, Copy, Database } from 'lucide-react';
import { Subgraph } from '@/lib/types';

interface SubgraphManagerProps {
  subgraphs: Subgraph[];
  onSubgraphsChange: (subgraphs: Subgraph[]) => void;
  selectedSubgraph: Subgraph | null;
  onSubgraphSelect: (subgraph: Subgraph | null) => void;
}

export function SubgraphManager({
  subgraphs,
  onSubgraphsChange,
  selectedSubgraph,
  onSubgraphSelect,
}: SubgraphManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSubgraph, setEditingSubgraph] = useState<Subgraph | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    apiKeyEnvVar: '',
    apiKey: '',
  });

  const handleAddSubgraph = () => {
    if (!formData.name || !formData.url) return;

    const newSubgraph: Subgraph = {
      id: crypto.randomUUID(),
      name: formData.name,
      url: formData.url,
      apiKeyEnvVar:
        formData.apiKeyEnvVar || `${formData.name.toUpperCase()}_API_KEY`,
      createdAt: Date.now(),
    };

    const updatedSubgraphs = [...subgraphs, newSubgraph];
    onSubgraphsChange(updatedSubgraphs);

    // Select the new subgraph if it's the first one
    if (subgraphs.length === 0) {
      onSubgraphSelect(newSubgraph);
    }

    setFormData({ name: '', url: '', apiKeyEnvVar: '', apiKey: '' });
    setIsAddDialogOpen(false);
  };

  const handleEditSubgraph = () => {
    if (!editingSubgraph || !formData.name || !formData.url) return;

    const updatedSubgraph: Subgraph = {
      ...editingSubgraph,
      name: formData.name,
      url: formData.url,
      apiKeyEnvVar: formData.apiKeyEnvVar,
    };

    const updatedSubgraphs = subgraphs.map((s) =>
      s.id === editingSubgraph.id ? updatedSubgraph : s
    );
    onSubgraphsChange(updatedSubgraphs);

    // Update selected subgraph if it was the one being edited
    if (selectedSubgraph?.id === editingSubgraph.id) {
      onSubgraphSelect(updatedSubgraph);
    }

    setEditingSubgraph(null);
    setFormData({ name: '', url: '', apiKeyEnvVar: '', apiKey: '' });
  };

  const handleDeleteSubgraph = (subgraph: Subgraph) => {
    const updatedSubgraphs = subgraphs.filter((s) => s.id !== subgraph.id);
    onSubgraphsChange(updatedSubgraphs);

    // Update selected subgraph if it was deleted
    if (selectedSubgraph?.id === subgraph.id) {
      onSubgraphSelect(updatedSubgraphs[0] || null);
    }
  };

  const openEditDialog = (subgraph: Subgraph) => {
    setEditingSubgraph(subgraph);
    setFormData({
      name: subgraph.name,
      url: subgraph.url,
      apiKeyEnvVar: subgraph.apiKeyEnvVar,
      apiKey: '',
    });
  };

  const copyEnvTemplate = (subgraph: Subgraph) => {
    const template = `${subgraph.apiKeyEnvVar}=your_api_key_here`;
    navigator.clipboard.writeText(template);
  };

  return (
    <div className="space-y-6">
      {/* Add Subgraph Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">
            Subgraphs ({subgraphs.length})
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage your subgraph configurations
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Subgraph
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Subgraph</DialogTitle>
              <DialogDescription>
                Add a new subgraph configuration. The API key will be stored in
                environment variables.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="My Subgraph"
                />
              </div>
              <div>
                <Label htmlFor="url">GraphQL Endpoint URL</Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  placeholder="https://api.studio.thegraph.com/query/..."
                />
              </div>
              <div>
                <Label htmlFor="apiKeyEnvVar">
                  API Key Environment Variable
                </Label>
                <Input
                  id="apiKeyEnvVar"
                  value={formData.apiKeyEnvVar}
                  onChange={(e) =>
                    setFormData({ ...formData, apiKeyEnvVar: e.target.value })
                  }
                  placeholder="MY_SUBGRAPH_API_KEY"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This will be the environment variable name for the API key
                </p>
              </div>
              <div>
                <Label htmlFor="apiKey">API Key (Optional)</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) =>
                    setFormData({ ...formData, apiKey: e.target.value })
                  }
                  placeholder="Enter your API key to save to .env"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  If provided, this will be saved to your .env file
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
              <Button onClick={handleAddSubgraph}>Add Subgraph</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Subgraphs List */}
      {subgraphs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Database className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Subgraphs</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add your first subgraph to get started with querying and
              debugging.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Subgraph
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {subgraphs.map((subgraph) => (
            <Card
              key={subgraph.id}
              className={`cursor-pointer transition-colors ${
                selectedSubgraph?.id === subgraph.id
                  ? 'ring-2 ring-primary'
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => onSubgraphSelect(subgraph)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database className="h-5 w-5" />
                    <CardTitle className="text-lg">{subgraph.name}</CardTitle>
                    {selectedSubgraph?.id === subgraph.id && (
                      <Badge variant="secondary">Selected</Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyEnvTemplate(subgraph);
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(subgraph);
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
                          <AlertDialogTitle>Delete Subgraph</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete &quot;
                            {subgraph.name}&quot;? This will also delete all
                            associated queries.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteSubgraph(subgraph)}
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
                <div className="space-y-2">
                  <div>
                    <Label className="text-sm font-medium">URL</Label>
                    <p className="text-sm text-muted-foreground break-all">
                      {subgraph.url}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">
                      API Key Variable
                    </Label>
                    <p className="text-sm text-muted-foreground font-mono">
                      {subgraph.apiKeyEnvVar}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={!!editingSubgraph}
        onOpenChange={() => setEditingSubgraph(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subgraph</DialogTitle>
            <DialogDescription>
              Update the subgraph configuration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="My Subgraph"
              />
            </div>
            <div>
              <Label htmlFor="edit-url">GraphQL Endpoint URL</Label>
              <Input
                id="edit-url"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                placeholder="https://api.studio.thegraph.com/query/..."
              />
            </div>
            <div>
              <Label htmlFor="edit-apiKeyEnvVar">
                API Key Environment Variable
              </Label>
              <Input
                id="edit-apiKeyEnvVar"
                value={formData.apiKeyEnvVar}
                onChange={(e) =>
                  setFormData({ ...formData, apiKeyEnvVar: e.target.value })
                }
                placeholder="MY_SUBGRAPH_API_KEY"
              />
            </div>
            <div>
              <Label htmlFor="edit-apiKey">API Key (Optional)</Label>
              <Input
                id="edit-apiKey"
                type="password"
                value={formData.apiKey}
                onChange={(e) =>
                  setFormData({ ...formData, apiKey: e.target.value })
                }
                placeholder="Enter your API key to save to .env"
              />
              <p className="text-xs text-muted-foreground mt-1">
                If provided, this will be saved to your .env file
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSubgraph(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubgraph}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
