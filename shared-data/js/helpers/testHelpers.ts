import type { RunTimeCommand } from '../../protocol'

// used to test useCommandTypeSummaries
export async function getHighestCommandSchema(): Promise<any> {
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
  if (!highestSchema) throw new Error('No schema files found!')

  return highestSchema
}

export async function getLatestCommandTypeList(): Promise<
  Array<RunTimeCommand['commandType']>
> {
  const highestSchema = await getHighestCommandSchema()

  // make sure discriminator.mapping exists in the command schema
  if (!highestSchema.discriminator || !highestSchema.discriminator.mapping) {
    throw new Error('discriminator.mapping not found in highest schema')
  }
  const mapping: Record<string, string> = highestSchema.discriminator.mapping

  const commandTypes: Array<RunTimeCommand['commandType']> = Object.keys(
    mapping
  ) as any

  return commandTypes
}
