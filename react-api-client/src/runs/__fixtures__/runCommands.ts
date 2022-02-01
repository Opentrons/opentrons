import { CommandsData } from '@opentrons/api-client'
import type {
  CreateCommand,
  RunTimeCommand,
} from '@opentrons/shared-data/protocol/types/schemaV6'

export const mockAnonLoadCommand: CreateCommand = {
  commandType: 'loadLabware',
  params: {
    labwareId: 'abc123',
    location: {
      slotName: '1',
    },
  },
}

export const mockLoadLabwareRunTimeCommand: RunTimeCommand = {
  id: 'qwerty',
  key: 'first_load_labware',
  commandType: 'loadLabware',
  params: {
    labwareId: 'abc123',
    location: {
      slotName: '1',
    },
  },
  result: {
    labwareId: 'abc123',
    definition: {} as any,
    offset: { x: 1, y: 2, z: 3 },
  },
  error: null,
  status: 'running',
  createdAt: 'fake_created_at_timestamp',
  startedAt: 'fake_created_at_timestamp',
  completedAt: 'fake_created_at_timestamp',
}

export const mockLoadPipetteRunTimeCommand: RunTimeCommand = {
  id: 'qwerty',
  key: 'first_load_pipette',
  commandType: 'loadPipette',
  params: {
    mount: 'left',
    pipetteId: 'fake_load_pipette_id',
  },
  result: {
    pipetteId: 'abc123',
  },
  error: null,
  status: 'running',
  createdAt: 'fake_created_at_timestamp',
  startedAt: 'fake_created_at_timestamp',
  completedAt: 'fake_created_at_timestamp',
}

export const mockCommandsResponse: CommandsData = {
  data: [mockLoadLabwareRunTimeCommand, mockLoadPipetteRunTimeCommand],
  meta: {
    cursor: 0,
    before: 0,
    after: 60,
    total: 100,
  },
  links: {
    current: {
      href: 'fake_current_link_href',
      meta: {
        runId: 'fake_run_id',
        commandId: 'fake_command_id',
        index: 10,
      },
    },
  },
}
