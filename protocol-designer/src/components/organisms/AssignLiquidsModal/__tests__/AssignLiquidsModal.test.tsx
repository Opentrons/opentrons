import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fixture96Plate } from '@opentrons/shared-data'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'

import { AssignLiquidsModal } from '..'

import type { ComponentProps } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

const mockNavigate = vi.fn()
const mockDispatch = vi.fn()

vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux')
  return {
    ...actual,
    useSelector: vi.fn(),
    useDispatch: () => mockDispatch,
  }
})
vi.mock('/protocol-designer/labware-ingred/selectors', async importOriginal => {
  const actual = (await importOriginal()) as any
  return {
    ...actual,
    getSelectedLabwareId: vi.fn(),
  }
})
vi.mock('/protocol-designer/step-forms/selectors', async importOriginal => {
  const actual = (await importOriginal()) as any
  return {
    ...actual,
    getInitialDeckSetup: vi.fn(),
  }
})
vi.mock('../LiquidToolbox', () => ({
  LiquidToolboxContainer: vi.fn(() => <div>mock LiquidToolbox</div>),
}))
vi.mock('../LabwareToolbox', () => ({
  LabwareStackToolboxContainer: vi.fn(() => (
    <div>mock LabwareStackToolbox</div>
  )),
}))

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<NavigateFunction>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const render = (props: ComponentProps<typeof AssignLiquidsModal>) => {
  return renderWithProviders(<AssignLiquidsModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('AssignLiquidsModal', () => {
  let props: ComponentProps<typeof AssignLiquidsModal>

  beforeEach(() => {
    props = {
      showLiquidOverflowMenu: vi.fn(),
      setDefineLiquidModal: vi.fn(),
      assignLiquidsModalData: {
        selectedLabwareIds: [],
        nickNames: {},
        labwareId: 'mockLabwareId',
        selectedWells: {},
        labware: {
          mockLabwareId: {
            stack: ['mockLabwareId'],
            id: 'mockLabwareId',
            labwareDefURI: 'mockUri',
            def: fixture96Plate as LabwareDefinition2,
            pythonName: 'mockPythonName',
          },
        },
        labwareEntities: {
          mockLabwareId: { def: fixture96Plate as LabwareDefinition2 },
        },
        allWellContents: {},
        liquidNamesById: {},
        liquidDisplayColors: {},
        enableStacking: true,
      },
    }
  })

  it('loads the modal without selectable labware', () => {
    render(props)

    expect(screen.queryByText('Top of stack')).not.toBeInTheDocument()
    screen.getByText('mockLabwareId')

    screen.getByText('Click and drag to select wells')
  })

  it('loads the modal with selectable labware', () => {
    props.assignLiquidsModalData.labware.mockLabwareId.stack = [
      'mockLabwareId',
      'labware2',
    ]
    props.assignLiquidsModalData.labware.labware2 = {
      def: fixture96Plate as LabwareDefinition2,
    }
    render(props)

    screen.getByText('mock LabwareStackToolbox')
  })
})
