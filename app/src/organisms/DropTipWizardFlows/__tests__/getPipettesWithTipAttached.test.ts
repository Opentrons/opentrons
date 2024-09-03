import { describe, it, beforeEach, expect, vi } from 'vitest'
import { getCommands } from '@opentrons/api-client'

import { getPipettesWithTipAttached } from '../getPipettesWithTipAttached'
import { LEFT, RIGHT } from '@opentrons/shared-data'

import type { GetPipettesWithTipAttached } from '../getPipettesWithTipAttached'

vi.mock('@opentrons/api-client')

const HOST_NAME = 'localhost'
const RUN_ID = 'testRunId'
const LEFT_PIPETTE_ID = 'testId1'
const RIGHT_PIPETTE_ID = 'testId2'
const LEFT_PIPETTE_NAME = 'testLeftName'
const RIGHT_PIPETTE_NAME = 'testRightName'
const PICK_UP_TIP = 'pickUpTip'
const DROP_TIP = 'dropTip'
const DROP_TIP_IN_PLACE = 'dropTipInPlace'
const LOAD_PIPETTE = 'loadPipette'
const FIXIT_INTENT = 'fixit'

const mockAttachedInstruments = {
  data: [
    { mount: LEFT, state: { tipDetected: true } },
    { mount: RIGHT, state: { tipDetected: true } },
  ],
  meta: { cursor: 0, totalLength: 2 },
}

const createMockCommand = (
  type: string,
  id: string,
  pipetteId: string,
  status = 'succeeded'
) => ({
  id,
  key: `${id}-key`,
  commandType: type,
  status,
  params: { pipetteId },
})

const mockCommands = {
  data: [
    createMockCommand(LOAD_PIPETTE, 'load-left', LEFT_PIPETTE_ID),
    createMockCommand(LOAD_PIPETTE, 'load-right', RIGHT_PIPETTE_ID),
    createMockCommand(PICK_UP_TIP, 'pickup-left', LEFT_PIPETTE_ID),
    createMockCommand(DROP_TIP, 'drop-left', LEFT_PIPETTE_ID, 'succeeded'),
  ],
  meta: { cursor: 0, totalLength: 4 },
}

const mockRunRecord = {
  data: {
    pipettes: [
      { id: LEFT_PIPETTE_ID, pipetteName: LEFT_PIPETTE_NAME, mount: LEFT },
      { id: RIGHT_PIPETTE_ID, pipetteName: RIGHT_PIPETTE_NAME, mount: RIGHT },
    ],
  },
}

describe('getPipettesWithTipAttached', () => {
  let DEFAULT_PARAMS: GetPipettesWithTipAttached

  beforeEach(() => {
    DEFAULT_PARAMS = {
      host: { hostname: HOST_NAME },
      runId: RUN_ID,
      attachedInstruments: mockAttachedInstruments as any,
      runRecord: mockRunRecord as any,
    }

    vi.mocked(getCommands).mockResolvedValue({
      data: mockCommands,
    } as any)
  })

  it('returns an empty array if attachedInstruments is null', async () => {
    const params = { ...DEFAULT_PARAMS, attachedInstruments: null }
    const result = await getPipettesWithTipAttached(params)
    expect(result).toEqual([])
  })

  it('returns an empty array if runRecord is null', async () => {
    const params = { ...DEFAULT_PARAMS, runRecord: null }
    const result = await getPipettesWithTipAttached(params)
    expect(result).toEqual([])
  })

  it('returns an empty array when no tips are attached according to protocol', async () => {
    const mockCommandsWithoutAttachedTips = {
      ...mockCommands,
      data: [
        createMockCommand(LOAD_PIPETTE, 'load-left', LEFT_PIPETTE_ID),
        createMockCommand(LOAD_PIPETTE, 'load-right', RIGHT_PIPETTE_ID),
        createMockCommand(PICK_UP_TIP, 'pickup-left', LEFT_PIPETTE_ID),
        createMockCommand(DROP_TIP, 'drop-left', LEFT_PIPETTE_ID, 'succeeded'),
      ],
    }

    vi.mocked(getCommands).mockResolvedValue({
      data: mockCommandsWithoutAttachedTips,
    } as any)

    const result = await getPipettesWithTipAttached(DEFAULT_PARAMS)
    expect(result).toEqual([])
  })

  it('returns pipettes with protocol detected tip attachment', async () => {
    const mockCommandsWithPickUpTip = {
      ...mockCommands,
      data: [
        ...mockCommands.data,
        createMockCommand(PICK_UP_TIP, 'pickup-left-2', LEFT_PIPETTE_ID),
        createMockCommand(PICK_UP_TIP, 'pickup-right', RIGHT_PIPETTE_ID),
      ],
    }

    vi.mocked(getCommands).mockResolvedValue({
      data: mockCommandsWithPickUpTip,
    } as any)

    const result = await getPipettesWithTipAttached(DEFAULT_PARAMS)
    expect(result).toEqual(mockAttachedInstruments.data)
  })

  it('always returns the left mount before the right mount if both pipettes have tips attached', async () => {
    const mockCommandsWithPickUpTip = {
      ...mockCommands,
      data: [
        ...mockCommands.data,
        createMockCommand(PICK_UP_TIP, 'pickup-right', RIGHT_PIPETTE_ID),
        createMockCommand(PICK_UP_TIP, 'pickup-left-2', LEFT_PIPETTE_ID),
      ],
    }

    vi.mocked(getCommands).mockResolvedValue({
      data: mockCommandsWithPickUpTip,
    } as any)

    const result = await getPipettesWithTipAttached(DEFAULT_PARAMS)
    expect(result.length).toBe(2)
    expect(result[0].mount).toEqual(LEFT)
    expect(result[1].mount).toEqual(RIGHT)
  })

  it('does not return otherwise legitimate failed tip exchange commands if fixit intent tip commands are present and successful', async () => {
    const mockCommandsWithFixit = {
      ...mockCommands,
      data: [
        ...mockCommands.data,
        {
          ...createMockCommand(
            DROP_TIP_IN_PLACE,
            'fixit-drop',
            LEFT_PIPETTE_ID
          ),
          intent: FIXIT_INTENT,
        },
      ],
    }

    vi.mocked(getCommands).mockResolvedValue({
      data: mockCommandsWithFixit,
    } as any)

    const result = await getPipettesWithTipAttached(DEFAULT_PARAMS)
    expect(result).toEqual([])
  })

  it('considers a tip attached only if the last tip exchange command was pickUpTip', async () => {
    const mockCommandsWithPickUpTip = {
      ...mockCommands,
      data: [
        ...mockCommands.data,
        createMockCommand(PICK_UP_TIP, 'pickup-left-2', LEFT_PIPETTE_ID),
      ],
    }

    vi.mocked(getCommands).mockResolvedValue({
      data: mockCommandsWithPickUpTip,
    } as any)

    const result = await getPipettesWithTipAttached(DEFAULT_PARAMS)
    expect(result).toEqual([mockAttachedInstruments.data[0]])
  })
})
