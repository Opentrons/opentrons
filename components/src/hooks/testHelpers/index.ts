import { getHighestCommandSchema } from '@opentrons/shared-data'

import type { RunTimeCommand } from '@opentrons/shared-data'

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
