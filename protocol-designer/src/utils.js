export const humanize = s =>
  s.toLowerCase().split(/-|_|\./)
    .filter(s => s) // only truthy
    .map(substring =>
      substring[0].toUpperCase() + substring.slice(1)
    ).join(' ')

// Not really a UUID, but close enough...?
export const uuid = () => new Date().getTime() + '.' + Math.random()
