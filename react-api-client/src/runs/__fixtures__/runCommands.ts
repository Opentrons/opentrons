import type { AnonymousCommand } from '@opentrons/api-client'

export const mockAnonLoadCommand: AnonymousCommand = {
  commandType: 'loadLabware',
  params: {
    labwareId: 'abc123',
    location: {
      slotName: '1',
    },
  },
}
