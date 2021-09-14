import * as React from 'react'
import '@testing-library/jest-dom'
import { when, resetAllWhenMocks } from 'jest-when'
import { StaticRouter } from 'react-router-dom'
import { RobotWorkSpace, ModuleViz } from '@opentrons/components'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'
import {
  renderWithProviders,
  partialComponentPropsMatcher,
  componentPropsMatcher,
} from '@opentrons/components/__utils__'
import { i18n } from '../../../../../i18n'
import { ModuleSetup } from '..'
import { ModuleInfo } from '../ModuleInfo'
import {
  inferModuleOrientationFromXCoordinate,
  ModuleModel,
  ModuleType,
} from '@opentrons/shared-data'
import { getAttachedModules } from '../../../../../redux/modules'
import {
  mockThermocycler as mockThermocyclerFixture,
  mockMagneticModule as mockMagneticModuleFixture,
} from '../../../../../redux/modules/__fixtures__/index'
import { useModuleRenderInfoById, useLabwareRenderInfoById } from '../../../hooks'

jest.mock('../../../../../redux/modules')
jest.mock('../ModuleInfo')
jest.mock('../../../hooks')
jest.mock('@opentrons/components', () => {
  const actualComponents = jest.requireActual('@opentrons/components')
  return {
    ...actualComponents,
    ModuleViz: jest.fn(() => <div>mock ModuleViz</div>),
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
const mockGetAttachedModules = getAttachedModules as jest.MockedFunction<
  typeof getAttachedModules
>
const mockModuleInfo = ModuleInfo as jest.MockedFunction<typeof ModuleInfo>

const mockModuleViz = ModuleViz as jest.MockedFunction<typeof ModuleViz>

const mockInferModuleOrientationFromXCoordinate = inferModuleOrientationFromXCoordinate as jest.MockedFunction<
  typeof inferModuleOrientationFromXCoordinate
>

const mockRobotWorkSpace = RobotWorkSpace as jest.MockedFunction<
  typeof RobotWorkSpace
>

const mockUseModuleRenderInfoById = useModuleRenderInfoById as jest.MockedFunction<typeof useModuleRenderInfoById>

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
  )
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
  twoDimensionalRendering: {children: []}
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
  twoDimensionalRendering: {children: []}
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

  it('should render a deck WITHOUT modules', () => {
    render(props)
    expect(mockModuleViz).not.toHaveBeenCalled()
    expect(mockModuleInfo).not.toHaveBeenCalled()
  })
  it('should render a deck WITH modules with CTA disabled', () => {
    when(mockUseModuleRenderInfoById).calledWith().mockReturnValue({
      [mockMagneticModule.moduleId]: {
        x: MOCK_MAGNETIC_MODULE_COORDS[0],
        y: MOCK_MAGNETIC_MODULE_COORDS[1],
        z: MOCK_MAGNETIC_MODULE_COORDS[2],
        moduleDef: mockMagneticModule as any,
        nestedLabwareDef: null
      },
      [mockTCModule.moduleId]: {
        x: MOCK_TC_COORDS[0],
        y: MOCK_TC_COORDS[1],
        z: MOCK_TC_COORDS[2],
        moduleDef: mockTCModule,
        nestedLabwareDef: null
      },
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

    when(mockModuleInfo)
      .calledWith(
        componentPropsMatcher({
          orientation: STUBBED_ORIENTATION_VALUE,
          moduleModel: mockMagneticModule.model,
          x: MOCK_MAGNETIC_MODULE_COORDS[0],
          y: MOCK_MAGNETIC_MODULE_COORDS[1],
          isAttached: false,
          usbPort: null,
          hubPort: null,
        })
      )
      .mockReturnValue(<div>mock module info {mockMagneticModule.model} </div>)

    when(mockModuleInfo)
      .calledWith(
        componentPropsMatcher({
          orientation: STUBBED_ORIENTATION_VALUE,
          moduleModel: mockTCModule.model,
          x: MOCK_TC_COORDS[0],
          y: MOCK_TC_COORDS[1],
          isAttached: false,
          usbPort: null,
          hubPort: null,
        })
      )
      .mockReturnValue(<div>mock module info {mockTCModule.model} </div>)

    const { getByText, getByRole } = render(props)
    getByText('mock module viz magneticModuleType')
    getByText('mock module viz thermocyclerModuleType')
    getByText('mock module info magneticModuleV2')
    const button = getByRole('button', { name: 'Proceed to Labware Setup' })
    expect(button).toHaveAttribute('disabled')
  })

  it('should render a deck WITH modules with CTA enabled', () => {

    when(mockUseModuleRenderInfoById).calledWith().mockReturnValue({
      [mockMagneticModule.moduleId]: {
        x: MOCK_MAGNETIC_MODULE_COORDS[0],
        y: MOCK_MAGNETIC_MODULE_COORDS[1],
        z: MOCK_MAGNETIC_MODULE_COORDS[2],
        moduleDef: mockMagneticModule as any,
        nestedLabwareDef: null
      },
      [mockTCModule.moduleId]: {
        x: MOCK_TC_COORDS[0],
        y: MOCK_TC_COORDS[1],
        z: MOCK_TC_COORDS[2],
        moduleDef: mockTCModule,
        nestedLabwareDef: null
      },
    })
    when(mockGetAttachedModules)
      .calledWith(undefined as any, MOCK_ROBOT_NAME)
      .mockReturnValue([
        {
          ...mockMagneticModuleFixture,
          model: mockMagneticModule.model,
        } as any,
        { ...mockThermocyclerFixture, model: mockTCModule.model } as any,
      ])

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

    when(mockModuleInfo)
      .calledWith(
        componentPropsMatcher({
          orientation: STUBBED_ORIENTATION_VALUE,
          moduleModel: mockMagneticModule.model,
          x: MOCK_MAGNETIC_MODULE_COORDS[0],
          y: MOCK_MAGNETIC_MODULE_COORDS[1],
          isAttached: true,
          usbPort: String(mockMagneticModuleFixture.usbPort.port),
          hubPort: String(mockMagneticModuleFixture.usbPort.hub),
        })
      )
      .mockReturnValue(<div>mock module info {mockMagneticModule.model} </div>)

    when(mockModuleInfo)
      .calledWith(
        componentPropsMatcher({
          orientation: STUBBED_ORIENTATION_VALUE,
          moduleModel: mockTCModule.model,
          x: MOCK_TC_COORDS[0],
          y: MOCK_TC_COORDS[1],
          isAttached: true,
          usbPort: String(mockThermocyclerFixture.usbPort.port),
          hubPort: String(mockThermocyclerFixture.usbPort.hub),
        })
      )
      .mockReturnValue(<div>mock module info {mockTCModule.model} </div>)

    const { getByText, getByRole } = render(props)
    getByText('mock module viz magneticModuleType')
    getByText('mock module viz thermocyclerModuleType')
    getByText('mock module info magneticModuleV2')
    const button = getByRole('button', { name: 'Proceed to Labware Setup' })
    expect(button).not.toHaveAttribute('disabled')
  })
})
