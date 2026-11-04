import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getInstruments } from '@opentrons/api-client'
import { useHost } from '@opentrons/react-api-client'
import { getPipetteModelSpecs } from '@opentrons/shared-data'
import { fixtureP10Single } from '@opentrons/shared-data/pipette/fixtures/name'

import { useTipAttachmentStatus } from '../useTipAttachmentStatus'

import type { PipetteData } from '@opentrons/api-client'
import type { PipetteModelSpecs } from '@opentrons/shared-data'

vi.mock('@opentrons/shared-data', async importOriginal => {
  const actual = await importOriginal<typeof getPipetteModelSpecs>()
  return {
    ...actual,
    getPipetteModelSpecs: vi.fn(),
  }
})
vi.mock('@opentrons/api-client')
vi.mock('@opentrons/react-api-client')

const MOCK_HOST = { ip: '1.2.3.4', port: 31950 } as any

const MOCK_ACTUAL_PIPETTE = {
  ...fixtureP10Single,
  model: 'model',
  tipLength: {
    value: 20,
  },
} as PipetteModelSpecs

const mockPipetteData: PipetteData = {
  mount: 'left',
  instrumentType: 'pipette',
  instrumentModel: 'p1000_single_v3.6',
  ok: true,
  state: { tipDetected: true },
} as any

const mockSecondPipetteData: PipetteData = {
  ...mockPipetteData,
  mount: 'right',
}

describe('useTipAttachmentStatus', () => {
  beforeEach(() => {
    vi.mocked(useHost).mockReturnValue(MOCK_HOST)
    vi.mocked(getPipetteModelSpecs).mockReturnValue(MOCK_ACTUAL_PIPETTE)

    vi.mocked(getInstruments).mockResolvedValue({
      data: { data: [mockPipetteData, mockSecondPipetteData] },
    } as any)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const renderTipAttachmentStatus = () => {
    return renderHook(() => useTipAttachmentStatus())
  }

  it('should return the correct initial state', async () => {
    const { result } = renderTipAttachmentStatus()

    await waitFor(() => {
      expect(result.current).toBeDefined()
    })

    expect(result.current.aPipetteWithTip).toEqual(null)
  })

  it('should determine tip status from tipDetected', async () => {
    const { result } = renderTipAttachmentStatus()

    await act(async () => {
      await result.current.determineTipStatus()
    })

    expect(result.current.aPipetteWithTip).toMatchObject({
      mount: 'left',
      specs: MOCK_ACTUAL_PIPETTE,
    })
  })

  it('should treat tipDetected false or missing as no tip', async () => {
    vi.mocked(getInstruments).mockResolvedValue({
      data: {
        data: [
          { ...mockPipetteData, state: { tipDetected: false } },
          { ...mockSecondPipetteData, state: undefined },
        ],
      },
    } as any)

    const { result } = renderTipAttachmentStatus()

    await act(async () => {
      await result.current.determineTipStatus()
    })

    expect(result.current.aPipetteWithTip).toBeNull()
  })

  it('should handle network errors', async () => {
    vi.mocked(getInstruments).mockRejectedValueOnce(new Error('Error'))
    const { result } = renderTipAttachmentStatus()

    await act(async () => {
      await result.current.determineTipStatus()
    })

    expect(result.current.aPipetteWithTip).toBeNull()
  })

  it('should reset tip status', async () => {
    const { result } = renderTipAttachmentStatus()

    await act(async () => {
      await result.current.determineTipStatus()
    })

    act(() => {
      result.current.resetTipStatus()
    })

    expect(result.current.aPipetteWithTip).toEqual(null)
  })

  it('should return the left pipette first when both have tips', async () => {
    vi.mocked(getInstruments).mockResolvedValueOnce({
      data: {
        data: [mockSecondPipetteData, mockPipetteData],
      },
    } as any)

    const { result } = renderTipAttachmentStatus()

    await act(async () => {
      await result.current.determineTipStatus()
    })

    expect(result.current.aPipetteWithTip?.mount).toBe('left')
  })
})
