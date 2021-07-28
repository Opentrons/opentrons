import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { StaticRouter } from 'react-router-dom'
import { LabwareRender, RobotWorkSpace, ModuleViz } from '@opentrons/components'
import fixture_tiprack_300_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components/__utils__'
import { i18n } from '../../../../i18n'
import { LabwareSetup } from '..'
import { LabwareSetupModal } from '../LabwareSetupModal'
import { LabwareInfoOverlay } from '../LabwareInfoOverlay'
import { ModuleTag } from '../ModuleTag'
import {
  inferModuleOrientationFromSlot,
  LabwareDefinition2,
  ModuleModel,
  ModuleRealType,
} from '@opentrons/shared-data'

jest.mock('../LabwareSetupModal')
jest.mock('../ModuleTag')
jest.mock('../LabwareInfoOverlay')
jest.mock('@opentrons/components', () => {
  const actualComponents = jest.requireActual('@opentrons/components')
  return {
    ...actualComponents,
    ModuleViz: jest.fn(() => <div>mock ModuleViz</div>),
    RobotWorkSpace: jest.fn(() => <div>mock RobotWorkSpace</div>),
    LabwareRender: jest.fn(() => <div>mock LabwareRender</div>),
  }
})
jest.mock('@opentrons/shared-data', () => {
  const actualSharedData = jest.requireActual('@opentrons/shared-data')
  return {
    ...actualSharedData,
    inferModuleOrientationFromSlot: jest.fn(),
  }
})

const mockLabwareInfoOverlay = LabwareInfoOverlay as jest.MockedFunction<
  typeof LabwareInfoOverlay
>

const mockModuleTag = ModuleTag as jest.MockedFunction<typeof ModuleTag>

const mockModuleViz = ModuleViz as jest.MockedFunction<typeof ModuleViz>

const mockModuleOrientationFromSlot = inferModuleOrientationFromSlot as jest.MockedFunction<
  typeof inferModuleOrientationFromSlot
>

const mockRobotWorkSpace = RobotWorkSpace as jest.MockedFunction<
  typeof RobotWorkSpace
>

const mockLabwareRender = LabwareRender as jest.MockedFunction<
  typeof LabwareRender
>

const mockLabwareSetupModal = LabwareSetupModal as jest.MockedFunction<
  typeof LabwareSetupModal
>

const deckSlotsById = standardDeckDef.locations.orderedSlots.reduce(
  (acc, deckSlot) => ({ ...acc, [deckSlot.id]: deckSlot }),
  {}
)

const render = (props: React.ComponentProps<typeof LabwareSetup>) => {
  return renderWithProviders(
    <StaticRouter>
      <LabwareSetup {...props} />
    </StaticRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

const STUBBED_ORIENTATION_VALUE = 'left'

const mockMagneticModule = {
  labwareOffset: { x: 5, y: 5, z: 5 },
  moduleId: 'someMagneticModule',
  model: 'magneticModuleV2' as ModuleModel,
  type: 'magneticModuleType' as ModuleRealType,
}

describe('LabwareSetup', () => {
  let props: React.ComponentProps<typeof LabwareSetup>
  beforeEach(() => {
    props = { labwareDefBySlot: {}, modulesBySlot: {} }

    when(mockModuleOrientationFromSlot)
      .calledWith(expect.anything())
      .mockReturnValue(STUBBED_ORIENTATION_VALUE)

    mockLabwareSetupModal.mockImplementation(({ onCloseClick }) => {
      return <div onClick={onCloseClick}>mock labware setup modal</div>
    })

    mockLabwareRender.mockImplementation(({ definition }) => {
      if (definition === fixture_tiprack_300_ul) {
        return (
          <div>mock labware render of {definition.metadata.displayName}</div>
        )
      }
      return <div></div>
    })

    mockLabwareInfoOverlay.mockImplementation(({ definition }) => {
      if (definition === fixture_tiprack_300_ul) {
        return (
          <div>
            mock labware info overlay of {definition.metadata.displayName}
          </div>
        )
      }
      return <div></div>
    })

    mockModuleViz.mockImplementation(({ orientation, moduleType }) => {
      if (
        orientation === STUBBED_ORIENTATION_VALUE &&
        moduleType === 'magneticModuleType'
      ) {
        return <div>mock module viz</div>
      }
      return <div></div>
    })

    mockModuleTag.mockImplementation(({ orientation, module }) => {
      if (
        orientation === STUBBED_ORIENTATION_VALUE &&
        module === mockMagneticModule
      ) {
        return <div>mock module tag</div>
      }
      return <div></div>
    })

    mockRobotWorkSpace.mockImplementation(({ deckDef, children }) => {
      if (children != null && deckDef === (standardDeckDef as any)) {
        return (
          <div>
            {children({
              deckSlotsById,
              getRobotCoordsFromDOMCoords: {} as any,
            })}
          </div>
        )
      }
      return null
    })
  })

  afterEach(() => {
    resetAllWhenMocks()
    jest.restoreAllMocks()
  })

  describe('labware help link', () => {
    it('opens up the labware help modal when clicked', () => {
      const { getByText } = render(props)

      expect(screen.queryByText('mock labware setup modal')).toBeNull()
      const helpLink = getByText('Labware Help')
      fireEvent.click(helpLink)
      getByText('mock labware setup modal')
    })
    it('closes the labware help modal when closed', () => {
      const { getByText } = render(props)

      const helpLink = getByText('Labware Help')
      fireEvent.click(helpLink)
      const mockModal = getByText('mock labware setup modal')
      fireEvent.click(mockModal)
      expect(screen.queryByText('mock labware setup modal')).toBeNull()
    })
  })

  it('should render a deck WITHOUT labware and WITHOUT modules', () => {
    const labwareDefBySlot = {}
    const modulesBySlot = {}

    props = {
      ...props,
      labwareDefBySlot,
      modulesBySlot,
    }

    render(props)
    expect(mockModuleViz).not.toHaveBeenCalled()
    expect(mockModuleTag).not.toHaveBeenCalled()
    expect(mockLabwareRender).not.toHaveBeenCalled()
    expect(mockLabwareInfoOverlay).not.toHaveBeenCalled()
  })
  it('should render a deck WITH labware and WITHOUT modules', () => {
    const labwareDefBySlot = {
      '1': fixture_tiprack_300_ul as LabwareDefinition2,
    }

    const modulesBySlot = {}

    props = {
      ...props,
      labwareDefBySlot,
      modulesBySlot,
    }

    const { getByText } = render(props)
    expect(mockModuleViz).not.toHaveBeenCalled()
    expect(mockModuleTag).not.toHaveBeenCalled()
    getByText('mock labware render of 300ul Tiprack FIXTURE')
    getByText('mock labware info overlay of 300ul Tiprack FIXTURE')
  })
  it('should render a deck WITH labware and WITH modules', () => {
    const labwareDefBySlot = {
      '1': fixture_tiprack_300_ul as LabwareDefinition2,
    }

    const modulesBySlot = {
      '1': mockMagneticModule,
    }

    props = {
      ...props,
      labwareDefBySlot,
      modulesBySlot,
    }

    const { getByText } = render(props)
    getByText('mock module viz')
    getByText('mock module tag')
    getByText('mock labware render of 300ul Tiprack FIXTURE')
    getByText('mock labware info overlay of 300ul Tiprack FIXTURE')
  })
  it('should render the labware position check text', () => {
    const { getByText } = render(props)

    getByText(
      'Labware Position Check is an optional workflow that guides you through checking the position of each labware on the deck. During this check, you can make an offset adjustment to the overall position of the labware.'
    )
  })
})
