import { RunTimeCommand } from "@opentrons/shared-data"
import { FLEX_SIMPLEST_DECK_CONFIG, getAllCutoutConfigsFromProtocolCommands } from "../utils"


const RUN_TIME_COMMAND_STUB_MIXIN: Pick<RunTimeCommand, 'id' | 'createdAt' | 'startedAt' | 'completedAt' | 'status'> = {
  id: 'fake_id',
  createdAt: 'fake_createdAt',
  startedAt: 'fake_startedAt',
  completedAt: 'fake_createdAt',
  status: 'succeeded',
}


describe('getAllCutoutConfigsFromProtocolCommands', () => {
  it('returns simplest deck if no commands alter addressable areas', () => {
    expect(getAllCutoutConfigsFromProtocolCommands([])).toEqual(FLEX_SIMPLEST_DECK_CONFIG)
  })
  it('returns staging area fixtures if commands address column 4 areas', () => {
    const cutoutConfigs = getAllCutoutConfigsFromProtocolCommands([
      {
        ...RUN_TIME_COMMAND_STUB_MIXIN,
        commandType: 'loadLabware',
        params: {
          loadName: 'fake_load_name',
          location: { slotName: 'A4' },
          version: 1,
          namespace: 'fake_namespace',
        },
      },
      {
        ...RUN_TIME_COMMAND_STUB_MIXIN,
        commandType: 'loadLabware',
        params: {
          loadName: 'fake_load_name',
          location: { slotName: 'B4' },
          version: 1,
          namespace: 'fake_namespace',
        },
      },
      {
        ...RUN_TIME_COMMAND_STUB_MIXIN,
        commandType: 'loadLabware',
        params: {
          loadName: 'fake_load_name',
          location: { slotName: 'C4' },
          version: 1,
          namespace: 'fake_namespace',
        },
      },
      {
        ...RUN_TIME_COMMAND_STUB_MIXIN,
        commandType: 'loadLabware',
        params: {
          loadName: 'fake_load_name',
          location: { slotName: 'D4' },
          version: 1,
          namespace: 'fake_namespace',
        },
      }
    ])
    expect(cutoutConfigs).toEqual([
      ...FLEX_SIMPLEST_DECK_CONFIG.slice(0, 8),
      {cutoutId: 'cutoutA3', cutoutFixtureId: 'stagingAreaRightSlot'},
      {cutoutId: 'cutoutB3', cutoutFixtureId: 'stagingAreaRightSlot'},
      {cutoutId: 'cutoutC3', cutoutFixtureId: 'stagingAreaRightSlot'},
      {cutoutId: 'cutoutD3', cutoutFixtureId: 'stagingAreaRightSlot'},
    ])
  })
})
