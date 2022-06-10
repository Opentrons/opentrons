import * as React from 'react'
import '@testing-library/jest-dom'
import { when, resetAllWhenMocks } from 'jest-when'
import { StaticRouter } from 'react-router-dom'

import {
  renderWithProviders,
  partialComponentPropsMatcher,
  componentPropsMatcher,
  RobotWorkSpace,
} from '@opentrons/components'
import {
  inferModuleOrientationFromXCoordinate,
  ModuleModel,
  ModuleType,
} from '@opentrons/shared-data'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/3/ot2_standard.json'

import { i18n } from '../../../../i18n'
import { HeaterShakerBanner } from '../../../../organisms/ProtocolSetup/RunSetupCard/ModuleSetup/HeaterShakerSetupWizard/HeaterShakerBanner'
import { ModuleInfo } from '../../../../organisms/ProtocolSetup/RunSetupCard/ModuleSetup/ModuleInfo'
import { UnMatchedModuleWarning } from '../../../../organisms/ProtocolSetup/RunSetupCard/ModuleSetup/UnMatchedModuleWarning'
import { MultipleModulesModal } from '../../../../organisms/ProtocolSetup/RunSetupCard/ModuleSetup/MultipleModulesModal'
import {
  mockThermocycler as mockThermocyclerFixture,
  mockMagneticModule as mockMagneticModuleFixture,
  mockTemperatureModule,
} from '../../../../redux/modules/__fixtures__/index'
import {
  useModuleRenderInfoForProtocolById,
  useRunHasStarted,
  useUnmatchedModulesForProtocol,
} from '../../hooks'
import { SetupModules } from '../SetupModules'

jest.mock('@opentrons/components', () => {
  const actualComponents = jest.requireActual('@opentrons/components')
  return {
    ...actualComponents,
    RobotWorkSpace: jest.fn(() => <div>mock RobotWorkSpace</div>),
  }
})
jest.mock('@opentrons/shared-data', () => {
  const actualSharedData = jest.requireActual('@opentrons/shared-data')
  return {
    ...actualSharedData,
    inferModuleOrientationFromXCoordinate: jest.fn(),
  }
})
jest.mock(
  '../../../../organisms/ProtocolSetup/RunSetupCard/ModuleSetup/HeaterShakerSetupWizard/HeaterShakerBanner'
)
jest.mock(
  '../../../../organisms/ProtocolSetup/RunSetupCard/ModuleSetup/ModuleInfo'
)
jest.mock(
  '../../../../organisms/ProtocolSetup/RunSetupCard/ModuleSetup/UnMatchedModuleWarning'
)
jest.mock(
  '../../../../organisms/ProtocolSetup/RunSetupCard/ModuleSetup/MultipleModulesModal'
)
jest.mock('../../hooks')

const mockMultipleModulesModal = MultipleModulesModal as jest.MockedFunction<
  typeof MultipleModulesModal
>
const mockUseModuleRenderInfoForProtocolById = useModuleRenderInfoForProtocolById as jest.MockedFunction<
  typeof useModuleRenderInfoForProtocolById
>
const mockUseRunHasStarted = useRunHasStarted as jest.MockedFunction<
  typeof useRunHasStarted
>
const mockUseUnmatchedModulesForProtocol = useUnmatchedModulesForProtocol as jest.MockedFunction<
  typeof useUnmatchedModulesForProtocol
>
const mockModuleInfo = ModuleInfo as jest.MockedFunction<typeof ModuleInfo>
const mockInferModuleOrientationFromXCoordinate = inferModuleOrientationFromXCoordinate as jest.MockedFunction<
  typeof inferModuleOrientationFromXCoordinate
>
const mockRobotWorkSpace = RobotWorkSpace as jest.MockedFunction<
  typeof RobotWorkSpace
>
const mockUnMatchedModuleWarning = UnMatchedModuleWarning as jest.MockedFunction<
  typeof UnMatchedModuleWarning
>
const mockHeaterShakerBanner = HeaterShakerBanner as jest.MockedFunction<
  typeof HeaterShakerBanner
>

const deckSlotsById = standardDeckDef.locations.orderedSlots.reduce(
  (acc, deckSlot) => ({ ...acc, [deckSlot.id]: deckSlot }),
  {}
)

const render = (props: React.ComponentProps<typeof SetupModules>) => {
  return renderWithProviders(
    <StaticRouter>
      <SetupModules {...props} />
    </StaticRouter>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

const STUBBED_ORIENTATION_VALUE = 'left'
const MOCK_MAGNETIC_MODULE_COORDS = [10, 20, 0]
const MOCK_SECOND_MAGNETIC_MODULE_COORDS = [100, 200, 0]
const MOCK_TC_COORDS = [20, 30, 0]
const MOCK_ROBOT_NAME = 'otie'
const MOCK_RUN_ID = '1'

const mockMagneticModule = {
  moduleId: 'someMagneticModule',
  model: 'magneticModuleV2' as ModuleModel,
  type: 'magneticModuleType' as ModuleType,
  labwareOffset: { x: 5, y: 5, z: 5 },
  cornerOffsetFromSlot: { x: 1, y: 1, z: 1 },
  dimensions: {
    xDimension: 100,
    yDimension: 100,
    footprintXDimension: 50,
    footprintYDimension: 50,
    labwareInterfaceXDimension: 80,
    labwareInterfaceYDimension: 120,
  },
  twoDimensionalRendering: { children: [] },
}

const mockTCModule = {
  moduleId: 'TCModuleId',
  model: 'thermocyclerModuleV1' as ModuleModel,
  type: 'thermocyclerModuleType' as ModuleType,
  labwareOffset: { x: 3, y: 3, z: 3 },
  cornerOffsetFromSlot: { x: 1, y: 1, z: 1 },
  dimensions: {
    xDimension: 100,
    yDimension: 100,
    footprintXDimension: 50,
    footprintYDimension: 50,
    labwareInterfaceXDimension: 80,
    labwareInterfaceYDimension: 120,
  },
  twoDimensionalRendering: { children: [] },
}

describe('SetupModules', () => {
  let props: React.ComponentProps<typeof SetupModules>
  beforeEach(() => {
    props = {
      robotName: MOCK_ROBOT_NAME,
      runId: MOCK_RUN_ID,
      expandLabwareSetupStep: () => {},
    }

    when(mockInferModuleOrientationFromXCoordinate)
      .calledWith(expect.anything())
      .mockReturnValue(STUBBED_ORIENTATION_VALUE)

    when(mockUnMatchedModuleWarning)
      .calledWith(
        componentPropsMatcher({
          isAnyModuleUnnecessary: false,
        })
      )
      .mockReturnValue(<div></div>)

    when(mockRobotWorkSpace)
      .mockReturnValue(<div></div>) // this (default) empty div will be returned when RobotWorkSpace isn't called with expected props
      .calledWith(
        partialComponentPropsMatcher({
          deckDef: standardDeckDef,
          children: expect.anything(),
        })
      )
      .mockImplementation(({ children }) => (
        <div>
          {/* @ts-expect-error children won't be null since we checked for expect.anything() above */}
          {children({
            deckSlotsById,
            getRobotCoordsFromDOMCoords: {} as any,
          })}
        </div>
      ))

    when(mockHeaterShakerBanner).mockReturnValue(
      <div>mock Heater Shaker Banner</div>
    )
    when(mockUseRunHasStarted).calledWith(MOCK_RUN_ID).mockReturnValue(false)
  })

  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should render a deck WITHOUT modules if none passed (component will never be rendered in this circumstance)', () => {
    when(mockUseModuleRenderInfoForProtocolById)
      .calledWith(MOCK_ROBOT_NAME, MOCK_RUN_ID)
      .mockReturnValue({})

    when(mockUseUnmatchedModulesForProtocol)
      .calledWith(MOCK_ROBOT_NAME, MOCK_RUN_ID)
      .mockReturnValue({
        missingModuleIds: [],
        remainingAttachedModules: [],
      })

    render(props)
    expect(mockModuleInfo).not.toHaveBeenCalled()
  })
  it('should render a deck WITH MoaM along with the MoaM link', () => {
    when(mockMultipleModulesModal)
      .calledWith(
        componentPropsMatcher({
          onCloseClick: expect.anything(),
        })
      )
      .mockImplementation(({ onCloseClick }) => (
        <div onClick={onCloseClick}>mock Moam modal</div>
      ))
    when(mockUseModuleRenderInfoForProtocolById)
      .calledWith(MOCK_ROBOT_NAME, MOCK_RUN_ID)
      .mockReturnValue({
        [mockMagneticModule.moduleId]: {
          moduleId: mockMagneticModule.moduleId,
          x: MOCK_MAGNETIC_MODULE_COORDS[0],
          y: MOCK_MAGNETIC_MODULE_COORDS[1],
          z: MOCK_MAGNETIC_MODULE_COORDS[2],
          moduleDef: mockMagneticModule as any,
          nestedLabwareDef: null,
          nestedLabwareId: null,
          protocolLoadOrder: 1,
          attachedModuleMatch: null,
        },
        [mockMagneticModule.moduleId]: {
          moduleId: mockMagneticModule.moduleId,
          x: MOCK_MAGNETIC_MODULE_COORDS[0],
          y: MOCK_MAGNETIC_MODULE_COORDS[1],
          z: MOCK_MAGNETIC_MODULE_COORDS[2],
          moduleDef: mockMagneticModule as any,
          nestedLabwareDef: null,
          nestedLabwareId: null,
          protocolLoadOrder: 0,
          attachedModuleMatch: null,
        },
      } as any)

    when(mockUseUnmatchedModulesForProtocol)
      .calledWith(MOCK_ROBOT_NAME, MOCK_RUN_ID)
      .mockReturnValue({
        missingModuleIds: [],
        remainingAttachedModules: [],
      })

    when(mockModuleInfo)
      .calledWith(
        partialComponentPropsMatcher({
          moduleModel: mockMagneticModule.model,
          isAttached: false,
          usbPort: null,
          hubPort: null,
          runId: MOCK_RUN_ID,
        })
      )
      .mockReturnValue(<div>mock module info {mockMagneticModule.model}</div>)

    const { getByText, queryByText } = render(props)
    getByText('mock module info magneticModuleV2')
    expect(queryByText('mock Moam modal')).toBeNull()
  })
  it('should render a deck WITH modules with CTA disabled if the protocol requests modules and they are not all attached to the robot', () => {
    when(mockUseModuleRenderInfoForProtocolById)
      .calledWith(MOCK_ROBOT_NAME, MOCK_RUN_ID)
      .mockReturnValue({
        [mockMagneticModule.moduleId]: {
          moduleId: mockMagneticModule.moduleId,
          x: MOCK_MAGNETIC_MODULE_COORDS[0],
          y: MOCK_MAGNETIC_MODULE_COORDS[1],
          z: MOCK_MAGNETIC_MODULE_COORDS[2],
          moduleDef: mockMagneticModule as any,
          nestedLabwareDef: null,
          nestedLabwareId: null,
          protocolLoadOrder: 0,
          attachedModuleMatch: null,
        },
        [mockTCModule.moduleId]: {
          moduleId: mockTCModule.moduleId,
          x: MOCK_TC_COORDS[0],
          y: MOCK_TC_COORDS[1],
          z: MOCK_TC_COORDS[2],
          moduleDef: mockTCModule,
          nestedLabwareDef: null,
          nestedLabwareId: null,
          protocolLoadOrder: 1,
          attachedModuleMatch: null,
        },
      } as any)

    when(mockModuleInfo)
      .calledWith(
        partialComponentPropsMatcher({
          moduleModel: mockMagneticModule.model,
          isAttached: false,
          usbPort: null,
          hubPort: null,
          runId: MOCK_RUN_ID,
        })
      )
      .mockReturnValue(<div>mock module info {mockMagneticModule.model}</div>)

    when(mockModuleInfo)
      .calledWith(
        partialComponentPropsMatcher({
          moduleModel: mockTCModule.model,
          isAttached: false,
          usbPort: null,
          hubPort: null,
          runId: MOCK_RUN_ID,
        })
      )
      .mockReturnValue(<div>mock module info {mockTCModule.model} </div>)

    when(mockUnMatchedModuleWarning)
      .calledWith(
        componentPropsMatcher({
          isAnyModuleUnnecessary: true,
        })
      )
      .mockReturnValue(<div>mock modules mismatch</div>)

    when(mockUseUnmatchedModulesForProtocol)
      .calledWith(MOCK_ROBOT_NAME, MOCK_RUN_ID)
      .mockReturnValue({
        missingModuleIds: ['foo'],
        remainingAttachedModules: [mockTemperatureModule],
      })

    const { getByText, getByRole } = render(props)
    getByText('mock module info magneticModuleV2')
    const button = getByRole('button', { name: 'Proceed to labware setup' })
    expect(button).toHaveAttribute('disabled')
  })

  it('should render a deck WITH modules with CTA enabled if all protocol requested modules have a matching attached module', () => {
    when(mockUseUnmatchedModulesForProtocol)
      .calledWith(MOCK_ROBOT_NAME, MOCK_RUN_ID)
      .mockReturnValue({
        missingModuleIds: [],
        remainingAttachedModules: [],
      })

    when(mockUseModuleRenderInfoForProtocolById)
      .calledWith(MOCK_ROBOT_NAME, MOCK_RUN_ID)
      .mockReturnValue({
        [mockMagneticModule.moduleId]: {
          moduleId: mockMagneticModule.moduleId,
          x: MOCK_MAGNETIC_MODULE_COORDS[0],
          y: MOCK_MAGNETIC_MODULE_COORDS[1],
          z: MOCK_MAGNETIC_MODULE_COORDS[2],
          moduleDef: mockMagneticModule as any,
          nestedLabwareDef: null,
          nestedLabwareId: null,
          nestedLabwareDisplayName: null,
          protocolLoadOrder: 1,
          attachedModuleMatch: {
            ...mockMagneticModuleFixture,
            model: mockMagneticModule.model,
          } as any,
          slotName: '1',
        },
        [mockTCModule.moduleId]: {
          moduleId: mockTCModule.moduleId,
          x: MOCK_TC_COORDS[0],
          y: MOCK_TC_COORDS[1],
          z: MOCK_TC_COORDS[2],
          moduleDef: mockTCModule,
          nestedLabwareDef: null,
          nestedLabwareId: null,
          nestedLabwareDisplayName: null,
          protocolLoadOrder: 0,
          attachedModuleMatch: {
            ...mockThermocyclerFixture,
            model: mockTCModule.model,
          } as any,
          slotName: '7',
        },
      })

    when(mockModuleInfo)
      .calledWith(
        componentPropsMatcher({
          moduleModel: mockMagneticModule.model,
          isAttached: true,
          usbPort: mockMagneticModuleFixture.usbPort.port,
          hubPort: mockMagneticModuleFixture.usbPort.hub,
          runId: MOCK_RUN_ID,
        })
      )
      .mockReturnValue(<div>mock module info {mockMagneticModule.model} </div>)

    when(mockModuleInfo)
      .calledWith(
        componentPropsMatcher({
          moduleModel: mockTCModule.model,
          isAttached: true,
          usbPort: mockThermocyclerFixture.usbPort.port,
          hubPort: mockThermocyclerFixture.usbPort.hub,
          runId: MOCK_RUN_ID,
        })
      )
      .mockReturnValue(<div>mock module info {mockTCModule.model} </div>)

    const { getByText, getByRole } = render(props)
    getByText('mock module info magneticModuleV2')
    const button = getByRole('button', { name: 'Proceed to labware setup' })
    expect(button).not.toBeDisabled()
  })

  it('should render a deck WITH modules with CTA disabled if run has started', () => {
    when(mockUseRunHasStarted).calledWith(MOCK_RUN_ID).mockReturnValue(true)
    when(mockUseUnmatchedModulesForProtocol)
      .calledWith(MOCK_ROBOT_NAME, MOCK_RUN_ID)
      .mockReturnValue({
        missingModuleIds: [],
        remainingAttachedModules: [],
      })

    when(mockUseModuleRenderInfoForProtocolById)
      .calledWith(MOCK_ROBOT_NAME, MOCK_RUN_ID)
      .mockReturnValue({
        [mockMagneticModule.moduleId]: {
          moduleId: mockMagneticModule.moduleId,
          x: MOCK_MAGNETIC_MODULE_COORDS[0],
          y: MOCK_MAGNETIC_MODULE_COORDS[1],
          z: MOCK_MAGNETIC_MODULE_COORDS[2],
          moduleDef: mockMagneticModule as any,
          nestedLabwareDef: null,
          nestedLabwareId: null,
          nestedLabwareDisplayName: null,
          protocolLoadOrder: 1,
          attachedModuleMatch: {
            ...mockMagneticModuleFixture,
            model: mockMagneticModule.model,
          } as any,
          slotName: '1',
        },
        [mockTCModule.moduleId]: {
          moduleId: mockTCModule.moduleId,
          x: MOCK_TC_COORDS[0],
          y: MOCK_TC_COORDS[1],
          z: MOCK_TC_COORDS[2],
          moduleDef: mockTCModule,
          nestedLabwareDef: null,
          nestedLabwareId: null,
          nestedLabwareDisplayName: null,
          protocolLoadOrder: 0,
          attachedModuleMatch: {
            ...mockThermocyclerFixture,
            model: mockTCModule.model,
          } as any,
          slotName: '7',
        },
      })

    when(mockModuleInfo)
      .calledWith(
        componentPropsMatcher({
          moduleModel: mockMagneticModule.model,
          isAttached: true,
          usbPort: mockMagneticModuleFixture.usbPort.port,
          hubPort: mockMagneticModuleFixture.usbPort.hub,
          runId: MOCK_RUN_ID,
        })
      )
      .mockReturnValue(<div>mock module info {mockMagneticModule.model} </div>)

    when(mockModuleInfo)
      .calledWith(
        componentPropsMatcher({
          moduleModel: mockTCModule.model,
          isAttached: true,
          usbPort: mockThermocyclerFixture.usbPort.port,
          hubPort: mockThermocyclerFixture.usbPort.hub,
          runId: MOCK_RUN_ID,
        })
      )
      .mockReturnValue(<div>mock module info {mockTCModule.model} </div>)

    const { getByText, getByRole } = render(props)
    getByText('mock module info magneticModuleV2')
    const button = getByRole('button', { name: 'Proceed to labware setup' })
    expect(button).toBeDisabled()
  })

  it('renders Moam with the correct module in the correct slot', () => {
    when(mockUseUnmatchedModulesForProtocol)
      .calledWith(MOCK_ROBOT_NAME, MOCK_RUN_ID)
      .mockReturnValue({
        missingModuleIds: [],
        remainingAttachedModules: [],
      })

    const dupModId = `${mockMagneticModule.moduleId}duplicate`
    const dupModPort = 10
    const dupModHub = 2
    when(mockUseModuleRenderInfoForProtocolById)
      .calledWith(MOCK_ROBOT_NAME, MOCK_RUN_ID)
      .mockReturnValue({
        [mockMagneticModule.moduleId]: {
          moduleId: mockMagneticModule.moduleId,
          x: MOCK_MAGNETIC_MODULE_COORDS[0],
          y: MOCK_MAGNETIC_MODULE_COORDS[1],
          z: MOCK_MAGNETIC_MODULE_COORDS[2],
          moduleDef: mockMagneticModule as any,
          nestedLabwareDef: null,
          nestedLabwareId: null,
          nestedLabwareDisplayName: null,
          protocolLoadOrder: 1,
          attachedModuleMatch: {
            ...mockMagneticModuleFixture,
            model: mockMagneticModule.model,
          } as any,
          slotName: '1',
        },
        [dupModId]: {
          moduleId: dupModId,
          x: MOCK_SECOND_MAGNETIC_MODULE_COORDS[0],
          y: MOCK_SECOND_MAGNETIC_MODULE_COORDS[1],
          z: MOCK_SECOND_MAGNETIC_MODULE_COORDS[2],
          moduleDef: mockMagneticModule as any,
          nestedLabwareDef: null,
          nestedLabwareId: null,
          nestedLabwareDisplayName: null,
          protocolLoadOrder: 0,
          attachedModuleMatch: {
            ...mockMagneticModuleFixture,
            model: mockMagneticModule.model,
            usbPort: {
              port: dupModPort,
              hub: dupModHub,
            },
          } as any,
          slotName: '3',
        },
      })

    when(mockModuleInfo)
      .calledWith(
        componentPropsMatcher({
          moduleModel: mockMagneticModule.model,
          isAttached: true,
          usbPort: mockMagneticModuleFixture.usbPort.port,
          hubPort: mockMagneticModuleFixture.usbPort.hub,
          runId: MOCK_RUN_ID,
        })
      )
      .mockReturnValue(<div>mock module info {mockMagneticModule.model} </div>)

    when(mockModuleInfo)
      .calledWith(
        componentPropsMatcher({
          moduleModel: mockMagneticModule.model,
          isAttached: true,
          usbPort: dupModPort,
          hubPort: dupModHub,
          runId: MOCK_RUN_ID,
        })
      )
      .mockReturnValue(<div>mock module info {mockTCModule.model} </div>)

    const { getByText, getByRole } = render(props)
    getByText('mock module info magneticModuleV2')
    const button = getByRole('button', { name: 'Proceed to labware setup' })
    expect(button).not.toBeDisabled()
  })
  it.todo('renders heater shaker banner correctly')
})
