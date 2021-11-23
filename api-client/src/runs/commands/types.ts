import type { Command } from '@opentrons/shared-data'

export type AnonymousCommand = Omit<Command, 'id'>
