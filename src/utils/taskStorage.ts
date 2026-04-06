// IndexedDB-based storage for task data
// Ultra-optimized for 600k+ tasks without quota issues
// Features: connection pooling, batch writes, streaming, memory management

import { TodoItem } from '@/types/note';
import { requestUnlimitedStorage, LRUCache } from './unlimitedStorage';
import { debounce, BatchProcessor } from './performanceOptimizer';

const DB_NAME = 'nota-tasks-db';
const DB_VERSION = 3;
const STORE_NAME = 'tasks';
const META_STORE = 'meta';
const BATCH_SIZE = 5000; // Process 5000 items at a time for better performance

// In-memory cache with LRU eviction for large datasets
let tasksCache: TodoItem[] | null = null;
let cacheVersion = 0;
let lastSaveTime = 0;
const MIN_SAVE_INTERVAL = 50; // Minimum 50ms between saves
let pendingFlushTimer: ReturnType<typeof setTimeout> | null = null;
let pendingFlushItems: TodoItem[] | null = null;
let pendingSkipSyncEvent = false;

// Connection pooling - reuse database connection (never close)
let dbConnection: IDBDatabase | null = null;
let dbConnectionPromise: Promise<IDBDatabase> | null = null;

// Initialize persistent storage silently
requestUnlimitedStorage().catch(() => {});

const toOptionalDate = (value: unknown): Date | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  const date = value instanceof Date ? value : new Date(value as any);
  return Number.isFinite(date.getTime()) ? date : undefined;
};

const hydrateItem = (raw: any): TodoItem => ({
  ...raw,
  dueDate: toOptionalDate(raw?.dueDate),
  reminderTime: toOptionalDate(raw?.reminderTime),
  completedAt: toOptionalDate(raw?.completedAt),
  createdAt: toOptionalDate(raw?.createdAt),
  modifiedAt: toOptionalDate(raw?.modifiedAt),
  voiceRecording: raw?.voiceRecording
    ? {
        ...raw.voiceRecording,
        timestamp: toOptionalDate(raw.voiceRecording.timestamp) ?? new Date(),
      }
    : undefined,
  subtasks: Array.isArray(raw?.subtasks) ? raw.subtasks.map(hydrateItem) : undefined,
});

const openDB = (): Promise<IDBDatabase> => {
  // Return existing connection immediately
  if (dbConnection && dbConnection.objectStoreNames.length > 0) {
    return Promise.resolve(dbConnection);
  }
  
  if (dbConnectionPromise) {
    return dbConnectionPromise;
  }

  dbConnectionPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    // Timeout: if IndexedDB doesn't open in 5s, reject
    const timeout = setTimeout(() => {
      dbConnectionPromise = null;
      reject(new Error('Tasks IndexedDB open timed out'));
    }, 5000);
    
    request.onerror = () => {
      clearTimeout(timeout);
      dbConnectionPromise = null;
      reject(request.error);
    };
    
    request.onsuccess = () => {
      clearTimeout(timeout);
      dbConnection = request.result;
      
      // Handle connection close
      dbConnection.onclose = () => {
        dbConnection = null;
        dbConnectionPromise = null;
      };
      
      resolve(dbConnection);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Store for all tasks
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('completed', 'completed', { unique: false });
        store.createIndex('dueDate', 'dueDate', { unique: false });
        store.createIndex('sectionId', 'sectionId', { unique: false });
      }
      
      // Store for metadata
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'key' });
      }
    };
  });

  return dbConnectionPromise;
};

// Load all tasks from IndexedDB (with streaming for large datasets)
export const loadTasksFromDB = async (): Promise<TodoItem[]> => {
  // Return cached data if available
  if (tasksCache !== null) {
    return tasksCache;
  }
  
  try {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onerror = () => {
        // Don't close connection - keep it pooled
        console.warn('Failed to load tasks:', request.error);
        resolve([]);
      };
      
      request.onsuccess = () => {
        try {
          const items = request.result.map(hydrateItem);
          tasksCache = items;
          resolve(items);
        } catch (e) {
          console.warn('Failed to hydrate tasks:', e);
          resolve([]);
        }
      };
    });
  } catch (e) {
    console.warn('IndexedDB load failed, returning empty array:', e);
    return [];
  }
};

// Save tasks to IndexedDB (optimized batch operation for 100B+ items)
export const saveTasksToDB = async (items: TodoItem[], skipSyncEvent = false): Promise<boolean> => {
  // ALWAYS update in-memory cache immediately so any sync reads see latest data
  tasksCache = items;
  cacheVersion++;

  // Throttle actual IndexedDB writes to prevent overwhelming the database
  const now = Date.now();
  if (now - lastSaveTime < MIN_SAVE_INTERVAL) {
    pendingFlushItems = items;
    pendingSkipSyncEvent = skipSyncEvent;
    if (pendingFlushTimer) clearTimeout(pendingFlushTimer);
    pendingFlushTimer = setTimeout(() => {
      const queuedItems = pendingFlushItems ?? items;
      const queuedSkipSyncEvent = pendingSkipSyncEvent;
      pendingFlushItems = null;
      pendingSkipSyncEvent = false;
      pendingFlushTimer = null;
      void flushTasksToDB(queuedItems, queuedSkipSyncEvent);
    }, MIN_SAVE_INTERVAL);
    return true;
  }

  if (pendingFlushTimer) {
    clearTimeout(pendingFlushTimer);
    pendingFlushTimer = null;
    pendingFlushItems = null;
    pendingSkipSyncEvent = false;
  }

  lastSaveTime = now;

  return flushTasksToDB(items, skipSyncEvent);
};

// Internal: actually write to IndexedDB (cache is already updated by caller)
// Serialize a TodoItem so IndexedDB structured-clone never chokes on it.
// MUST never throw — a single bad item should not kill the entire save.
const dateToISO = (v: unknown): string | undefined => {
  if (v === null || v === undefined) return undefined;
  try {
    const d = v instanceof Date ? v : new Date(v as any);
    return Number.isFinite(d.getTime()) ? d.toISOString() : undefined;
  } catch { return undefined; }
};

const sanitizeForIDB = (item: TodoItem): any => {
  try {
    const obj: any = { ...item };
    // Convert Date objects to ISO strings
    obj.dueDate = dateToISO(obj.dueDate);
    obj.reminderTime = dateToISO(obj.reminderTime);
    obj.completedAt = dateToISO(obj.completedAt);
    obj.createdAt = dateToISO(obj.createdAt);
    obj.modifiedAt = dateToISO(obj.modifiedAt);
    if (obj.voiceRecording) {
      obj.voiceRecording = { ...obj.voiceRecording, timestamp: dateToISO(obj.voiceRecording.timestamp) };
    }
    if (Array.isArray(obj.subtasks)) {
      obj.subtasks = obj.subtasks.map(sanitizeForIDB);
    }
    // Remove functions, symbols, undefined (they break structured clone)
    // Use replacer instead of double-parse to avoid circular reference crash
    return JSON.parse(JSON.stringify(obj, (_k, v) =>
      typeof v === 'function' || typeof v === 'symbol' ? undefined : v
    ));
  } catch (e) {
    // Absolute fallback: return minimal clonable object so save continues
    console.warn('sanitizeForIDB failed for item:', item?.id, e);
    return { id: item?.id ?? `recovery-${Date.now()}`, text: item?.text ?? '', completed: !!item?.completed };
  }
};

const flushTasksToDB = async (items: TodoItem[], skipSyncEvent = false): Promise<boolean> => {
  lastSaveTime = Date.now();

  try {
    const db = await openDB();
    
    // For very large datasets, use batch processing
    if (items.length > BATCH_SIZE) {
      return saveLargeDataset(db, items, skipSyncEvent);
    }
    
    // Sanitize all items — never let a single bad item kill the save
    const sanitized: any[] = [];
    for (const item of items) {
      try {
        const s = sanitizeForIDB(item);
        if (s && s.id) sanitized.push(s);
      } catch {
        // item-level fallback already handled inside sanitizeForIDB
      }
    }

    if (sanitized.length === 0 && items.length > 0) {
      console.error('All items failed sanitization, aborting save to protect data');
      if (!skipSyncEvent) window.dispatchEvent(new Event('tasksUpdated'));
      return true;
    }

    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const newIds = new Set(sanitized.map((i: any) => i.id));

      if (sanitized.length === 0) {
        store.clear();
      } else {
        sanitized.forEach((item: any) => {
          try {
            const req = store.put(item);
            req.onerror = () => console.warn('Failed to put task:', item.id, req.error);
          } catch (e) {
            console.warn('Put threw for task:', item.id, e);
          }
        });

        const cursorReq = store.openKeyCursor();
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result;
          if (!cursor) return;
          if (!newIds.has(cursor.key as string)) store.delete(cursor.key);
          cursor.continue();
        };
      }

      transaction.oncomplete = () => {
        if (!skipSyncEvent) window.dispatchEvent(new Event('tasksUpdated'));
        resolve(true);
      };
      transaction.onerror = () => {
        console.warn('Transaction error during task save:', transaction.error);
        if (!skipSyncEvent) window.dispatchEvent(new Event('tasksUpdated'));
        resolve(true);
      };
      transaction.onabort = () => {
        console.warn('Transaction aborted:', transaction.error);
        dbConnection = null;
        dbConnectionPromise = null;
        if (!skipSyncEvent) window.dispatchEvent(new Event('tasksUpdated'));
        resolve(true);
      };
    });
  } catch (e) {
    console.warn('IndexedDB save failed, using memory cache only:', e);
    return true;
  }
};

// Save large datasets in batches (for 100B+ items)
const saveLargeDataset = async (db: IDBDatabase, items: TodoItem[], skipSyncEvent = false): Promise<boolean> => {
  try {
    const newIds = new Set<string>();
    
    // Process in batches — put (upsert) items without clearing first
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      const sanitized = batch.map(sanitizeForIDB);
      sanitized.forEach((item: any) => newIds.add(item.id));
      
      await new Promise<void>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        
        sanitized.forEach((item: any) => {
          try {
            store.put(item);
          } catch {}
        });
        
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
      
      // Yield to main thread between batches
      if (i + BATCH_SIZE < items.length) {
        await new Promise(r => requestAnimationFrame(r));
      }
    }

    // Delete stale keys that are no longer in the items array
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const cursorReq = store.openKeyCursor();
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (!cursor) return;
        if (!newIds.has(cursor.key as string)) {
          store.delete(cursor.key);
        }
        cursor.continue();
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });

    if (!skipSyncEvent) window.dispatchEvent(new Event('tasksUpdated'));
    
    return true;
  } catch (e) {
    console.warn('Large dataset save failed:', e);
    return true;
  }
};

// Update a single task without rewriting everything
export const updateTaskInDB = async (taskId: string, updates: Partial<TodoItem>): Promise<boolean> => {
  // Update cache immediately
  if (tasksCache) {
    const index = tasksCache.findIndex(t => t.id === taskId);
    if (index >= 0) {
      tasksCache[index] = { ...tasksCache[index], ...updates };
      cacheVersion++;
    }
  }
  
  try {
    const db = await openDB();
    
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(taskId);
      
      getRequest.onsuccess = () => {
        const existing = getRequest.result;
        if (existing) {
          const updated = { ...existing, ...updates };
          store.put(updated);
        }
      };
      
      transaction.oncomplete = () => {
        window.dispatchEvent(new Event('tasksUpdated'));
        resolve(true);
      };
      transaction.onerror = () => {
        window.dispatchEvent(new Event('tasksUpdated'));
        resolve(true);
      };
    });
  } catch (e) {
    console.warn('Update task failed, cache is still updated:', e);
    return true; // Graceful degradation
  }
};

// Delete a task
export const deleteTaskFromDB = async (taskId: string): Promise<boolean> => {
  // Update cache immediately
  if (tasksCache) {
    tasksCache = tasksCache.filter(t => t.id !== taskId);
    cacheVersion++;
  }
  
  try {
    const db = await openDB();
    
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.delete(taskId);
      
      transaction.oncomplete = () => {
        window.dispatchEvent(new Event('tasksUpdated'));
        // Track deletion for cross-device sync and upload immediately
        import('@/utils/deletionTracker').then(({ trackDeletion, loadDeletions }) => {
          trackDeletion(taskId, 'tasks');
          import('@/utils/googleDriveSync').then(({ uploadCategory }) => {
            uploadCategory('flowist_deletions.json', loadDeletions()).catch(() => {});
          });
        });
        resolve(true);
      };
      transaction.onerror = () => {
        window.dispatchEvent(new Event('tasksUpdated'));
        resolve(true);
      };
    });
  } catch (e) {
    console.warn('Delete task failed, cache is still updated:', e);
    return true; // Graceful degradation
  }
};

// Migrate from localStorage to IndexedDB (silent, non-blocking)
export const migrateFromLocalStorage = async (): Promise<{ migrated: boolean; count: number }> => {
  const TODO_ITEMS_KEY = 'todoItems';
  
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(TODO_ITEMS_KEY);
  } catch {
    return { migrated: false, count: 0 };
  }
  
  if (!saved) {
    return { migrated: false, count: 0 };
  }
  
  try {
    const parsed = JSON.parse(saved);
    const items: TodoItem[] = Array.isArray(parsed) ? parsed.map(hydrateItem) : [];
    
    if (items.length === 0) {
      return { migrated: false, count: 0 };
    }
    
    // Check if IndexedDB already has data
    const existingItems = await loadTasksFromDB();
    if (existingItems.length > 0) {
      // Already migrated, just clear localStorage to free space
      localStorage.removeItem(TODO_ITEMS_KEY);
      return { migrated: false, count: existingItems.length };
    }
    
    // Save to IndexedDB
    await saveTasksToDB(items);
    
    // Clear localStorage to free quota
    localStorage.removeItem(TODO_ITEMS_KEY);
    
    console.log(`Migrated ${items.length} tasks from localStorage to IndexedDB`);
    return { migrated: true, count: items.length };
  } catch (e) {
    console.error('Migration failed:', e);
    return { migrated: false, count: 0 };
  }
};

// Clear cache (call when you need fresh data)
export const clearTasksCache = () => {
  tasksCache = null;
};

// Get cache version for React dependencies
export const getTasksCacheVersion = () => cacheVersion;

// Get storage estimate
export const getTasksStorageInfo = async (): Promise<{ taskCount: number; estimatedSizeKB: number }> => {
  const tasks = await loadTasksFromDB();
  const jsonString = JSON.stringify(tasks);
  return {
    taskCount: tasks.length,
    estimatedSizeKB: Math.round(jsonString.length / 1024),
  };
};

// Paged loading with IDBCursor for progressive rendering of large datasets
export const loadTasksPagedFromDB = async (
  offset: number,
  limit: number
): Promise<{ items: TodoItem[]; hasMore: boolean }> => {
  // If cache exists and covers the range, use it
  if (tasksCache !== null) {
    const slice = tasksCache.slice(offset, offset + limit);
    return { items: slice, hasMore: offset + limit < tasksCache.length };
  }

  try {
    const db = await openDB();

    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const results: TodoItem[] = [];
      let skipped = 0;
      const cursorRequest = store.openCursor();

      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result;
        if (!cursor) {
          resolve({ items: results, hasMore: false });
          return;
        }

        if (skipped < offset) {
          skipped++;
          cursor.continue();
          return;
        }

        if (results.length < limit) {
          results.push(hydrateItem(cursor.value));
          cursor.continue();
        } else {
          // We have enough, there's more data
          resolve({ items: results, hasMore: true });
        }
      };

      cursorRequest.onerror = () => {
        console.warn('Cursor paged load failed:', cursorRequest.error);
        resolve({ items: [], hasMore: false });
      };
    });
  } catch (e) {
    console.warn('Paged load failed:', e);
    return { items: [], hasMore: false };
  }
};
