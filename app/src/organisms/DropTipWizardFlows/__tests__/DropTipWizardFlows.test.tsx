import * as React from 'react'
import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest'
import { screen, renderHook, act } from '@testing-library/react'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { mockPipetteInfo } from '../../../redux/pipettes/__fixtures__'
import {
  useTipAttachmentStatus,
  useDropTipWizardFlows,
  DropTipWizardFlows,
} from '..'
import { getPipettesWithTipAttached } from '../getPipettesWithTipAttached'
import { getPipetteModelSpecs } from '@opentrons/shared-data'
import { DropTipWizard } from '../DropTipWizard'
import { useInstrumentsQuery } from '@opentrons/react-api-client'

import type { Mock } from 'vitest'
import type { PipetteModelSpecs } from '@opentrons/shared-data'
import type { PipetteWithTip } from '..'

vi.mock('@opentrons/shared-data', async importOriginal => {
  const actual = await importOriginal<typeof getPipetteModelSpecs>()
  return {
    ...actual,
    getPipetteModelSpecs: vi.fn(),
  }
})
vi.mock('../DropTipWizard')
vi.mock('../getPipettesWithTipAttached')
vi.mock('../hooks')
vi.mock('@opentrons/react-api-client')

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

describe('useDropTipWizardFlows', () => {
  it('should toggle showDTWiz state', () => {
    const { result } = renderHook(() => useDropTipWizardFlows())

    expect(result.current.showDTWiz).toBe(false)

    act(() => {
      result.current.toggleDTWiz()
    })

    expect(result.current.showDTWiz).toBe(true)
  })
})

const render = (props: React.ComponentProps<typeof DropTipWizardFlows>) => {
  return renderWithProviders(<DropTipWizardFlows {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('DropTipWizardFlows', () => {
  it('should render DropTipWizard', () => {
    render({} as any)

    screen.getByText('MOCK DROP TIP WIZ')
  })
})
