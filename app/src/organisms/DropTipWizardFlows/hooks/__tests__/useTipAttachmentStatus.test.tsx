import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

import { getPipetteModelSpecs } from '@opentrons/shared-data'
import { useInstrumentsQuery } from '@opentrons/react-api-client'

import { mockPipetteInfo } from '/app/redux/pipettes/__fixtures__'
import { getPipettesWithTipAttached } from '../useTipAttachmentStatus/getPipettesWithTipAttached'
import { DropTipWizard } from '../../DropTipWizard'
import { useTipAttachmentStatus } from '../useTipAttachmentStatus'

import type { Mock } from 'vitest'
import type { PipetteModelSpecs } from '@opentrons/shared-data'
import type { PipetteWithTip } from '../useTipAttachmentStatus'

vi.mock('@opentrons/shared-data', async importOriginal => {
  const actual = await importOriginal<typeof getPipetteModelSpecs>()
  return {
    ...actual,
    getPipetteModelSpecs: vi.fn(),
  }
})
vi.mock('@opentrons/react-api-client')
vi.mock('../useTipAttachmentStatus/getPipettesWithTipAttached')
vi.mock('../../DropTipWizard')

const MOCK_ACTUAL_PIPETTE = {
  ...mockPipetteInfo.pipetteSpecs,
  model: 'model',
  tipLength: {
    value: 20,
  },
} as PipetteModelSpecs

const mockPipetteWithTip: PipetteWithTip = {
  mount: 'left',
  specs: MOCK_ACTUAL_PIPETTE,
}

const mockSecondPipetteWithTip: PipetteWithTip = {
  mount: 'right',
  specs: MOCK_ACTUAL_PIPETTE,
}

const mockPipettesWithTip: PipetteWithTip[] = [
  mockPipetteWithTip,
  mockSecondPipetteWithTip,
]

describe('useTipAttachmentStatus', () => {
  let mockGetPipettesWithTipAttached: Mock

  beforeEach(() => {
    mockGetPipettesWithTipAttached = vi.mocked(getPipettesWithTipAttached)
    vi.mocked(getPipetteModelSpecs).mockReturnValue(MOCK_ACTUAL_PIPETTE)
    vi.mocked(DropTipWizard).mockReturnValue(<div>MOCK DROP TIP WIZ</div>)
    mockGetPipettesWithTipAttached.mockResolvedValue(mockPipettesWithTip)
    vi.mocked(useInstrumentsQuery).mockReturnValue({ data: {} } as any)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should return the correct initial state', () => {
    const { result } = renderHook(() => useTipAttachmentStatus({} as any))

    expect(result.current.areTipsAttached).toBe(false)
    expect(result.current.aPipetteWithTip).toEqual(null)
  })

  it('should determine tip status and update state accordingly', async () => {
    const { result } = renderHook(() => useTipAttachmentStatus({} as any))

    await act(async () => {
      await result.current.determineTipStatus()
    })

    expect(result.current.areTipsAttached).toBe(true)
    expect(result.current.aPipetteWithTip).toEqual(mockPipetteWithTip)
  })

  it('should reset tip status', async () => {
    const { result } = renderHook(() => useTipAttachmentStatus({} as any))

    await act(async () => {
      await result.current.determineTipStatus()
      result.current.resetTipStatus()
    })

    expect(result.current.areTipsAttached).toBe(false)
    expect(result.current.aPipetteWithTip).toEqual(null)
  })

  it('should set tip status resolved and update state', async () => {
    const { result } = renderHook(() => useTipAttachmentStatus({} as any))

    await act(async () => {
      await result.current.determineTipStatus()
      result.current.setTipStatusResolved()
    })

    expect(result.current.aPipetteWithTip).toEqual(mockSecondPipetteWithTip)
  })

  it('should call onEmptyCache callback when cache becomes empty', async () => {
    mockGetPipettesWithTipAttached.mockResolvedValueOnce([mockPipetteWithTip])

    const onEmptyCacheMock = vi.fn()
    const { result } = renderHook(() => useTipAttachmentStatus({} as any))

    await act(async () => {
      await result.current.determineTipStatus()
      result.current.setTipStatusResolved(onEmptyCacheMock)
    })

    expect(onEmptyCacheMock).toHaveBeenCalled()
  })
})
