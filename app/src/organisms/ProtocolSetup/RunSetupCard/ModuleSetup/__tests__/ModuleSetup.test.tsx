import * as React from 'react'
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
  ModuleRealType,
} from '@opentrons/shared-data'

jest.mock('../ModuleInfo')
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

const mockModuleInfo = ModuleInfo as jest.MockedFunction<typeof ModuleInfo>

const mockModuleViz = ModuleViz as jest.MockedFunction<typeof ModuleViz>

const mockInferModuleOrientationFromXCoordinate = inferModuleOrientationFromXCoordinate as jest.MockedFunction<
  typeof inferModuleOrientationFromXCoordinate
>

const mockRobotWorkSpace = RobotWorkSpace as jest.MockedFunction<
  typeof RobotWorkSpace
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
  )
}

const STUBBED_ORIENTATION_VALUE = 'left'
const MOCK_MAGNETIC_MODULE_COORDS = [10, 20, 0]
const MOCK_TC_COORDS = [20, 30, 0]

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

describe('ModuleSetup', () => {
  let props: React.ComponentProps<typeof ModuleSetup>
  beforeEach(() => {
    props = { moduleRenderCoords: {}, expandLabwareSetupStep: () => {} }

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
  })

  afterEach(() => {
    resetAllWhenMocks()
    jest.restoreAllMocks()
  })

  it('should render a deck WITHOUT modules', () => {
    const moduleRenderCoords = {}

    props = {
      ...props,
      moduleRenderCoords,
    }

    render(props)
    expect(mockModuleViz).not.toHaveBeenCalled()
    expect(mockModuleInfo).not.toHaveBeenCalled()
  })
  it('should render a deck WITH modules', () => {
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
        })
      )
      .mockReturnValue(<div>mock module info {mockTCModule.model} </div>)

    props = {
      ...props,
      moduleRenderCoords,
    }

    const { getByText } = render(props)
    getByText('mock module viz magneticModuleType')
    getByText('mock module viz thermocyclerModuleType')
    getByText('mock module info magneticModuleV2')
  })
})
