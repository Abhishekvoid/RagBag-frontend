import { useState, useEffect } from 'react';

// This custom hook delays updating a value until a certain time has passed.
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}