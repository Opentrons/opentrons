import * as React from 'react'
import '@testing-library/jest-dom'
import { when, resetAllWhenMocks } from 'jest-when'
import { StaticRouter } from 'react-router-dom'
import { screen } from '@testing-library/react'
import {
  renderWithProviders,
  partialComponentPropsMatcher,
  componentPropsMatcher,
  RobotWorkSpace,
} from '@opentrons/components'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'
import { i18n } from '../../../../../i18n'
import {
  inferModuleOrientationFromXCoordinate,
  ModuleModel,
  ModuleType,
} from '@opentrons/shared-data'
import {
  mockThermocycler as mockThermocyclerFixture,
  mockMagneticModule as mockMagneticModuleFixture,
} from '../../../../../redux/modules/__fixtures__/index'
import { getAttachedModules } from '../../../../../redux/modules'
import { useModuleRenderInfoById } from '../../../hooks'
import { useMissingModuleIds } from '../../hooks'
import { MultipleModulesModal } from '../MultipleModulesModal'
import { ModuleSetup } from '..'
import { ModuleInfo } from '../ModuleInfo'

jest.mock('../../../../../redux/modules')
jest.mock('../ModuleInfo')
jest.mock('../../hooks')
jest.mock('../../../hooks')
jest.mock('../MultipleModulesModal')
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
const mockMultipleModulesModal = MultipleModulesModal as jest.MockedFunction<
  typeof MultipleModulesModal
>
const mockUseMissingModuleIds = useMissingModuleIds as jest.MockedFunction<
  typeof useMissingModuleIds
>
const mockGetAttachedModules = getAttachedModules as jest.MockedFunction<
  typeof getAttachedModules
>
const mockModuleInfo = ModuleInfo as jest.MockedFunction<typeof ModuleInfo>
const mockInferModuleOrientationFromXCoordinate = inferModuleOrientationFromXCoordinate as jest.MockedFunction<
  typeof inferModuleOrientationFromXCoordinate
>
const mockRobotWorkSpace = RobotWorkSpace as jest.MockedFunction<
  typeof RobotWorkSpace
>
const mockUseModuleRenderInfoById = useModuleRenderInfoById as jest.MockedFunction<
  typeof useModuleRenderInfoById
>

const deckSlotsById = standardDeckDef.locations.orderedSlots.reduce(
  (acc, deckSlot) => ({ ...acc, [deckSlot.id]: deckSlot }),
  {}
)

const render = (props: React.ComponentProps<typeof ModuleSetup>) => {
  return renderWithProviders(
    <StaticRouter>
      <ModuleSetup {...props} />
    </StaticRouter>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

const STUBBED_ORIENTATION_VALUE = 'left'
const MOCK_MAGNETIC_MODULE_COORDS = [10, 20, 0]
const MOCK_TC_COORDS = [20, 30, 0]
const MOCK_ROBOT_NAME = 'ot-dev'

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

describe('ModuleSetup', () => {
  let props: React.ComponentProps<typeof ModuleSetup>
  beforeEach(() => {
    props = {
      robotName: MOCK_ROBOT_NAME,
      expandLabwareSetupStep: () => {},
    }

    when(mockInferModuleOrientationFromXCoordinate)
      .calledWith(expect.anything())
      .mockReturnValue(STUBBED_ORIENTATION_VALUE)

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
    when(mockGetAttachedModules)
      .calledWith(undefined as any, MOCK_ROBOT_NAME)
      .mockReturnValue([])
  })

  afterEach(() => {
    resetAllWhenMocks()
    jest.restoreAllMocks()
  })

  it('should render a deck WITHOUT modules if none passed (component will never be rendered in this circumstance)', () => {
    when(mockUseModuleRenderInfoById).calledWith().mockReturnValue({})

    mockUseMissingModuleIds.mockReturnValue([])

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
    when(mockUseModuleRenderInfoById)
      .calledWith()
      .mockReturnValue({
        [mockMagneticModule.moduleId]: {
          x: MOCK_MAGNETIC_MODULE_COORDS[0],
          y: MOCK_MAGNETIC_MODULE_COORDS[1],
          z: MOCK_MAGNETIC_MODULE_COORDS[2],
          moduleDef: mockMagneticModule as any,
          nestedLabwareDef: null,
          nestedLabwareId: null,
        },
        [mockMagneticModule.moduleId]: {
          x: MOCK_MAGNETIC_MODULE_COORDS[0],
          y: MOCK_MAGNETIC_MODULE_COORDS[1],
          z: MOCK_MAGNETIC_MODULE_COORDS[2],
          moduleDef: mockMagneticModule as any,
          nestedLabwareDef: null,
          nestedLabwareId: null,
        },
      } as any)

    when(mockModuleInfo)
      .calledWith(
        partialComponentPropsMatcher({
          moduleModel: mockMagneticModule.model,
          isAttached: false,
          usbPort: undefined,
          hubPort: undefined,
        })
      )
      .mockReturnValue(<div>mock module info {mockMagneticModule.model}</div>)

    const { getByText } = render(props)
    getByText('mock module info magneticModuleV2')
    expect(screen.queryByText('mock Moam modal')).toBeNull()
  })
  it('should render a deck WITH modules with CTA disabled if the protocol requests modules and they are not all attached to the robot', () => {
    when(mockUseModuleRenderInfoById)
      .calledWith()
      .mockReturnValue({
        [mockMagneticModule.moduleId]: {
          x: MOCK_MAGNETIC_MODULE_COORDS[0],
          y: MOCK_MAGNETIC_MODULE_COORDS[1],
          z: MOCK_MAGNETIC_MODULE_COORDS[2],
          moduleDef: mockMagneticModule as any,
          nestedLabwareDef: null,
          nestedLabwareId: null,
        },
        [mockTCModule.moduleId]: {
          x: MOCK_TC_COORDS[0],
          y: MOCK_TC_COORDS[1],
          z: MOCK_TC_COORDS[2],
          moduleDef: mockTCModule,
          nestedLabwareDef: null,
          nestedLabwareId: null,
        },
      } as any)

    when(mockModuleInfo)
      .calledWith(
        partialComponentPropsMatcher({
          moduleModel: mockMagneticModule.model,
          isAttached: false,
          usbPort: undefined,
          hubPort: undefined,
        })
      )
      .mockReturnValue(<div>mock module info {mockMagneticModule.model}</div>)

    when(mockModuleInfo)
      .calledWith(
        partialComponentPropsMatcher({
          moduleModel: mockTCModule.model,
          isAttached: false,
          usbPort: undefined,
          hubPort: undefined,
        })
      )
      .mockReturnValue(<div>mock module info {mockTCModule.model} </div>)

    mockUseMissingModuleIds.mockReturnValue(['foo'])

    const { getByText, getByRole } = render(props)
    getByText('mock module info magneticModuleV2')
    const button = getByRole('button', { name: 'Proceed to Labware Setup' })
    expect(button).toHaveAttribute('disabled')
  })

  it('should render a deck WITH modules with CTA enabled if all protocol requested modules have a matching attached module', () => {
    mockUseMissingModuleIds.mockReturnValue([])

    when(mockUseModuleRenderInfoById)
      .calledWith()
      .mockReturnValue({
        [mockMagneticModule.moduleId]: {
          x: MOCK_MAGNETIC_MODULE_COORDS[0],
          y: MOCK_MAGNETIC_MODULE_COORDS[1],
          z: MOCK_MAGNETIC_MODULE_COORDS[2],
          moduleDef: mockMagneticModule as any,
          nestedLabwareDef: null,
          nestedLabwareId: null,
        },
        [mockTCModule.moduleId]: {
          x: MOCK_TC_COORDS[0],
          y: MOCK_TC_COORDS[1],
          z: MOCK_TC_COORDS[2],
          moduleDef: mockTCModule,
          nestedLabwareDef: null,
          nestedLabwareId: null,
        },
      } as any)
    when(mockGetAttachedModules)
      .calledWith(undefined as any, MOCK_ROBOT_NAME)
      .mockReturnValue([
        {
          ...mockMagneticModuleFixture,
          model: mockMagneticModule.model,
        } as any,
        { ...mockThermocyclerFixture, model: mockTCModule.model } as any,
      ])

    when(mockModuleInfo)
      .calledWith(
        componentPropsMatcher({
          moduleModel: mockMagneticModule.model,
          isAttached: true,
          usbPort: mockMagneticModuleFixture.usbPort.port,
          hubPort: mockMagneticModuleFixture.usbPort.hub,
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
        })
      )
      .mockReturnValue(<div>mock module info {mockTCModule.model} </div>)

    const { getByText, getByRole } = render(props)
    getByText('mock module info magneticModuleV2')
    const button = getByRole('button', { name: 'Proceed to Labware Setup' })
    expect(button).not.toBeDisabled()
  })
})
