import {
  FLEX_SIMPLEST_DECK_CONFIG_PROTOCOL_SPEC,
  getSimplestDeckConfigForProtocol,
} from '../getSimplestFlexDeckConfig'

import type { RunTimeCommand } from '../../../protocol'
import type { CompletedProtocolAnalysis } from '../../types'

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

// TODO(bh, 2023-12-4): test cases for legacy fixed trash
describe('getSimplestDeckConfigForProtocol', () => {
  it('returns simplest deck if no commands alter addressable areas', () => {
    expect(getSimplestDeckConfigForProtocol(null)).toEqual(
      FLEX_SIMPLEST_DECK_CONFIG_PROTOCOL_SPEC
    )
  })
  it('returns staging area fixtures if commands address column 4 areas', () => {
    const cutoutConfigs = getSimplestDeckConfigForProtocol(({
      commands: [
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
      ],
      labware: [],
    } as unknown) as CompletedProtocolAnalysis)
    expect(cutoutConfigs).toEqual([
      ...FLEX_SIMPLEST_DECK_CONFIG_PROTOCOL_SPEC.slice(0, 8),
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
    const cutoutConfigs = getSimplestDeckConfigForProtocol(({
      commands: [
        {
          ...RUN_TIME_COMMAND_STUB_MIXIN,
          commandType: 'moveLabware',
          params: {
            newLocation: { addressableAreaName: 'gripperWasteChute' },
            labwareId: 'fake_labwareId',
            strategy: 'usingGripper',
          },
        },
      ],
      labware: [],
    } as unknown) as CompletedProtocolAnalysis)
    expect(cutoutConfigs).toEqual([
      ...FLEX_SIMPLEST_DECK_CONFIG_PROTOCOL_SPEC.slice(0, 11),
      {
        cutoutId: 'cutoutD3',
        cutoutFixtureId: 'wasteChuteRightAdapterNoCover',
        requiredAddressableAreas: ['gripperWasteChute'],
      },
    ])
  })
  it('returns compatible cutout fixture where multiple addressable requirements present', () => {
    const cutoutConfigs = getSimplestDeckConfigForProtocol(({
      commands: [
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
      ],
      labware: [],
    } as unknown) as CompletedProtocolAnalysis)
    expect(cutoutConfigs).toEqual([
      ...FLEX_SIMPLEST_DECK_CONFIG_PROTOCOL_SPEC.slice(0, 11),
      {
        cutoutId: 'cutoutD3',
        cutoutFixtureId: 'stagingAreaSlotWithWasteChuteRightAdapterNoCover',
        requiredAddressableAreas: ['gripperWasteChute', 'D4'],
      },
    ])
  })
})
