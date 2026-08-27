'use client';

import { useCallback, useEffect, useState } from 'react';

export function usePersistentCollapsed(storageKey: string) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    try {
      setIsCollapsed(localStorage.getItem(storageKey) === 'true');
    } catch {
      // O painel continua funcionando mesmo quando o armazenamento está indisponível.
    }
  }, [storageKey]);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed(current => {
      const next = !current;
      try {
        localStorage.setItem(storageKey, String(next));
      } catch {
        // Mantém a preferência apenas durante a sessão atual.
      }
      return next;
    });
  }, [storageKey]);

  return { isCollapsed, toggleCollapsed };
}
