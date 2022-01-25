import type { CreateCommand } from '@opentrons/shared-data/protocol/types/schemaV6'

export const mockAnonLoadCommand: CreateCommand = {
  commandType: 'loadLabware',
  params: {
    labwareId: 'abc123',
    location: {
      slotName: '1',
    },
  },
}
