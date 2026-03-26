// frontend/src/components/useKeyboardShortcuts.js
import { useEffect } from 'react';

export const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const isCtrl = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      
      for (const shortcut of shortcuts) {
        if (shortcut.key === key && shortcut.ctrl === isCtrl) {
          event.preventDefault();
          shortcut.action();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

export default useKeyboardShortcuts;