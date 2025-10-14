// used to test useCommandTypeSummaries
export function getHighestCommandSchema(): any {
  const modules = import.meta.glob('../../command/schemas/*.json', {
    eager: true,
  })

  let highestNumber = -Infinity
  let highestSchema: any = null

  for (const path in modules) {
    const match = path.match(/(\d+)\.json$/)
    if (match) {
      const num = Number(match[1])
      if (num > highestNumber) {
        highestNumber = num
        highestSchema = (modules as Record<string, any>)[path]
      }
    }
  }
  if (!highestSchema) {
    throw new Error('No schema files found')
  }

  return highestSchema
}
