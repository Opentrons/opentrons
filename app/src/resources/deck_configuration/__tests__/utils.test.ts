import { RunTimeCommand } from '@opentrons/shared-data'
import {
  FLEX_SIMPLEST_DECK_CONFIG,
  getSimplestDeckConfigForProtocolCommands,
} from '../utils'

const RUN_TIME_COMMAND_STUB_MIXIN: Pick<
  RunTimeCommand,
  'id' | 'createdAt' | 'startedAt' | 'completedAt' | 'status'
> = {
  id: 'fake_id',
  createdAt: 'fake_createdAt',
  startedAt: 'fake_startedAt',
  completedAt: 'fake_createdAt',
  status: 'succeeded',
}

describe('getSimplestDeckConfigForProtocolCommands', () => {
  it('returns simplest deck if no commands alter addressable areas', () => {
    expect(getSimplestDeckConfigForProtocolCommands([])).toEqual(
      FLEX_SIMPLEST_DECK_CONFIG
    )
  })
  it('returns staging area fixtures if commands address column 4 areas', () => {
    const cutoutConfigs = getSimplestDeckConfigForProtocolCommands([
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
      },
    ])
    expect(cutoutConfigs).toEqual([
      ...FLEX_SIMPLEST_DECK_CONFIG.slice(0, 8),
      {
        cutoutId: 'cutoutA3',
        cutoutFixtureId: 'stagingAreaRightSlot',
        requiredAddressableAreas: ['A4'],
      },
      {
        cutoutId: 'cutoutB3',
        cutoutFixtureId: 'stagingAreaRightSlot',
        requiredAddressableAreas: ['B4'],
      },
      {
        cutoutId: 'cutoutC3',
        cutoutFixtureId: 'stagingAreaRightSlot',
        requiredAddressableAreas: ['C4'],
      },
      {
        cutoutId: 'cutoutD3',
        cutoutFixtureId: 'stagingAreaRightSlot',
        requiredAddressableAreas: ['D4'],
      },
    ])
  })
  it('returns simplest cutout fixture where many are possible', () => {
    const cutoutConfigs = getSimplestDeckConfigForProtocolCommands([
      {
        ...RUN_TIME_COMMAND_STUB_MIXIN,
        commandType: 'moveLabware',
        params: {
          newLocation: { addressableAreaName: 'gripperWasteChute' },
          labwareId: 'fake_labwareId',
          strategy: 'usingGripper',
        },
      },
    ])
    expect(cutoutConfigs).toEqual([
      ...FLEX_SIMPLEST_DECK_CONFIG.slice(0, 11),
      {
        cutoutId: 'cutoutD3',
        cutoutFixtureId: 'wasteChuteRightAdapterNoCover',
        requiredAddressableAreas: ['gripperWasteChute'],
      },
    ])
  })
  it('returns compatible cutout fixture where multiple addressable requirements present', () => {
    const cutoutConfigs = getSimplestDeckConfigForProtocolCommands([
      {
        ...RUN_TIME_COMMAND_STUB_MIXIN,
        commandType: 'moveLabware',
        params: {
          newLocation: { addressableAreaName: 'gripperWasteChute' },
          labwareId: 'fake_labwareId',
          strategy: 'usingGripper',
        },
      },
      {
        ...RUN_TIME_COMMAND_STUB_MIXIN,
        commandType: 'moveLabware',
        params: {
          newLocation: { addressableAreaName: 'D4' },
          labwareId: 'fake_labwareId',
          strategy: 'usingGripper',
        },
      },
    ])
    expect(cutoutConfigs).toEqual([
      ...FLEX_SIMPLEST_DECK_CONFIG.slice(0, 11),
      {
        cutoutId: 'cutoutD3',
        cutoutFixtureId: 'stagingAreaSlotWithWasteChuteRightAdapterNoCover',
        requiredAddressableAreas: ['gripperWasteChute', 'D4'],
      },
    ])
  })
})
