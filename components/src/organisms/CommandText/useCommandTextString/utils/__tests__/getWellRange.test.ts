import { describe, expect, it } from 'vitest'

import { COLUMN, PARTIAL_COLUMN, ROW, SINGLE } from '@opentrons/shared-data'

import { getWellRange } from '../getWellRange'

import type { RunTimeCommand } from '@opentrons/shared-data'

describe('getWellRange', () => {
  const pipette96chName = 'p1000_96'
  const pipette96chId = 'id_96ch'
  const pipette8chName = 'p1000_multi_flex'
  const pipette8chId = 'id_8ch'
  const wellName = 'A1'
  const mockLoad96Ch: RunTimeCommand[] = [
    {
      id: '97ba49a5-04f6-4f91-986a-04a0eb632882',
      createdAt: '2022-09-07T19:47:42.781065+00:00',
      commandType: 'loadPipette',
      key: '0feeecaf-3895-46d7-ab71-564601265e35',
      status: 'succeeded',
      params: {
        pipetteName: pipette96chName,
        mount: 'left',
        pipetteId: pipette96chId,
      },
      result: {
        pipetteId: pipette96chId,
      },
      startedAt: '2022-09-07T19:47:42.782665+00:00',
      completedAt: '2022-09-07T19:47:42.785061+00:00',
    },
    {
      id: 'commands.LOAD_LABWARE-2',
      createdAt: '2022-04-01T15:46:01.745870+00:00',
      startedAt: '2025-06-09T19:03:33.876627Z',
      completedAt: '2025-06-09T19:03:33.920770Z',
      commandType: 'loadLabware',
      key: 'commands.LOAD_LABWARE-2',
      status: 'succeeded',
      params: {
        location: {
          slotName: 'A1',
        },
        loadName: 'opentrons_flex_96_tiprack_1000ul',
        namespace: 'opentrons',
        version: 1,
        labwareId: 'labware',
        displayName: 'Opentrons Flex 96 Tip Rack 1000 µL',
      },
    },
  ]
  it('returns the correct well range for 96ch COLUMN tip pick up', () => {
    const configureColumnLayout: RunTimeCommand[] = [
      {
        id: 'ddc7eb8a-125c-4cbe-a17b-d7656f4267ea',
        key: 'd4beb0ebc152fc6721eda98eae414039',
        commandType: 'configureNozzleLayout',
        createdAt: '2025-06-09T19:03:33.875521Z',
        startedAt: '2025-06-09T19:03:33.876627Z',
        completedAt: '2025-06-09T19:03:33.920770Z',
        status: 'succeeded',
        params: {
          pipetteId: pipette96chId,
          configurationParams: {
            style: COLUMN,
            primaryNozzle: 'A1',
          },
        },
        notes: [],
      },
    ]
    const allColumnCommands = [...mockLoad96Ch, ...configureColumnLayout]
    expect(
      getWellRange(pipette96chId, allColumnCommands, wellName, pipette96chName)
    ).toEqual('A1 - H1')
  })
  it('returns the correct well range for 96ch ROW tip pick up', () => {
    const configureRowLayout: RunTimeCommand[] = [
      {
        id: 'ddc7eb8a-125c-4cbe-a17b-d7656f4267ea',
        key: 'd4beb0ebc152fc6721eda98eae414039',
        commandType: 'configureNozzleLayout',
        createdAt: '2025-06-09T19:03:33.875521Z',
        startedAt: '2025-06-09T19:03:33.876627Z',
        completedAt: '2025-06-09T19:03:33.920770Z',
        status: 'succeeded',
        params: {
          pipetteId: pipette96chId,
          configurationParams: {
            style: ROW,
            primaryNozzle: 'A1',
          },
        },
        notes: [],
      },
    ]
    const allColumnCommands = [...mockLoad96Ch, ...configureRowLayout]
    expect(
      getWellRange(pipette96chId, allColumnCommands, wellName, pipette96chName)
    ).toEqual('A1 - A12')
  })
  it('returns the correct well range for 96ch SINGLE tip pick up', () => {
    const configureSingleLayout: RunTimeCommand[] = [
      {
        id: 'ddc7eb8a-125c-4cbe-a17b-d7656f4267ea',
        key: 'd4beb0ebc152fc6721eda98eae414039',
        commandType: 'configureNozzleLayout',
        createdAt: '2025-06-09T19:03:33.875521Z',
        startedAt: '2025-06-09T19:03:33.876627Z',
        completedAt: '2025-06-09T19:03:33.920770Z',
        status: 'succeeded',
        params: {
          pipetteId: pipette96chId,
          configurationParams: {
            style: SINGLE,
            primaryNozzle: 'A1',
          },
        },
        notes: [],
      },
    ]
    const allColumnCommands = [...mockLoad96Ch, ...configureSingleLayout]
    expect(
      getWellRange(pipette96chId, allColumnCommands, 'H12', pipette96chName)
    ).toEqual('H12')
  })
  it('returns the correct well range for 8ch SINGLE tip pick up', () => {
    const configureSingleLayout: RunTimeCommand[] = [
      {
        id: 'ddc7eb8a-125c-4cbe-a17b-d7656f4267ea',
        key: 'd4beb0ebc152fc6721eda98eae414039',
        commandType: 'configureNozzleLayout',
        createdAt: '2025-06-09T19:03:33.875521Z',
        startedAt: '2025-06-09T19:03:33.876627Z',
        completedAt: '2025-06-09T19:03:33.920770Z',
        status: 'succeeded',
        params: {
          pipetteId: pipette8chId,
          configurationParams: {
            style: SINGLE,
            primaryNozzle: 'A1',
          },
        },
        notes: [],
      },
    ]
    const allColumnCommands = [...mockLoad96Ch, ...configureSingleLayout]
    expect(
      getWellRange(pipette8chId, allColumnCommands, 'H12', pipette8chName)
    ).toEqual('H12')
  })
  it('returns the correct well range for 8ch PARTIAL 2 tip pick up', () => {
    const configurePartial2Layout: RunTimeCommand[] = [
      {
        id: 'ddc7eb8a-125c-4cbe-a17b-d7656f4267ea',
        key: 'd4beb0ebc152fc6721eda98eae414039',
        commandType: 'configureNozzleLayout',
        createdAt: '2025-06-09T19:03:33.875521Z',
        startedAt: '2025-06-09T19:03:33.876627Z',
        completedAt: '2025-06-09T19:03:33.920770Z',
        status: 'succeeded',
        params: {
          pipetteId: pipette8chId,
          configurationParams: {
            style: PARTIAL_COLUMN,
            primaryNozzle: 'A1',
            backLeftNozzle: 'G1',
          },
        },
        notes: [],
      },
    ]
    const allColumnCommands = [...mockLoad96Ch, ...configurePartial2Layout]
    expect(
      getWellRange(pipette8chId, allColumnCommands, 'A1', pipette8chName)
    ).toEqual('A1 - B1')
  })
  it('returns the correct well range for 8ch PARTIAL 7 tip pick up', () => {
    const configurePartial7Layout: RunTimeCommand[] = [
      {
        id: 'ddc7eb8a-125c-4cbe-a17b-d7656f4267ea',
        key: 'd4beb0ebc152fc6721eda98eae414039',
        commandType: 'configureNozzleLayout',
        createdAt: '2025-06-09T19:03:33.875521Z',
        startedAt: '2025-06-09T19:03:33.876627Z',
        completedAt: '2025-06-09T19:03:33.920770Z',
        status: 'succeeded',
        params: {
          pipetteId: pipette8chId,
          configurationParams: {
            style: PARTIAL_COLUMN,
            primaryNozzle: 'A1',
            backLeftNozzle: 'B1',
          },
        },
        notes: [],
      },
    ]
    const allColumnCommands = [...mockLoad96Ch, ...configurePartial7Layout]
    expect(
      getWellRange(pipette8chId, allColumnCommands, 'A1', pipette8chName)
    ).toEqual('A1 - G1')
  })
})
