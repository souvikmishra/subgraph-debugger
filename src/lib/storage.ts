import { Subgraph, Query, QueryHistory } from './types';

const STORAGE_KEYS = {
  SUBGRAPHS: 'subgraph-debugger-subgraphs',
  QUERIES: 'subgraph-debugger-queries',
  HISTORY: 'subgraph-debugger-history',
} as const;

// Subgraphs
export const getSubgraphs = (): Subgraph[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SUBGRAPHS);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveSubgraphs = (subgraphs: Subgraph[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.SUBGRAPHS, JSON.stringify(subgraphs));
};

export const addSubgraph = (subgraph: Subgraph): void => {
  const subgraphs = getSubgraphs();
  subgraphs.push(subgraph);
  saveSubgraphs(subgraphs);
};

export const updateSubgraph = (
  id: string,
  updates: Partial<Subgraph>
): void => {
  const subgraphs = getSubgraphs();
  const index = subgraphs.findIndex((s) => s.id === id);
  if (index !== -1) {
    subgraphs[index] = { ...subgraphs[index], ...updates };
    saveSubgraphs(subgraphs);
  }
};

export const deleteSubgraph = (id: string): void => {
  const subgraphs = getSubgraphs();
  const filtered = subgraphs.filter((s) => s.id !== id);
  saveSubgraphs(filtered);
};

// Queries
export const getQueries = (): Query[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.QUERIES);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveQueries = (queries: Query[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.QUERIES, JSON.stringify(queries));
};

export const addQuery = (query: Query): void => {
  const queries = getQueries();
  queries.push(query);
  saveQueries(queries);
};

export const updateQuery = (id: string, updates: Partial<Query>): void => {
  const queries = getQueries();
  const index = queries.findIndex((q) => q.id === id);
  if (index !== -1) {
    queries[index] = { ...queries[index], ...updates, updatedAt: Date.now() };
    saveQueries(queries);
  }
};

export const deleteQuery = (id: string): void => {
  const queries = getQueries();
  const filtered = queries.filter((q) => q.id !== id);
  saveQueries(filtered);
};

export const getQueriesBySubgraph = (subgraphId: string): Query[] => {
  return getQueries().filter((q) => q.subgraphId === subgraphId);
};

// History
export const getHistory = (): QueryHistory[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveHistory = (history: QueryHistory[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
};

export const addHistoryEntry = (entry: QueryHistory): void => {
  const history = getHistory();
  history.unshift(entry); // Add to beginning
  // Keep only last 100 entries
  if (history.length > 100) {
    history.splice(100);
  }
  saveHistory(history);
};

export const clearHistory = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.HISTORY);
};

export const deleteHistoryEntry = (id: string): void => {
  const history = getHistory();
  const filtered = history.filter((h) => h.id !== id);
  saveHistory(filtered);
};

// Clear all data
export const clearAllData = (): void => {
  if (typeof window === 'undefined') return;
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
};
