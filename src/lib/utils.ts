type ClassValue = string | number | boolean | undefined | null | { [key: string]: boolean };

export function cn(...classes: ClassValue[]): string {
  return classes
    .filter(Boolean)
    .map((c) => {
      if (typeof c === 'object') {
        return Object.entries(c)
          .filter(([, value]) => value)
          .map(([key]) => key)
          .join(' ');
      }
      return String(c);
    })
    .join(' ');
}