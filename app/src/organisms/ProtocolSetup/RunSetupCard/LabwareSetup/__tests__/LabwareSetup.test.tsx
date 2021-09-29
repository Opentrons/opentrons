import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { StaticRouter } from 'react-router-dom'
import { LabwareRender, RobotWorkSpace, Module } from '@opentrons/components'
import {
  inferModuleOrientationFromXCoordinate,
  LabwareDefinition2,
  ModuleModel,
  ModuleType,
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
import {
  useModuleRenderInfoById,
  useLabwareRenderInfoById,
} from '../../../hooks'

jest.mock('../../../../../redux/modules')
jest.mock('../../../../../redux/pipettes/selectors')
jest.mock('../LabwareSetupModal')
jest.mock('../LabwareInfoOverlay')
jest.mock('../ExtraAttentionWarning')
jest.mock('../../../hooks')
jest.mock('../utils/getModuleTypesThatRequireExtraAttention')
jest.mock('@opentrons/components', () => {
  const actualComponents = jest.requireActual('@opentrons/components')
  return {
    ...actualComponents,
    Module: jest.fn(() => <div>mock Module</div>),
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
const mockLabwareInfoOverlay = LabwareInfoOverlay as jest.MockedFunction<
  typeof LabwareInfoOverlay
>

const mockModule = Module as jest.MockedFunction<typeof Module>
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
const mockUseLabwareRenderInfoById = useLabwareRenderInfoById as jest.MockedFunction<
  typeof useLabwareRenderInfoById
>
const mockUseModuleRenderInfoById = useModuleRenderInfoById as jest.MockedFunction<
  typeof useModuleRenderInfoById
>

const deckSlotsById = standardDeckDef.locations.orderedSlots.reduce(
  (acc, deckSlot) => ({ ...acc, [deckSlot.id]: deckSlot }),
  {}
)

const render = () => {
  return renderWithProviders(
    <StaticRouter>
      <LabwareSetup />
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

const mockMagneticModule = {
  labwareOffset: { x: 5, y: 5, z: 5 },
  moduleId: 'someMagneticModule',
  model: 'magneticModuleV2' as ModuleModel,
  type: 'magneticModuleType' as ModuleType,
}

const mockTCModule = {
  labwareOffset: { x: 3, y: 3, z: 3 },
  moduleId: 'TCModuleId',
  model: 'thermocyclerModuleV1' as ModuleModel,
  type: 'thermocyclerModuleType' as ModuleType,
}

describe('LabwareSetup', () => {
  beforeEach(() => {
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
      .calledWith(componentPropsMatcher({ definition: fixture_tiprack_300_ul }))
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
  })

  afterEach(() => {
    resetAllWhenMocks()
    jest.restoreAllMocks()
  })

  describe('labware help link', () => {
    it('opens up the labware help modal when clicked', () => {
      const { getByText } = render()

      expect(screen.queryByText('mock labware setup modal')).toBeNull()
      const helpLink = getByText('Labware Help')
      fireEvent.click(helpLink)
      getByText('mock labware setup modal')
    })
    it('closes the labware help modal when closed', () => {
      const { getByText } = render()

      const helpLink = getByText('Labware Help')
      fireEvent.click(helpLink)
      const mockModal = getByText('mock labware setup modal')
      fireEvent.click(mockModal)
      expect(screen.queryByText('mock labware setup modal')).toBeNull()
    })
  })

  it('should render a deck WITHOUT labware and WITHOUT modules', () => {
    when(mockUseLabwareRenderInfoById).calledWith().mockReturnValue({})
    when(mockUseModuleRenderInfoById).calledWith().mockReturnValue({})

    render()
    expect(mockModule).not.toHaveBeenCalled()
    expect(mockLabwareRender).not.toHaveBeenCalled()
    expect(mockLabwareInfoOverlay).not.toHaveBeenCalled()
  })
  it('should render a deck WITH labware and WITHOUT modules', () => {
    when(mockUseLabwareRenderInfoById)
      .calledWith()
      .mockReturnValue({
        '300_ul_tiprack_id': {
          labwareDef: fixture_tiprack_300_ul as LabwareDefinition2,
          x: MOCK_300_UL_TIPRACK_COORDS[0],
          y: MOCK_300_UL_TIPRACK_COORDS[1],
          z: MOCK_300_UL_TIPRACK_COORDS[2],
        },
      })

    when(mockUseModuleRenderInfoById).calledWith().mockReturnValue({})

    const { getByText } = render()
    expect(mockModule).not.toHaveBeenCalled()
    expect(mockLabwareRender).toHaveBeenCalled()
    expect(mockLabwareInfoOverlay).toHaveBeenCalled()
    getByText('mock labware render of 300ul Tiprack FIXTURE')
    getByText('mock labware info overlay of 300ul Tiprack FIXTURE')
  })

  it('should render a deck WITH labware and WITH modules', () => {
    when(mockUseLabwareRenderInfoById)
      .calledWith()
      .mockReturnValue({
        [MOCK_300_UL_TIPRACK_ID]: {
          labwareDef: fixture_tiprack_300_ul as LabwareDefinition2,
          x: MOCK_300_UL_TIPRACK_COORDS[0],
          y: MOCK_300_UL_TIPRACK_COORDS[1],
          z: MOCK_300_UL_TIPRACK_COORDS[2],
        },
      })

    when(mockUseModuleRenderInfoById)
      .calledWith()
      .mockReturnValue({
        [mockMagneticModule.moduleId]: {
          x: MOCK_MAGNETIC_MODULE_COORDS[0],
          y: MOCK_MAGNETIC_MODULE_COORDS[1],
          z: MOCK_MAGNETIC_MODULE_COORDS[2],
          moduleDef: mockMagneticModule as any,
          nestedLabwareDef: null,
        },
        [mockTCModule.moduleId]: {
          x: MOCK_TC_COORDS[0],
          y: MOCK_TC_COORDS[1],
          z: MOCK_TC_COORDS[2],
          moduleDef: mockTCModule,
          nestedLabwareDef: null,
        },
      })

    when(mockModule)
      .calledWith(
        partialComponentPropsMatcher({
          def: mockMagneticModule,
          x: MOCK_MAGNETIC_MODULE_COORDS[0],
          y: MOCK_MAGNETIC_MODULE_COORDS[1],
        })
      )
      .mockReturnValue(<div>mock module viz {mockMagneticModule.type} </div>)

    when(mockModule)
      .calledWith(
        partialComponentPropsMatcher({
          def: mockTCModule,
          x: MOCK_TC_COORDS[0],
          y: MOCK_TC_COORDS[1],
        })
      )
      .mockReturnValue(<div>mock module viz {mockTCModule.type} </div>)

    const { getByText } = render()
    getByText('mock module viz magneticModuleType')
    getByText('mock module viz thermocyclerModuleType')
    getByText('mock labware render of 300ul Tiprack FIXTURE')
    getByText('mock labware info overlay of 300ul Tiprack FIXTURE')
  })
  it('should render the labware position check text', () => {
    const { getByText, getByRole } = render()

    getByRole('heading', {
      name: 'Labware Position Check',
    })
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

    const { getByText } = render()
    getByText('mock extra attention warning with magnetic module and TC')
  })
})
