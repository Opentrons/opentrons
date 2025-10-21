import { NavigateFunction } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fixture96Plate } from '@opentrons/shared-data'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'

import { LabwareStackToolbox } from '../LabwareToolbox'

import type { ComponentProps } from 'react'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

const mockNavigate = vi.fn()

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

const render = (props: ComponentProps<typeof LabwareStackToolbox>) => {
  return renderWithProviders(<LabwareStackToolbox {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('LabwareStackToolboxContainer', () => {
  let props: ComponentProps<typeof LabwareStackToolbox>

  beforeEach(() => {
    props = {
      showBadFormState: false,
      data: {
        labwareEntities: {
          mockLabwareId: {
            id: 'mockLabwareId',
            labwareDefURI: 'mockLabwareDefURI',
            pythonName: 'mockPythonName',
            def: fixture96Plate as LabwareDefinition2,
          },
        },
        labware: {
          mockLabwareId: {
            stack: ['mockLabwareId', 'labware2'],
            id: 'mockLabwareId',
            labwareDefURI: 'mockLabwareDefURI',
            pythonName: 'mockPythonName',
            def: fixture96Plate as LabwareDefinition2,
          },
          labware2: {
            stack: ['A2'],
            id: 'labware2',
            labwareDefURI: 'labware2DefURI',
            pythonName: 'labware2PythonName',
            def: fixture96Plate as LabwareDefinition2,
          },
        },
        labwareId: 'mockLabwareId',
        allWellContents: {
          mockLabwareId: {
            A1: {
              groupIds: ['mockGroupId'],
            },
          },
        },
      },
      setShowBadFormState: vi.fn(),
      setDefineLiquidModal: vi.fn(),
      selectedLabwareIds: ['mockLabwareId'],
    }
  })

  it('loads the modal with selectable labware', () => {
    props.data.labware.mockLabwareId.stack = ['mockLabwareId', 'labware2']
    props.data.labware.labware2 = {
      def: fixture96Plate as LabwareDefinition2,
    }
    render(props)

    expect(screen.getAllByText('ANSI 96 Standard Microplate').length).toBe(2)
    const firstButton = screen.getByTestId('LabwareButton-1')
    expect(firstButton).toHaveClass('_button_active_386e4e')

    const scondButton = screen.getByTestId('LabwareButton-0')
    fireEvent.click(scondButton)
    expect(scondButton).toHaveClass('_button_active_386e4e')
    // expect(mockDispatch).toHaveBeenCalledWith({
    //   type: 'SELECT_WELLS',
    //   payload: {
    //     A1: null,
    //     A2: null,
    //     A3: null,
    //     A4: null,
    //     A5: null,
    //   },
    // })
  })

  it('select all labware buttons', () => {
    render(props)

    const allLabwareButton = screen.getByRole('button', { name: 'Select all' })
    expect(allLabwareButton).toBeInTheDocument()
    fireEvent.click(allLabwareButton)
    expect(allLabwareButton).toHaveClass('_button_active_386e4e')
  })

  it('select shows an overlay when liquids dont match', () => {
    render(props)
    const labwareButton = screen.getByRole('button', { name: 'Labware2' })
    expect(labwareButton).toBeInTheDocument()
    fireEvent.click(labwareButton)
    expect(labwareButton).toHaveClass('_button_active_386e4e')
  })

  // test that when selecting labware with different liquids shows modal
  // test that different labware does not render the left side of the modal
})
