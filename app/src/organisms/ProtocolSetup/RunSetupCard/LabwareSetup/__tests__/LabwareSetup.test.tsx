import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { StaticRouter } from 'react-router-dom'
import { LabwareRender, RobotWorkSpace, ModuleViz } from '@opentrons/components'
import {
  inferModuleOrientationFromXCoordinate,
  LabwareDefinition2,
  ModuleModel,
  ModuleRealType,
} from '@opentrons/shared-data'
import fixture_tiprack_300_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'
import { fireEvent, screen } from '@testing-library/react'
import {
  renderWithProviders,
  componentPropsMatcher,
  partialComponentPropsMatcher,
} from '@opentrons/components/__utils__'
import { i18n } from '../../../../../i18n'
import { LabwareSetup } from '..'
import { LabwareSetupModal } from '../LabwareSetupModal'
import { LabwareInfoOverlay } from '../LabwareInfoOverlay'
import { ExtraAttentionWarning } from '../ExtraAttentionWarning'
import { getModuleTypesThatRequireExtraAttention } from '../utils/getModuleTypesThatRequireExtraAttention'
import { getProtocolPipetteTipRackCalInfo } from '../../../../../redux/pipettes/selectors'
import { ModuleTag } from '../../../ModuleTag'
import * as useAttachedModulesEqualsProtocolModules from '../../useAttachedModulesEqualsProtocolModules'

jest.mock('../../../../../redux/modules')
jest.mock('../../../../../redux/pipettes/selectors')
jest.mock('../LabwareSetupModal')
jest.mock('../../../ModuleTag')
jest.mock('../LabwareInfoOverlay')
jest.mock('../ExtraAttentionWarning')
jest.mock('../../useAttachedModulesEqualsProtocolModules')
jest.mock('../utils/getModuleTypesThatRequireExtraAttention')
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
    inferModuleOrientationFromXCoordinate: jest.fn(),
  }
})
const mockUseAttachedModulesEqualsProtocolModules = useAttachedModulesEqualsProtocolModules.useAttachedModulesEqualsProtocolModules as jest.MockedFunction<
  typeof useAttachedModulesEqualsProtocolModules.useAttachedModulesEqualsProtocolModules
>

const mockLabwareInfoOverlay = LabwareInfoOverlay as jest.MockedFunction<
  typeof LabwareInfoOverlay
>

const mockModuleTag = ModuleTag as jest.MockedFunction<typeof ModuleTag>

const mockModuleViz = ModuleViz as jest.MockedFunction<typeof ModuleViz>

const mockInferModuleOrientationFromXCoordinate = inferModuleOrientationFromXCoordinate as jest.MockedFunction<
  typeof inferModuleOrientationFromXCoordinate
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

const mockGetModuleTypesThatRequireExtraAttention = getModuleTypesThatRequireExtraAttention as jest.MockedFunction<
  typeof getModuleTypesThatRequireExtraAttention
>

const mockExtraAttentionWarning = ExtraAttentionWarning as jest.MockedFunction<
  typeof ExtraAttentionWarning
>

const mockGetProtocolPipetteTipRackCalInfo = getProtocolPipetteTipRackCalInfo as jest.MockedFunction<
  typeof getProtocolPipetteTipRackCalInfo
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
const MOCK_300_UL_TIPRACK_ID = '300_ul_tiprack_id'
const MOCK_MAGNETIC_MODULE_COORDS = [10, 20, 0]
const MOCK_TC_COORDS = [20, 30, 0]
const MOCK_300_UL_TIPRACK_COORDS = [30, 40, 0]
const MOCK_ROBOT_NAME = 'ot-dev'

const mockMagneticModule = {
  labwareOffset: { x: 5, y: 5, z: 5 },
  moduleId: 'someMagneticModule',
  model: 'magneticModuleV2' as ModuleModel,
  type: 'magneticModuleType' as ModuleRealType,
}

const mockTCModule = {
  labwareOffset: { x: 3, y: 3, z: 3 },
  moduleId: 'TCModuleId',
  model: 'thermocyclerModuleV1' as ModuleModel,
  type: 'thermocyclerModuleType' as ModuleRealType,
}

describe('LabwareSetup', () => {
  let props: React.ComponentProps<typeof LabwareSetup>
  beforeEach(() => {
    props = {
      robotName: MOCK_ROBOT_NAME,
      moduleRenderCoords: {},
      labwareRenderCoords: {},
    }
    mockUseAttachedModulesEqualsProtocolModules.mockReturnValue({
      allModulesAttached: false,
    })

    when(mockInferModuleOrientationFromXCoordinate)
      .calledWith(expect.anything())
      .mockReturnValue(STUBBED_ORIENTATION_VALUE)

    when(mockGetModuleTypesThatRequireExtraAttention)
      .calledWith(expect.anything())
      .mockReturnValue([])

    when(mockLabwareSetupModal)
      .calledWith(
        componentPropsMatcher({
          onCloseClick: expect.anything(),
        })
      )
      .mockImplementation(({ onCloseClick }) => (
        <div onClick={onCloseClick}>mock labware setup modal</div>
      ))

    when(mockLabwareRender)
      .mockReturnValue(<div></div>) // this (default) empty div will be returned when LabwareRender isn't called with expected labware definition
      .calledWith(
        componentPropsMatcher({
          definition: fixture_tiprack_300_ul,
        })
      )
      .mockReturnValue(
        <div>
          mock labware render of {fixture_tiprack_300_ul.metadata.displayName}
        </div>
      )

    when(mockLabwareInfoOverlay)
      .mockReturnValue(<div></div>) // this (default) empty div will be returned when LabwareInfoOverlay isn't called with expected props
      .calledWith(
        componentPropsMatcher({
          definition: fixture_tiprack_300_ul,
          x: MOCK_300_UL_TIPRACK_COORDS[0],
          y: MOCK_300_UL_TIPRACK_COORDS[1],
        })
      )
      .mockReturnValue(
        <div>
          mock labware info overlay of{' '}
          {fixture_tiprack_300_ul.metadata.displayName}
        </div>
      )

    when(mockRobotWorkSpace)
      .mockReturnValue(<div></div>) // this (default) empty div will be returned when RobotWorkSpace isn't called with expected props
      .calledWith(
        partialComponentPropsMatcher({
          deckDef: standardDeckDef,
          children: expect.anything(),
        })
      )
      .mockImplementation(({ children }) => (
        <svg>
          {/* @ts-expect-error children won't be null since we checked for expect.anything() above */}
          {children({
            deckSlotsById,
            getRobotCoordsFromDOMCoords: {} as any,
          })}
        </svg>
      ))

    when(mockGetProtocolPipetteTipRackCalInfo)
      .calledWith(undefined as any, MOCK_ROBOT_NAME)
      .mockReturnValue({
        left: {
          exactPipetteMatch: 'compatible',
          pipetteCalDate: 'abcde',
          pipetteDisplayName: 'Left Pipette',
          tipRacks: [
            {
              displayName: 'Mock TipRack Definition',
              lastModifiedDate: null,
            },
          ],
        },
        right: null,
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
    const moduleRenderCoords = {}
    const labwareRenderCoords = {}

    props = {
      ...props,
      moduleRenderCoords,
      labwareRenderCoords,
    }

    render(props)
    expect(mockModuleViz).not.toHaveBeenCalled()
    expect(mockModuleTag).not.toHaveBeenCalled()
    expect(mockLabwareRender).not.toHaveBeenCalled()
    expect(mockLabwareInfoOverlay).not.toHaveBeenCalled()
  })
  it('should render a deck WITHOUT labware and WITHOUT modules and CTA disabled', () => {
    const moduleRenderCoords = {}
    const labwareRenderCoords = {}

    when(mockGetProtocolPipetteTipRackCalInfo)
      .calledWith(undefined as any, MOCK_ROBOT_NAME)
      .mockReturnValue({
        left: null,
        right: null,
      })

    props = {
      ...props,
      moduleRenderCoords,
      labwareRenderCoords,
    }

    render(props)
    expect(mockModuleViz).not.toHaveBeenCalled()
    expect(mockModuleTag).not.toHaveBeenCalled()
    expect(mockLabwareRender).not.toHaveBeenCalled()
    expect(mockLabwareInfoOverlay).not.toHaveBeenCalled()
  })
  it('should render a deck WITH labware and WITHOUT modules with CTA enabled', () => {
    const labwareRenderCoords = {
      '300_ul_tiprack_id': {
        labwareDef: fixture_tiprack_300_ul as LabwareDefinition2,
        x: MOCK_300_UL_TIPRACK_COORDS[0],
        y: MOCK_300_UL_TIPRACK_COORDS[1],
        z: MOCK_300_UL_TIPRACK_COORDS[2],
      },
    }

    const moduleRenderCoords = {}

    props = {
      ...props,
      labwareRenderCoords,
      moduleRenderCoords,
    }

    const { getByText } = render(props)
    expect(mockModuleViz).not.toHaveBeenCalled()
    expect(mockModuleTag).not.toHaveBeenCalled()
    getByText('mock labware render of 300ul Tiprack FIXTURE')
    getByText('mock labware info overlay of 300ul Tiprack FIXTURE')
  })
  it('should render a deck WITH labware and WITH modules with CTA enabled', () => {
    const labwareRenderCoords = {
      [MOCK_300_UL_TIPRACK_ID]: {
        labwareDef: fixture_tiprack_300_ul as LabwareDefinition2,
        x: MOCK_300_UL_TIPRACK_COORDS[0],
        y: MOCK_300_UL_TIPRACK_COORDS[1],
        z: MOCK_300_UL_TIPRACK_COORDS[2],
      },
    }

    const moduleRenderCoords = {
      [mockMagneticModule.moduleId]: {
        x: MOCK_MAGNETIC_MODULE_COORDS[0],
        y: MOCK_MAGNETIC_MODULE_COORDS[1],
        z: MOCK_MAGNETIC_MODULE_COORDS[2],
        moduleModel: mockMagneticModule.model,
      },
      [mockTCModule.moduleId]: {
        x: MOCK_TC_COORDS[0],
        y: MOCK_TC_COORDS[1],
        z: MOCK_TC_COORDS[2],
        moduleModel: mockTCModule.model,
      },
    }
    mockUseAttachedModulesEqualsProtocolModules.mockReturnValue({
      allModulesAttached: true,
    })

    when(mockModuleViz)
      .calledWith(
        componentPropsMatcher({
          orientation: STUBBED_ORIENTATION_VALUE,
          moduleType: mockMagneticModule.type,
          x: MOCK_MAGNETIC_MODULE_COORDS[0],
          y: MOCK_MAGNETIC_MODULE_COORDS[1],
        })
      )
      .mockReturnValue(<div>mock module viz {mockMagneticModule.type} </div>)

    when(mockModuleViz)
      .calledWith(
        componentPropsMatcher({
          orientation: STUBBED_ORIENTATION_VALUE,
          moduleType: mockTCModule.type,
          x: MOCK_TC_COORDS[0],
          y: MOCK_TC_COORDS[1],
        })
      )
      .mockReturnValue(<div>mock module viz {mockTCModule.type} </div>)

    when(mockModuleTag)
      .calledWith(
        componentPropsMatcher({
          orientation: STUBBED_ORIENTATION_VALUE,
          moduleModel: mockMagneticModule.model,
          x: MOCK_MAGNETIC_MODULE_COORDS[0],
          y: MOCK_MAGNETIC_MODULE_COORDS[1],
        })
      )
      .mockReturnValue(<div>mock module tag {mockMagneticModule.model} </div>)

    when(mockModuleTag)
      .calledWith(
        componentPropsMatcher({
          orientation: STUBBED_ORIENTATION_VALUE,
          moduleModel: mockTCModule.model,
          x: MOCK_TC_COORDS[0],
          y: MOCK_TC_COORDS[1],
        })
      )
      .mockReturnValue(<div>mock module tag {mockTCModule.model} </div>)

    props = {
      ...props,
      labwareRenderCoords,
      moduleRenderCoords,
    }

    const { getByText } = render(props)
    getByText('mock module viz magneticModuleType')
    getByText('mock module viz thermocyclerModuleType')
    getByText('mock module tag magneticModuleV2')
    getByText('mock labware render of 300ul Tiprack FIXTURE')
    getByText('mock labware info overlay of 300ul Tiprack FIXTURE')
  })
  it('should render the labware position check text', () => {
    const { getByText } = render(props)
    getByText(
      'Labware Position Check is an optional workflow that guides you through checking the position of each labware on the deck. During this check, you can make an offset adjustment to the overall position of the labware.'
    )
  })
  it('should render the extra attention warning when there are modules/labware that need extra attention', () => {
    when(mockGetModuleTypesThatRequireExtraAttention)
      .calledWith([])
      .mockReturnValue(['magneticModuleType', 'thermocyclerModuleType'])

    when(mockExtraAttentionWarning)
      .calledWith(
        componentPropsMatcher({
          moduleTypes: ['magneticModuleType', 'thermocyclerModuleType'],
        })
      )
      .mockReturnValue(
        <div>mock extra attention warning with magnetic module and TC</div>
      )

    const { getByText } = render(props)
    getByText('mock extra attention warning with magnetic module and TC')
  })
})
