import { describe, expect, it } from 'vitest'

import { getDeckDefFromRobotType } from '..'
import { FLEX_ROBOT_TYPE } from '../..'
import {
  FLEX_SIMPLEST_DECK_CONFIG_PROTOCOL_SPEC,
  getEmptyDeckConfiguration,
  getSimplestDeckConfigForProtocol,
} from '../getSimplestFlexDeckConfig'

import type { RunTimeCommand } from '../../../protocol'
import type { CompletedProtocolAnalysis, DeckConfiguration } from '../../types'

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

export const FLEX_SIMPLEST_DECK_CONFIG: DeckConfiguration = [
  { cutoutId: 'cutoutA1', cutoutFixtureId: 'singleLeftSlot' },
  { cutoutId: 'cutoutB1', cutoutFixtureId: 'singleLeftSlot' },
  { cutoutId: 'cutoutC1', cutoutFixtureId: 'singleLeftSlot' },
  { cutoutId: 'cutoutD1', cutoutFixtureId: 'singleLeftSlot' },
  { cutoutId: 'cutoutA2', cutoutFixtureId: 'singleCenterSlot' },
  { cutoutId: 'cutoutB2', cutoutFixtureId: 'singleCenterSlot' },
  { cutoutId: 'cutoutC2', cutoutFixtureId: 'singleCenterSlot' },
  { cutoutId: 'cutoutD2', cutoutFixtureId: 'singleCenterSlot' },
  { cutoutId: 'cutoutA3', cutoutFixtureId: 'singleRightSlot' },
  { cutoutId: 'cutoutB3', cutoutFixtureId: 'singleRightSlot' },
  { cutoutId: 'cutoutC3', cutoutFixtureId: 'singleRightSlot' },
  { cutoutId: 'cutoutD3', cutoutFixtureId: 'singleRightSlot' },
]

describe('getEmptyDeckConfiguration', () => {
  it.only('should be the same as FLEX_SIMPLEST_DECK_CONFIG', () => {
    const result = getEmptyDeckConfiguration(
      getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
    )
    const sortByCutoutId = (
      a: { cutoutId: string },
      b: { cutoutId: string }
    ): number => a.cutoutId.localeCompare(b.cutoutId)

    expect(result.sort(sortByCutoutId)).toEqual(
      FLEX_SIMPLEST_DECK_CONFIG.sort(sortByCutoutId)
    )
  })
})

describe('getSimplestDeckConfigForProtocol', () => {
  it('returns simplest deck if no commands alter addressable areas', () => {
    expect(getSimplestDeckConfigForProtocol(null)).toEqual(
      FLEX_SIMPLEST_DECK_CONFIG_PROTOCOL_SPEC
    )
  })
  it('returns staging area fixtures if commands address column 4 areas', () => {
    const cutoutConfigs = getSimplestDeckConfigForProtocol({
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
    } as unknown as CompletedProtocolAnalysis)
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
    const cutoutConfigs = getSimplestDeckConfigForProtocol({
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
    } as unknown as CompletedProtocolAnalysis)
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
    const cutoutConfigs = getSimplestDeckConfigForProtocol({
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
    } as unknown as CompletedProtocolAnalysis)
    expect(cutoutConfigs).toEqual([
      ...FLEX_SIMPLEST_DECK_CONFIG_PROTOCOL_SPEC.slice(0, 11),
      {
        cutoutId: 'cutoutD3',
        cutoutFixtureId: 'stagingAreaSlotWithWasteChuteRightAdapterNoCover',
        requiredAddressableAreas: ['gripperWasteChute', 'D4'],
      },
    ])
  })
  it('returns deck with trash in A3 when legacy trash labware is present', () => {
    const cutoutConfigs = getSimplestDeckConfigForProtocol({
      commands: [],
      labware: [
        {
          id: 'trash_id',
          definitionUri: 'opentrons/opentrons_1_trash_3200ml_fixed/1',
          displayName: 'Trash',
          loadName: 'opentrons_1_trash_3200ml_fixed',
          location: { slotName: 'A3' },
        },
      ],
    } as unknown as CompletedProtocolAnalysis)
    expect(cutoutConfigs).toEqual([
      ...FLEX_SIMPLEST_DECK_CONFIG_PROTOCOL_SPEC.slice(0, 8),
      {
        cutoutId: 'cutoutA3',
        cutoutFixtureId: 'trashBinAdapter',
        requiredAddressableAreas: ['movableTrashA3'],
      },
      ...FLEX_SIMPLEST_DECK_CONFIG_PROTOCOL_SPEC.slice(9),
    ])
  })
})
