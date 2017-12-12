export const humanize = s =>
  s.toLowerCase().split(/-|_|\./)
    .filter(s => s) // only truthy
    .map(substring =>
      substring[0].toUpperCase() + substring.slice(1)
    ).join(' ')
