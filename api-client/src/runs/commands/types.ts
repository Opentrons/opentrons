import type { CreateCommand } from '@opentrons/shared-data'

export type AnonymousCommand = Omit<CreateCommand, 'id'>
