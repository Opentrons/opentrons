import { CommandsData, RunCommandSummary } from '@opentrons/api-client'
import type { CreateCommand } from '@opentrons/shared-data/protocol/types/schemaV7'

export const mockAnonLoadCommand: CreateCommand = {
  commandType: 'loadLabware',
  params: {
    labwareId: 'abc123',
    location: {
      slotName: '1',
    },
    version: 1,
    namespace: 'mockNamespace',
    loadName: 'mockLoadname',
  },
}

export const mockLoadLabwareRunCommandSummary: RunCommandSummary = {
  id: 'qwerty',
  key: 'first_load_labware',
  commandType: 'loadLabware',
  params: {
    version: 1,
    namespace: 'mockNamespace',
    loadName: 'mockLoadname',
    labwareId: 'abc123',
    location: {
      slotName: '1',
    },
  },
  status: 'running',
  createdAt: 'fake_created_at_timestamp',
  startedAt: 'fake_created_at_timestamp',
  completedAt: 'fake_created_at_timestamp',
  error: null,
}

export const mockLoadPipetteRunCommandSummary: RunCommandSummary = {
  id: 'qwerty',
  key: 'first_load_pipette',
  commandType: 'loadPipette',
  params: {
    mount: 'left',
    pipetteId: 'fake_load_pipette_id',
    pipetteName: 'p10_single',
  },
  status: 'running',
  createdAt: 'fake_created_at_timestamp',
  startedAt: 'fake_created_at_timestamp',
  completedAt: 'fake_created_at_timestamp',
  error: null,
}

export const mockCommandsResponse: CommandsData = {
  data: [mockLoadLabwareRunCommandSummary, mockLoadPipetteRunCommandSummary],
  meta: {
    cursor: 0,
    pageLength: 60,
    totalLength: 100,
  },
  links: {
    current: {
      href: 'fake_current_link_href',
      meta: {
        runId: 'fake_run_id',
        commandId: 'fake_command_id',
        key: 'fake_command_key',
        createdAt: 'fake_command_created_at',
        index: 10,
      },
    },
  },
}
