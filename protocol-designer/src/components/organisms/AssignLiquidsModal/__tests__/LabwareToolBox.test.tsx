import { useDispatch } from 'react-redux'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fixture96Plate } from '@opentrons/shared-data'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'

import { LabwareStackToolbox } from '../LabwareToolbox'

import type { Mock } from 'vitest'
import type { ComponentProps } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

const mockNavigate = vi.fn()
const mockDispatch = vi.fn()

vi.mock('/protocol-designer/step-forms/selectors', async importOriginal => {
  const actual = (await importOriginal()) as any
  return {
    ...actual,
    getInitialDeckSetup: vi.fn(),
  }
})

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
    setShowLiquidLayoutOverlay = vi.fn()
    vi.mocked(useDispatch).mockReturnValue(mockDispatch)
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
    }
    vi.clearAllMocks()
  })

  it('select shows an overlay when liquids dont match', () => {
    render(props)
    const labwareButton = screen.getByRole('button', {
      name: '1 ANSI 96 Standard Microplate',
    })
    expect(labwareButton).toBeInTheDocument()
    fireEvent.click(labwareButton, { ctrlKey: true })
    expect(setShowLiquidLayoutOverlay).toHaveBeenCalledWith(true)
  })

  it('selects a single labware when ctrl key is not pressed', () => {
    render(props)
    const labwareButton = screen.getByRole('button', {
      name: '1 ANSI 96 Standard Microplate',
    })
    expect(labwareButton).toBeInTheDocument()
    fireEvent.click(labwareButton)
    expect(props.selectedLabwareIds).toEqual(['mockLabwareId'])
  })

  it('selects multiple labware when ctrl key is pressed with different liquids', () => {
    render(props)
    const labwareButton = screen.getByRole('button', {
      name: '1 ANSI 96 Standard Microplate',
    })
    expect(labwareButton).toBeInTheDocument()
    fireEvent.click(labwareButton, { ctrlKey: true })
    expect(props.selectedLabwareIds).toEqual(['mockLabwareId'])
  })
})

describe('LabwareStackToolboxContainer liquids match', () => {
  let props: ComponentProps<typeof LabwareStackToolbox>
  let setShowLiquidLayoutOverlay: Mock

  beforeEach(() => {
    setShowLiquidLayoutOverlay = vi.fn()
    vi.mocked(useDispatch).mockReturnValue(mockDispatch)
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
        },
        largestStackInSlot: ['mockLabwareId', 'labware2'],
      },
      setShowBadFormState: vi.fn(),
      setDefineLiquidModal: vi.fn(),
      selectedLabwareIds: ['mockLabwareId'],
    }
    vi.clearAllMocks()
  })

  it('select all labware buttons', () => {
    render(props)
    const allLabwareButton = screen.getByRole('button', { name: 'Select all' })
    expect(allLabwareButton).toBeInTheDocument()
    fireEvent.click(allLabwareButton)
    expect(mockDispatch).toBeCalledWith({
      payload: ['mockLabwareId', 'labware2'],
      type: 'OPEN_MULTIPLE_INGREDIENTS_SELECTOR',
    })
  })
})
