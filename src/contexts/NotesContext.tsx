import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Note } from '@/types/note';
import {
  loadNotesFromDB, saveNotesToDB, saveNoteToDBSingle, deleteNoteFromDB,
  migrateNotesToIndexedDB, loadFullNoteFromDB,
  toNoteShell, extractHeavyContent, mergeNoteContent, NoteHeavyContent,
} from '@/utils/noteStorage';
import { getTextPreviewFromHtml } from '@/utils/contentPreview';

// Lightweight note metadata for instant navigation
export interface NoteMeta {
  id: string;
  type: Note['type'];
  title: string;
  color?: Note['color'];
  customColor?: string;
  folderId?: string;
  isPinned?: boolean;
  isFavorite?: boolean;
  pinnedOrder?: number;
  isArchived?: boolean;
  archivedAt?: Date;
  isDeleted?: boolean;
  deletedAt?: Date;
  isHidden?: boolean;
  isProtected?: boolean;
  metaDescription?: string;
  reminderEnabled?: boolean;
  reminderTime?: Date;
  createdAt: Date;
  updatedAt: Date;
  contentPreview: string;
  hasFullContent: boolean;
}

const extractNoteMeta = (note: Note): NoteMeta => ({
  id: note.id,
  type: note.type,
  title: note.title,
  color: note.color,
  customColor: note.customColor,
  folderId: note.folderId,
  isPinned: note.isPinned,
  isFavorite: note.isFavorite,
  pinnedOrder: note.pinnedOrder,
  isArchived: note.isArchived,
  archivedAt: note.archivedAt,
  isDeleted: note.isDeleted,
  deletedAt: note.deletedAt,
  isHidden: note.isHidden,
  isProtected: note.isProtected,
  metaDescription: note.metaDescription,
  reminderEnabled: note.reminderEnabled,
  reminderTime: note.reminderTime,
  createdAt: note.createdAt,
  updatedAt: note.updatedAt,
  contentPreview: getTextPreviewFromHtml(note.content, 200),
  hasFullContent: true,
});

// ── Split contexts ──

/** Data context: notes array, metadata, loading state. Changes when notes data changes. */
interface NotesDataContextType {
  notes: Note[];
  notesMeta: NoteMeta[];
  notesMap: Map<string, Note>;
  counts: { active: number; archived: number; trash: number };
  isLoading: boolean;
  isInitialized: boolean;
  getNoteById: (noteId: string) => Note | undefined;
}

/** Dispatch context: actions only. Stable references — never causes re-renders. */
interface NotesDispatchContextType {
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  saveNote: (note: Note) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  updateNote: (noteId: string, updates: Partial<Note>) => Promise<void>;
  bulkUpdateNotes: (noteIds: string[], updates: Partial<Note>) => Promise<void>;
  refreshNotes: () => Promise<void>;
  /** Load full note content (heavy fields) from IndexedDB — use before opening editor */
  getFullNote: (noteId: string) => Promise<Note | null>;
}

/** Combined type for backward compatibility */
interface NotesContextType extends NotesDataContextType, NotesDispatchContextType {}

const NotesDataContext = createContext<NotesDataContextType | undefined>(undefined);
const NotesDispatchContext = createContext<NotesDispatchContextType | undefined>(undefined);

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State holds "shell" notes — heavy content (full HTML, images, etc.) is stripped
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const driveSyncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');

  // Heavy content cache — stores full content, images, floatingImages, codeContent
  // Keyed by note.id. NOT in React state — doesn't trigger re-renders.
  const heavyContentRef = useRef<Map<string, NoteHeavyContent>>(new Map());

  // Memoized metadata — uses its own ref so it doesn't interfere with save-change detection
  const prevMetaNotesRef = useRef<Note[]>([]);
  const cachedMetaRef = useRef<NoteMeta[]>([]);

  const notesMeta = useMemo(() => {
    if (notes === prevMetaNotesRef.current && cachedMetaRef.current.length > 0) {
      return cachedMetaRef.current;
    }
    prevMetaNotesRef.current = notes;
    const result = notes.map(extractNoteMeta);
    cachedMetaRef.current = result;
    return result;
  }, [notes]);

  // O(1) lookup map — avoids array.find on 100k+ notes
  const notesMap = useMemo(() => new Map(notes.map(n => [n.id, n])), [notes]);

  // Pre-computed counts — avoids 3x full-array scans on every render
  const counts = useMemo(() => {
    let active = 0, archived = 0, trash = 0;
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      if (n.isDeleted) trash++;
      else if (n.isArchived) archived++;
      else active++;
    }
    return { active, archived, trash };
  }, [notes]);

  // Separate ref for debounced-save change detection (not shared with useMemo)
  const prevSaveNotesRef = useRef<Note[]>([]);
  // Flag to suppress re-upload when notes came from a cloud restore
  const isFromSyncRef = useRef(false);

  /** Load full notes, cache heavy content, set shells in state */
  const ingestFullNotes = useCallback((fullNotes: Note[]) => {
    // Cache heavy content in ref
    const map = heavyContentRef.current;
    map.clear();
    for (let i = 0; i < fullNotes.length; i++) {
      map.set(fullNotes[i].id, extractHeavyContent(fullNotes[i]));
    }
    // Set lightweight shells in React state
    setNotes(fullNotes.map(toNoteShell));
  }, []);

  // Load notes — defer if user is on Todo dashboard for faster startup
  useEffect(() => {
    let isMounted = true;

    const initializeNotes = async () => {
      try {
        console.log('[NotesContext] Initializing notes...');
        const startTime = performance.now();
        await migrateNotesToIndexedDB();
        const loadedNotes = await loadNotesFromDB();

        if (isMounted) {
          ingestFullNotes(loadedNotes);
          setIsInitialized(true);
          setIsLoading(false);
          const duration = (performance.now() - startTime).toFixed(0);
          console.log(`[NotesContext] Loaded ${loadedNotes.length} notes (shells) in ${duration}ms`);
        }
      } catch (error) {
        console.error('[NotesContext] Error loading notes:', error);
        if (isMounted) {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    // If user lands on Todo, defer notes loading to avoid blocking startup
    const isTodoRoute = window.location.pathname === '/' || window.location.pathname.startsWith('/todo');
    if (isTodoRoute) {
      const defer = 'requestIdleCallback' in window
        ? (cb: () => void) => requestIdleCallback(cb, { timeout: 3000 })
        : (cb: () => void) => setTimeout(cb, 500);
      defer(initializeNotes);
    } else {
      initializeNotes();
    }

    const handleNotesUpdated = () => {
      loadNotesFromDB().then(fullNotes => ingestFullNotes(fullNotes)).catch(console.error);
    };
    const handleNotesRestored = () => {
      isFromSyncRef.current = true;
      loadNotesFromDB().then(fullNotes => ingestFullNotes(fullNotes)).catch(console.error);
    };

    window.addEventListener('notesUpdated', handleNotesUpdated);
    window.addEventListener('notesRestored', handleNotesRestored);
    

    return () => {
      isMounted = false;
      window.removeEventListener('notesUpdated', handleNotesUpdated);
      window.removeEventListener('notesRestored', handleNotesRestored);
      
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (driveSyncTimerRef.current) clearTimeout(driveSyncTimerRef.current);
    };
  }, []);

  // Debounced save — saves full notes (shell + heavy content merged) to IndexedDB
  const notesLengthRef = useRef(0);
  useEffect(() => {
    if (!isInitialized || notes.length === 0) return;
    const changed = notes !== prevSaveNotesRef.current || notes.length !== notesLengthRef.current;
    prevSaveNotesRef.current = notes;
    notesLengthRef.current = notes.length;
    if (!changed) return;

    if (isFromSyncRef.current) {
      isFromSyncRef.current = false;
      return;
    }

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        // Reconstruct full notes from shells + heavy content for persistence
        const fullNotes = notes.map(shell => {
          const heavy = heavyContentRef.current.get(shell.id);
          return heavy ? mergeNoteContent(shell, heavy) : shell;
        });
        await saveNotesToDB(fullNotes);
        lastSavedRef.current = String(notes.length);
        // Auto-upload to Google Drive
        driveSyncTimerRef.current && clearTimeout(driveSyncTimerRef.current);
        driveSyncTimerRef.current = setTimeout(async () => {
          try {
            const { syncNotesToDrive } = await import('@/utils/googleDriveSync');
            await syncNotesToDrive();
          } catch (e) {
            console.warn('[NotesContext] Auto-upload to Drive failed:', e);
          }
        }, 1000);
      } catch (error) {
        console.error('[NotesContext] Error saving notes:', error);
      }
    }, 500);
  }, [notes, isInitialized]);

  // ── Dispatch actions (stable — never change) ──

  const saveNote = useCallback(async (note: Note) => {
    // Update heavy content cache with full content from editor
    heavyContentRef.current.set(note.id, extractHeavyContent(note));

    // Update shell in React state
    const shell = toNoteShell(note);
    setNotes(prev => {
      const existingIdx = prev.findIndex(n => n.id === note.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = shell;
        return updated;
      }
      return [shell, ...prev];
    });

    try {
      // Save full note to IndexedDB
      await saveNoteToDBSingle(note);
    } catch (error) {
      console.error('[NotesContext] Error saving single note:', error);
    }
  }, []);

  const deleteNote = useCallback(async (noteId: string) => {
    heavyContentRef.current.delete(noteId);
    setNotes(prev => prev.filter(n => n.id !== noteId));
    try {
      await deleteNoteFromDB(noteId);
    } catch (error) {
      console.error('[NotesContext] Error deleting note:', error);
    }
  }, []);

  const updateNote = useCallback(async (noteId: string, updates: Partial<Note>) => {
    let fullUpdatedNote: Note | null = null;

    setNotes(prev =>
      prev.map(n => {
        if (n.id !== noteId) return n;
        // Merge updates into shell
        const updatedShell: Note = {
          ...n,
          ...updates,
          updatedAt: new Date(),
        };
        // If updates include content, update heavy cache
        if ('content' in updates || 'images' in updates || 'floatingImages' in updates || 'codeContent' in updates) {
          const existingHeavy = heavyContentRef.current.get(noteId);
          const mergedHeavy: NoteHeavyContent = {
            content: updates.content ?? existingHeavy?.content ?? n.content,
            images: updates.images ?? existingHeavy?.images ?? n.images,
            floatingImages: updates.floatingImages ?? existingHeavy?.floatingImages ?? n.floatingImages,
            codeContent: updates.codeContent ?? existingHeavy?.codeContent ?? n.codeContent,
          };
          heavyContentRef.current.set(noteId, mergedHeavy);
          fullUpdatedNote = mergeNoteContent(updatedShell, mergedHeavy);
        } else {
          const heavy = heavyContentRef.current.get(noteId);
          fullUpdatedNote = heavy ? mergeNoteContent(updatedShell, heavy) : updatedShell;
        }
        return toNoteShell(fullUpdatedNote!);
      })
    );

    try {
      if (fullUpdatedNote) await saveNoteToDBSingle(fullUpdatedNote);
    } catch (error) {
      console.error('[NotesContext] Error persisting note update:', error);
    }
  }, []);

  const bulkUpdateNotes = useCallback(async (noteIds: string[], updates: Partial<Note>) => {
    const fullUpdatedNotes: Note[] = [];
    const idsSet = new Set(noteIds);

    setNotes(prev =>
      prev.map(n => {
        if (!idsSet.has(n.id)) return n;
        const updatedShell: Note = { ...n, ...updates, updatedAt: new Date() };
        const heavy = heavyContentRef.current.get(n.id);
        const full = heavy ? mergeNoteContent(updatedShell, heavy) : updatedShell;
        fullUpdatedNotes.push(full);
        return toNoteShell(full);
      })
    );

    try {
      await Promise.all(fullUpdatedNotes.map(n => saveNoteToDBSingle(n)));
    } catch (error) {
      console.error('[NotesContext] Error persisting bulk note update:', error);
    }
  }, []);

  const refreshNotes = useCallback(async () => {
    try {
      const loadedNotes = await loadNotesFromDB();
      ingestFullNotes(loadedNotes);
    } catch (error) {
      console.error('[NotesContext] Error refreshing notes:', error);
    }
  }, [ingestFullNotes]);

  const getNoteById = useCallback((noteId: string): Note | undefined => {
    return notesMap.get(noteId);
  }, [notesMap]);

  /** Load full note with all heavy content — call before opening editor */
  const getFullNote = useCallback(async (noteId: string): Promise<Note | null> => {
    const shell = notesMap.get(noteId);
    if (!shell) return null;

    // Check in-memory heavy content cache first (instant)
    const heavy = heavyContentRef.current.get(noteId);
    if (heavy) return mergeNoteContent(shell, heavy);

    // Fallback: read from IndexedDB (rare — only if cache was cleared)
    const full = await loadFullNoteFromDB(noteId);
    if (full) {
      heavyContentRef.current.set(noteId, extractHeavyContent(full));
    }
    return full;
  }, [notesMap]);

  // ── Memoized context values ──

  const dataValue = useMemo<NotesDataContextType>(() => ({
    notes,
    notesMeta,
    notesMap,
    counts,
    isLoading,
    isInitialized,
    getNoteById,
  }), [notes, notesMeta, notesMap, counts, isLoading, isInitialized, getNoteById]);

  const dispatchValue = useMemo<NotesDispatchContextType>(() => ({
    setNotes,
    saveNote,
    deleteNote,
    updateNote,
    bulkUpdateNotes,
    refreshNotes,
    getFullNote,
  }), [saveNote, deleteNote, updateNote, bulkUpdateNotes, refreshNotes, getFullNote]);

  return (
    <NotesDispatchContext.Provider value={dispatchValue}>
      <NotesDataContext.Provider value={dataValue}>
        {children}
      </NotesDataContext.Provider>
    </NotesDispatchContext.Provider>
  );
};

// ── Hooks ──

/** Use only note data (notes, meta, loading). Re-renders when data changes. */
export const useNotesData = (): NotesDataContextType => {
  const context = useContext(NotesDataContext);
  if (!context) throw new Error('useNotesData must be used within a NotesProvider');
  return context;
};

/** Use only dispatch actions. Never re-renders — stable references. */
export const useNotesDispatch = (): NotesDispatchContextType => {
  const context = useContext(NotesDispatchContext);
  if (!context) throw new Error('useNotesDispatch must be used within a NotesProvider');
  return context;
};

/** Combined hook — backward compatible. Components using this re-render on data changes. */
export const useNotes = (): NotesContextType => {
  const data = useNotesData();
  const dispatch = useNotesDispatch();
  return { ...data, ...dispatch };
};

/** Optional hook that returns null if outside provider */
export const useNotesOptional = (): NotesContextType | null => {
  const data = useContext(NotesDataContext);
  const dispatch = useContext(NotesDispatchContext);
  if (!data || !dispatch) return null;
  return { ...data, ...dispatch };
};