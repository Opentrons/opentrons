import { describe, it, beforeEach, expect, vi } from 'vitest'
import { getCommands } from '@opentrons/api-client'

import { getPipettesWithTipAttached } from '../getPipettesWithTipAttached'
import { LEFT, RIGHT } from '@opentrons/shared-data'

import type { GetPipettesWithTipAttached } from '../getPipettesWithTipAttached'

vi.mock('@opentrons/api-client')

const mockAttachedInstruments = {
  data: [
    {
      mount: 'left',
      state: {
        tipDetected: true,
      },
    },
    {
      mount: 'right',
      state: {
        tipDetected: true,
      },
    },
  ],
  meta: {
    cursor: 0,
    totalLength: 2,
  },
}

const mockCommands = {
  data: [
    {
      id: '7bce590e-78bd-4e6c-9166-cbd3d39468bf',
      key: 'b56a8e50-b08e-4792-ae97-70d175d2cf9a',
      commandType: 'loadPipette',
      createdAt: '2023-10-20T13:16:53.519743+00:00',
      startedAt: '2023-10-20T13:18:06.494736+00:00',
      completedAt: '2023-10-20T13:18:06.758755+00:00',
      status: 'succeeded',
      params: {
        pipetteName: 'p1000_single_flex',
        mount: 'left',
        pipetteId: 'testId1',
      },
    },
    {
      id: 'e6ebdf69-f1f3-418c-9f25-2068180bfaa8',
      key: 'b0a989d0-b651-4735-b3e8-e1f20ce5f53a',
      commandType: 'loadLabware',
      createdAt: '2023-10-20T13:16:53.536868+00:00',
      startedAt: '2023-10-20T13:18:06.764154+00:00',
      completedAt: '2023-10-20T13:18:06.765661+00:00',
      status: 'succeeded',
      params: {
        location: {
          slotName: 'A3',
        },
        loadName: 'opentrons_1_trash_3200ml_fixed',
        namespace: 'opentrons',
        version: 1,
        labwareId:
          'df371a43-1885-4590-8ca3-d38dc3096753:opentrons/opentrons_1_trash_3200ml_fixed/1',
        displayName: 'Opentrons Fixed Trash',
      },
    },
    {
      id: '256f1bcf-ae9f-4190-be8a-5389f6b1a962',
      key: '88c55e6a-4eb7-4863-a96e-de1de8ae27da',
      commandType: 'pickUpTip',
      createdAt: '2023-10-20T13:16:53.633713+00:00',
      startedAt: '2023-10-20T13:18:06.830080+00:00',
      completedAt: '2023-10-20T13:18:18.820189+00:00',
      status: 'succeeded',
      params: {
        labwareId:
          'c4b5c4b1-b4f7-4ec6-a4b7-6c8155d7288b:opentrons/opentrons_flex_96_filtertiprack_200ul/1',
        pipetteId: 'testId1',
      },
    },
    {
      id: '7f362b85-2005-4ea7-ab50-3aba27be79ca',
      key: '1bd57042-2f0d-4c0c-afa6-b1a7dfbff769',
      commandType: 'aspirate',
      createdAt: '2023-10-20T13:16:53.635966+00:00',
      startedAt: '2023-10-20T13:18:18.822130+00:00',
      completedAt: '2023-10-20T13:18:23.424071+00:00',
      status: 'succeeded',
      params: {
        labwareId:
          'd56511f1-8d02-4891-adba-d2710ae02279:opentrons/armadillo_96_wellplate_200ul_pcr_full_skirt/2',
        wellName: 'A1',
        wellLocation: {
          origin: 'bottom',
          offset: {
            x: 0,
            y: 0,
            z: 1.0,
          },
        },
        flowRate: 137.35,
        volume: 5.0,
        pipetteId: 'testId1',
      },
    },
    {
      id: '0220242c-4fe4-4d0c-92d8-71fcc45e944e',
      key: 'a3e946a0-9b93-45d4-8d22-d08815bab0ce',
      commandType: 'dropTip',
      status: 'failed',
      params: {
        pipetteId: 'testId1',
      },
    },
  ],
  links: {
    current: {
      href:
        '/runs/0d61a8ce-e5b8-4e09-9bf9-a65523094663/commands/0220242c-4fe4-4d0c-92d8-71fcc45e944e',
      meta: {
        runId: '0d61a8ce-e5b8-4e09-9bf9-a65523094663',
        commandId: '0220242c-4fe4-4d0c-92d8-71fcc45e944e',
        index: 10,
        key: 'a3e946a0-9b93-45d4-8d22-d08815bab0ce',
        createdAt: '2023-10-20T13:16:53.671711+00:00',
      },
    },
  },
  meta: {
    cursor: 0,
    totalLength: 11,
  },
}
const mockRunRecord = {
  data: {
    pipettes: [
      { id: 'testId1', pipetteName: 'testLeftName', mount: 'left' },
      { id: 'testId2', pipetteName: 'testRightName', mount: 'right' },
    ],
  },
}

describe('getPipettesWithTipAttached', () => {
  let DEFAULT_PARAMS: GetPipettesWithTipAttached

  beforeEach(() => {
    DEFAULT_PARAMS = {
      host: { hostname: 'localhost' },
      isFlex: true,
      runId: 'testRunId',
      attachedInstruments: mockAttachedInstruments as any,
      runRecord: mockRunRecord as any,
    }

    vi.mocked(getCommands).mockResolvedValue({
      data: mockCommands,
    } as any)
  })

  it('returns an empty array if attachedInstruments is undefined', () => {
    const params = {
      ...DEFAULT_PARAMS,
      attachedInstruments: undefined,
    } as GetPipettesWithTipAttached

    const result = getPipettesWithTipAttached(params)
    return expect(result).resolves.toEqual([])
  })

  it('returns an empty array if runRecord is undefined', () => {
    const params = {
      ...DEFAULT_PARAMS,
      runRecord: undefined,
    } as GetPipettesWithTipAttached

    const result = getPipettesWithTipAttached(params)
    return expect(result).resolves.toEqual([])
  })

  it('returns pipettes with sensor detected tip attachment if the robot is a Flex', () => {
    const result = getPipettesWithTipAttached(DEFAULT_PARAMS)
    return expect(result).resolves.toEqual(mockAttachedInstruments.data)
  })

  it('returns pipettes with protocol detected tip attachment if the sensor does not detect tip attachment', () => {
    const noTipDetectedInstruments = {
      ...mockAttachedInstruments,
      data: mockAttachedInstruments.data.map(item => ({
        ...item,
        state: {
          ...item.state,
          tipDetected: false,
        },
      })),
    }

    const params = {
      ...DEFAULT_PARAMS,
      attachedInstruments: noTipDetectedInstruments,
    } as GetPipettesWithTipAttached

    const result = getPipettesWithTipAttached(params)
    return expect(result).resolves.toEqual([noTipDetectedInstruments.data[0]])
  })

  it('returns pipettes with protocol detected tip attachment if the robot is an OT-2', () => {
    const params = {
      ...DEFAULT_PARAMS,
      isFlex: false,
    } as GetPipettesWithTipAttached

    const result = getPipettesWithTipAttached(params)
    return expect(result).resolves.toEqual([mockAttachedInstruments.data[0]])
  })

  it('always returns the left mount before the right mount if both pipettes have tips attached', async () => {
    const result = await getPipettesWithTipAttached(DEFAULT_PARAMS)
    expect(result[0].mount).toEqual(LEFT)
    expect(result[1].mount).toEqual(RIGHT)
  })

  it('does not return otherwise legitimate failed tip exchange commands if fixit intent tip commands are present and successful', async () => {
    const mockCommandsWithFixit = mockCommands.data.push({
      id: '0220242c-4fe4-4d0c-92d8-71fcc45e944e',
      key: 'a3e946a0-9b93-45d4-8d22-d08815bab0ce',
      intent: 'fixit',
      commandType: 'dropTipInPlace',
      status: 'succeeded',
      params: {
        pipetteId: 'testId1',
      },
    } as any)

    vi.mocked(getCommands).mockResolvedValue({
      data: { data: mockCommandsWithFixit, meta: { totalLength: 11 } },
    } as any)

    const result = await getPipettesWithTipAttached({
      ...DEFAULT_PARAMS,
      isFlex: false,
    })
    expect(result).toEqual([])
  })
})
