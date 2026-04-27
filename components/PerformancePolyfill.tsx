'use client';

import { useEffect } from 'react';

export function PerformancePolyfill() {
  useEffect(() => {
    if (typeof performance !== 'undefined' && performance.measure) {
      const originalMeasure = performance.measure.bind(performance);
      (performance as any).measure = function(name: string, startMark?: string, endMark?: string) {
        try {
          if (startMark && endMark) {
            const startEntry = performance.getEntriesByName(startMark).pop();
            const endEntry = performance.getEntriesByName(endMark).pop();
            
            if (startEntry && endEntry && endEntry.startTime >= startEntry.startTime) {
              return originalMeasure(name, startMark, endMark);
            }
          }
          return originalMeasure(name, startMark, endMark);
        } catch (e) {
        }
      };
    }

    const originalWarn = console.warn;
    console.warn = function(...args: any[]) {
      const message = args[0]?.toString() || '';
      if (message.includes('DropZones have been deprecated')) {
        return; 
      }
      originalWarn.apply(console, args);
    };
  }, []);

  return null;
}
