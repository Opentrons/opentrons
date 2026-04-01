import { useDispatch } from 'react-redux'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fixture96Plate } from '@opentrons/shared-data'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'
import { useKitchen } from '/protocol-designer/components/organisms/Kitchen/useKitchen'
import { getLabwareDefsByURI } from '/protocol-designer/labware-defs/selectors'
import { getInitialDeckSetup } from '/protocol-designer/step-forms/selectors'

import { LabwareStackToolbox } from '../LabwareToolbox'

import type { Mock } from 'vitest'
import type { ComponentProps } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { AllTemporalPropertiesForTimelineFrame } from '/protocol-designer/step-forms'

const mockNavigate = vi.fn()
const mockDispatch = vi.fn()
const mockMakeSnackbar = vi.fn()

vi.mock('/protocol-designer/step-forms/selectors')
vi.mock('/protocol-designer/labware-defs/selectors')
vi.mock('/protocol-designer/components/organisms/Kitchen/useKitchen')

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<NavigateFunction>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux')
  return {
    ...actual,
    useDispatch: vi.fn(),
  }
})

const render = (props: ComponentProps<typeof LabwareStackToolbox>) => {
  return renderWithProviders(<LabwareStackToolbox {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('LabwareStackToolboxContainer liquids dont match', () => {
  let props: ComponentProps<typeof LabwareStackToolbox>
  let setShowLiquidLayoutOverlay: Mock

  beforeEach(() => {
    vi.clearAllMocks()
    setShowLiquidLayoutOverlay = vi.fn()
    vi.mocked(useDispatch).mockReturnValue(mockDispatch)
    vi.mocked(useKitchen).mockReturnValue({
      makeSnackbar: mockMakeSnackbar,
      eatToast: vi.fn(),
      bakeToast: vi.fn(),
    })
    vi.mocked(getLabwareDefsByURI).mockReturnValue({
      mockLabwareDefURI: fixture96Plate as LabwareDefinition2,
      labwareDefURI: fixture96Plate as LabwareDefinition2,
    })
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      modules: {},
      labware: {},
      pipettes: {},
      additionalEquipmentOnDeck: {},
    } as AllTemporalPropertiesForTimelineFrame)
    props = {
      showBadFormState: false,
      setShowLiquidLayoutOverlay: setShowLiquidLayoutOverlay,
      data: {
        labware: {
          mockLabwareId: {
            stack: ['mockLabwareId', 'labware2', 'A2'],
            id: 'mockLabwareId',
            labwareDefURI: 'mockLabwareDefURI',
            pythonName: 'mockPythonName',
            def: fixture96Plate as LabwareDefinition2,
          },
          labware2: {
            stack: ['labware2', 'A2'],
            id: 'labware2',
            labwareDefURI: 'labwareDefURI',
            pythonName: 'labware2PythonName',
            def: fixture96Plate as LabwareDefinition2,
          },
        },
        labwareId: 'mockLabwareId',
        liquidLocations: {
          mockLabwareId: {
            A1: {
              mockGroupId: {
                volume: 5,
              },
            },
          },
        },
        largestStackInSlot: ['mockLabwareId', 'labware2'],
      },
      setShowBadFormState: vi.fn(),
      setDefineLiquidModal: vi.fn(),
      selectedLabwareIds: ['mockLabwareId'],
      slot: 'A2',
    }
  })

  it('select shows an overlay when liquids dont match', () => {
    render(props)
    // Click on labware2 (which has no liquids) with ctrl key - should show overlay
    const labwareButton = screen.getByRole('button', {
      name: '2 ANSI 96 Standard Microplate',
    })
    expect(labwareButton).toBeInTheDocument()
    fireEvent.click(labwareButton, { ctrlKey: true })
    expect(setShowLiquidLayoutOverlay).toHaveBeenCalledWith(true)
  })

  it('selects a single labware when ctrl key is not pressed', () => {
    render(props)
    const labwareButton = screen.getByRole('button', {
      name: '3 ANSI 96 Standard Microplate',
    })
    expect(labwareButton).toBeInTheDocument()
    fireEvent.click(labwareButton)
    expect(mockDispatch).toHaveBeenCalledWith({
      payload: ['mockLabwareId'],
      type: 'OPEN_MULTIPLE_INGREDIENTS_SELECTOR',
    })
  })

  it('selects multiple labware when ctrl key is pressed with different liquids', () => {
    render(props)
    // Click on labware2 (which has different liquids) with ctrl key - should show overlay
    const labwareButton = screen.getByRole('button', {
      name: '2 ANSI 96 Standard Microplate',
    })
    expect(labwareButton).toBeInTheDocument()
    fireEvent.click(labwareButton, { ctrlKey: true })
    expect(setShowLiquidLayoutOverlay).toHaveBeenCalledWith(true)
  })
})

describe('LabwareStackToolboxContainer liquids match', () => {
  let props: ComponentProps<typeof LabwareStackToolbox>
  let setShowLiquidLayoutOverlay: Mock

  beforeEach(() => {
    vi.clearAllMocks()
    setShowLiquidLayoutOverlay = vi.fn()
    vi.mocked(useDispatch).mockReturnValue(mockDispatch)
    vi.mocked(useKitchen).mockReturnValue({
      makeSnackbar: mockMakeSnackbar,
      eatToast: vi.fn(),
      bakeToast: vi.fn(),
    })
    vi.mocked(getLabwareDefsByURI).mockReturnValue({
      mockLabwareDefURI: fixture96Plate as LabwareDefinition2,
      labwareDefURI: fixture96Plate as LabwareDefinition2,
    })
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      modules: {},
      labware: {},
      pipettes: {},
      additionalEquipmentOnDeck: {},
    } as AllTemporalPropertiesForTimelineFrame)
    props = {
      showBadFormState: false,
      setShowLiquidLayoutOverlay: setShowLiquidLayoutOverlay,
      data: {
        labware: {
          mockLabwareId: {
            stack: ['mockLabwareId', 'labware2', 'A2'],
            id: 'mockLabwareId',
            labwareDefURI: 'mockLabwareDefURI',
            pythonName: 'mockPythonName',
            def: fixture96Plate as LabwareDefinition2,
          },
          labware2: {
            stack: ['labware2', 'A2'],
            id: 'labware2',
            labwareDefURI: 'labwareDefURI',
            pythonName: 'labware2PythonName',
            def: fixture96Plate as LabwareDefinition2,
          },
        },
        labwareId: 'mockLabwareId',
        liquidLocations: {
          mockLabwareId: {
            A1: {
              mockGroupId: {
                volume: 5,
              },
            },
          },
          labware2: {
            A1: {
              mockGroupId: {
                volume: 5,
              },
            },
          },
          A2: {
            A1: {
              mockGroupId: {
                volume: 5,
              },
            },
          },
        },
        largestStackInSlot: ['mockLabwareId', 'labware2'],
      },
      setShowBadFormState: vi.fn(),
      setDefineLiquidModal: vi.fn(),
      selectedLabwareIds: ['mockLabwareId'],
      slot: 'A2',
    }
  })

  it('select all labware buttons', () => {
    render(props)
    const allLabwareButton = screen.getByRole('button', { name: 'Select all' })
    expect(allLabwareButton).toBeInTheDocument()
    fireEvent.click(allLabwareButton)
    expect(mockDispatch).toBeCalledWith({
      payload: ['mockLabwareId', 'labware2', 'A2'],
      type: 'OPEN_MULTIPLE_INGREDIENTS_SELECTOR',
    })
  })
})
