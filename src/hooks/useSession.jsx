/**
 * useSession — React hook for managing per-visitor curation sessions
 *
 * Loads session from /api/session on mount, exposes:
 *   - session: the full session object
 *   - isReady: true once loaded
 *   - setTimelineVisible(artworkId, boolean) — toggle visibility override
 *   - setAnnotation(artworkId, string) — set a personal note
 *   - resetSession() — clear all overrides
 *   - isHidden(artworkId) — true if this visitor has hidden this work
 *   - hiddenCount — number of artworks hidden in this session
 */

import { useState, useEffect, useCallback, createContext, useContext } from "react";

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [session, setSession]   = useState(null);
  const [isReady, setIsReady]   = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load session on mount
  useEffect(() => {
    fetch("/api/session", { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        setSession(d.session || null);
        setIsReady(true);
      })
      .catch(() => {
        // API unavailable — run sessionless
        setSession({ timelineOverrides: {}, annotations: {}, collections: [] });
        setIsReady(true);
      });
  }, []);

  const patch = useCallback(async (updates) => {
    if (isSaving) return;
    setIsSaving(true);
    // Optimistic update
    setSession(prev => {
      if (!prev) return prev;
      const next = { ...prev };
      if (updates.timelineOverrides) {
        next.timelineOverrides = { ...prev.timelineOverrides, ...updates.timelineOverrides };
        // Clean true values (default, no need to store)
        Object.keys(next.timelineOverrides).forEach(k => {
          if (next.timelineOverrides[k] === true) delete next.timelineOverrides[k];
        });
      }
      if (updates.annotations) {
        next.annotations = { ...prev.annotations, ...updates.annotations };
      }
      if (updates.collections) {
        next.collections = updates.collections;
      }
      return next;
    });
    try {
      const res = await fetch("/api/session", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.session) setSession(data.session);
    } catch (_) {
      // Fail silently — optimistic state is still better than nothing
    }
    setIsSaving(false);
  }, [isSaving]);

  const setTimelineVisible = useCallback((artworkId, visible) => {
    patch({ timelineOverrides: { [artworkId]: visible } });
  }, [patch]);

  const setAnnotation = useCallback((artworkId, text) => {
    patch({ annotations: { [artworkId]: text } });
  }, [patch]);

  const resetSession = useCallback(async () => {
    try {
      const res = await fetch("/api/session", {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.session) setSession(data.session);
    } catch (_) {}
  }, []);

  const isHidden = useCallback((artworkId) => {
    return session?.timelineOverrides?.[artworkId] === false;
  }, [session]);

  const hiddenCount = session
    ? Object.values(session.timelineOverrides || {}).filter(v => v === false).length
    : 0;

  return (
    <SessionContext.Provider value={{
      session, isReady, isSaving,
      setTimelineVisible, setAnnotation, resetSession,
      isHidden, hiddenCount,
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within a SessionProvider");
  return ctx;
}
