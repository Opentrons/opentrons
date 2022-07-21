import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { StaticRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'

import {
  renderWithProviders,
  componentPropsMatcher,
  partialComponentPropsMatcher,
  LabwareRender,
  RobotWorkSpace,
  Module,
} from '@opentrons/components'
import {
  inferModuleOrientationFromXCoordinate,
  LabwareDefinition2,
  ModuleModel,
  ModuleType,
} from '@opentrons/shared-data'
import fixture_tiprack_300_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/3/ot2_standard.json'

import { i18n } from '../../../../i18n'
import { useLPCSuccessToast } from '../../../ProtocolSetup/hooks'
import { LabwarePositionCheck } from '../../../LabwarePositionCheck'
import { ModuleExtraAttention } from '../ModuleExtraAttention'
import { LabwareInfoOverlay } from '../LabwareInfoOverlay'
import { LabwareOffsetModal } from '../../../ProtocolSetup/RunSetupCard/LabwareSetup/LabwareOffsetModal'
import { getModuleTypesThatRequireExtraAttention } from '../../../ProtocolSetup/RunSetupCard/LabwareSetup/utils/getModuleTypesThatRequireExtraAttention'
import { getIsLabwareOffsetCodeSnippetsOn } from '../../../../redux/config'
import {
  useLabwareRenderInfoForRunById,
  useModuleRenderInfoForProtocolById,
  useProtocolDetailsForRun,
  useRunCalibrationStatus,
  useRunHasStarted,
  useUnmatchedModulesForProtocol,
} from '../../hooks'
import { ProceedToRunButton } from '../ProceedToRunButton'
import { SetupLabware } from '../SetupLabware'

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
jest.mock('../../../ProtocolSetup/hooks')
jest.mock('../../../LabwarePositionCheck')
jest.mock('../ModuleExtraAttention')
jest.mock('../LabwareInfoOverlay')
jest.mock('../../../ProtocolSetup/RunSetupCard/LabwareSetup/LabwareOffsetModal')
jest.mock(
  '../../../ProtocolSetup/RunSetupCard/LabwareSetup/utils/getModuleTypesThatRequireExtraAttention'
)
jest.mock('../../../RunTimeControl/hooks')
jest.mock('../../../../redux/config')
jest.mock('../../hooks')
jest.mock('../ProceedToRunButton')

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
const mockLabwareOffsetModal = LabwareOffsetModal as jest.MockedFunction<
  typeof LabwareOffsetModal
>
const mockGetModuleTypesThatRequireExtraAttention = getModuleTypesThatRequireExtraAttention as jest.MockedFunction<
  typeof getModuleTypesThatRequireExtraAttention
>
const mockModuleExtraAttention = ModuleExtraAttention as jest.MockedFunction<
  typeof ModuleExtraAttention
>
const mockUseLabwareRenderInfoForRunById = useLabwareRenderInfoForRunById as jest.MockedFunction<
  typeof useLabwareRenderInfoForRunById
>
const mockUseModuleRenderInfoForProtocolById = useModuleRenderInfoForProtocolById as jest.MockedFunction<
  typeof useModuleRenderInfoForProtocolById
>
const mockLabwarePostionCheck = LabwarePositionCheck as jest.MockedFunction<
  typeof LabwarePositionCheck
>
const mockUseRunHasStarted = useRunHasStarted as jest.MockedFunction<
  typeof useRunHasStarted
>
const mockUseProtocolDetailsForRun = useProtocolDetailsForRun as jest.MockedFunction<
  typeof useProtocolDetailsForRun
>
const mockUseUnmatchedModulesForProtocol = useUnmatchedModulesForProtocol as jest.MockedFunction<
  typeof useUnmatchedModulesForProtocol
>
const mockUseRunCalibrationStatus = useRunCalibrationStatus as jest.MockedFunction<
  typeof useRunCalibrationStatus
>
const mockGetIsLabwareOffsetCodeSnippetsOn = getIsLabwareOffsetCodeSnippetsOn as jest.MockedFunction<
  typeof getIsLabwareOffsetCodeSnippetsOn
>
const mockUseLPCSuccessToast = useLPCSuccessToast as jest.MockedFunction<
  typeof useLPCSuccessToast
>
const mockProceedToRunButton = ProceedToRunButton as jest.MockedFunction<
  typeof ProceedToRunButton
>
const deckSlotsById = standardDeckDef.locations.orderedSlots.reduce(
  (acc, deckSlot) => ({ ...acc, [deckSlot.id]: deckSlot }),
  {}
)

const ROBOT_NAME = 'otie'
const RUN_ID = '1'
const STUBBED_ORIENTATION_VALUE = 'left'
const MOCK_300_UL_TIPRACK_ID = '300_ul_tiprack_id'
const MOCK_MAGNETIC_MODULE_COORDS = [10, 20, 0]
const MOCK_TC_COORDS = [20, 30, 0]
const MOCK_300_UL_TIPRACK_COORDS = [30, 40, 0]

const mockMagneticModule = {
  moduleId: 'someMagneticModule',
  model: 'magneticModuleV2' as ModuleModel,
  type: 'magneticModuleType' as ModuleType,
  labwareOffset: { x: 5, y: 5, z: 5 },
  cornerOffsetFromSlot: { x: 1, y: 1, z: 1 },
  calibrationPoint: { x: 0, y: 0 },
  displayName: 'Magnetic Module',
  dimensions: {
    xDimension: 100,
    yDimension: 100,
    footprintXDimension: 50,
    footprintYDimension: 50,
    labwareInterfaceXDimension: 80,
    labwareInterfaceYDimension: 120,
  },
  twoDimensionalRendering: { children: [] },
  quirks: [],
}

const mockTCModule = {
  labwareOffset: { x: 3, y: 3, z: 3 },
  moduleId: 'TCModuleId',
  model: 'thermocyclerModuleV1' as ModuleModel,
  type: 'thermocyclerModuleType' as ModuleType,
}

const PICKUP_TIP_LABWARE_ID = 'PICKUP_TIP_LABWARE_ID'
const PRIMARY_PIPETTE_ID = 'PRIMARY_PIPETTE_ID'
const PRIMARY_PIPETTE_NAME = 'PRIMARY_PIPETTE_NAME'
const LABWARE_DEF_ID = 'LABWARE_DEF_ID'
const LABWARE_DEF = {
  ordering: [['A1', 'A2']],
  parameters: { isTiprack: true },
}
const mockLabwarePositionCheckStepTipRack = {
  labwareId:
    '1d57fc10-67ad-11ea-9f8b-3b50068bd62d:opentrons/opentrons_96_filtertiprack_200ul/1',
  section: '',
  commands: [
    {
      commandType: 'pickUpTip',
      params: {
        pipetteId: PRIMARY_PIPETTE_ID,
        labwareId: PICKUP_TIP_LABWARE_ID,
      },
    },
  ],
} as any

const render = () => {
  return renderWithProviders(
    <StaticRouter>
      <SetupLabware
        protocolRunHeaderRef={null}
        robotName={ROBOT_NAME}
        runId={RUN_ID}
        nextStep={null}
        expandStep={() => null}
      />
    </StaticRouter>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('LabwareSetup', () => {
  beforeEach(() => {
    when(mockInferModuleOrientationFromXCoordinate)
      .calledWith(expect.anything())
      .mockReturnValue(STUBBED_ORIENTATION_VALUE)

    when(mockGetModuleTypesThatRequireExtraAttention)
      .calledWith(expect.anything())
      .mockReturnValue([])

    when(mockLabwareOffsetModal)
      .calledWith(
        componentPropsMatcher({
          onCloseClick: expect.anything(),
        })
      )
      .mockImplementation(({ onCloseClick }) => (
        <div onClick={onCloseClick}>mock LabwareOffsetModal </div>
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
        partialComponentPropsMatcher({ definition: fixture_tiprack_300_ul })
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

    when(mockLabwarePostionCheck).mockReturnValue(
      <div>mock Labware Position Check</div>
    )
    when(mockUseUnmatchedModulesForProtocol)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({
        missingModuleIds: [],
        remainingAttachedModules: [],
      })

    when(mockUseLPCSuccessToast)
      .calledWith()
      .mockReturnValue({ setIsShowingLPCSuccessToast: jest.fn() })

    when(mockUseRunCalibrationStatus)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({
        complete: true,
      })
    when(mockUseRunHasStarted).calledWith(RUN_ID).mockReturnValue(false)
    when(mockUseProtocolDetailsForRun)
      .calledWith(RUN_ID)
      .mockReturnValue({
        protocolData: {
          labware: {
            [mockLabwarePositionCheckStepTipRack.labwareId]: {
              slot: '1',
              displayName: 'someDisplayName',
              definitionId: LABWARE_DEF_ID,
            },
          },
          labwareDefinitions: {
            [LABWARE_DEF_ID]: LABWARE_DEF,
          },
          pipettes: {
            [PRIMARY_PIPETTE_ID]: {
              name: PRIMARY_PIPETTE_NAME,
              mount: 'left',
            },
          },
          commands: [
            {
              commandType: 'pickUpTip',
              params: { pipetteId: PRIMARY_PIPETTE_ID },
            } as any,
          ],
        },
      } as any)
    when(mockGetIsLabwareOffsetCodeSnippetsOn).mockReturnValue(false)
    when(mockProceedToRunButton).mockReturnValue(
      <button>Mock ProceedToRunButton</button>
    )
  })

  afterEach(() => {
    resetAllWhenMocks()
  })

  describe('See How Labware Offsets Work link', () => {
    it('opens up the See How Labware Offsets Work modal when clicked', () => {
      const { getByText } = render()

      expect(screen.queryByText('mock LabwareOffsetModal')).toBeNull()
      const helpLink = getByText('See How Labware Offsets Work')
      fireEvent.click(helpLink)
      getByText('mock LabwareOffsetModal')
    })
    it('closes the See How Labware Offsets Work when closed', () => {
      const { getByText } = render()

      const helpLink = getByText('See How Labware Offsets Work')
      fireEvent.click(helpLink)
      const mockModal = getByText('mock LabwareOffsetModal')
      fireEvent.click(mockModal)
      expect(screen.queryByText('mock LabwareOffsetModal')).toBeNull()
    })
  })

  it('should render a deck WITHOUT labware and WITHOUT modules', () => {
    when(mockUseLabwareRenderInfoForRunById)
      .calledWith(RUN_ID)
      .mockReturnValue({})
    when(mockUseModuleRenderInfoForProtocolById)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({})

    render()
    expect(mockModule).not.toHaveBeenCalled()
    expect(mockLabwareRender).not.toHaveBeenCalled()
    expect(mockLabwareInfoOverlay).not.toHaveBeenCalled()
  })
  it('should render a deck WITH labware and WITHOUT modules', () => {
    when(mockUseLabwareRenderInfoForRunById)
      .calledWith(RUN_ID)
      .mockReturnValue({
        '300_ul_tiprack_id': {
          labwareDef: fixture_tiprack_300_ul as LabwareDefinition2,
          displayName: 'fresh tips',
          x: MOCK_300_UL_TIPRACK_COORDS[0],
          y: MOCK_300_UL_TIPRACK_COORDS[1],
          z: MOCK_300_UL_TIPRACK_COORDS[2],
        },
      })

    when(mockUseModuleRenderInfoForProtocolById)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({})

    const { getByText } = render()
    expect(mockModule).not.toHaveBeenCalled()
    expect(mockLabwareRender).toHaveBeenCalled()
    expect(mockLabwareInfoOverlay).toHaveBeenCalled()
    getByText('mock labware render of 300ul Tiprack FIXTURE')
    getByText('mock labware info overlay of 300ul Tiprack FIXTURE')
  })

  it('should render a deck WITH labware and WITH modules', () => {
    when(mockUseLabwareRenderInfoForRunById)
      .calledWith(RUN_ID)
      .mockReturnValue({
        [MOCK_300_UL_TIPRACK_ID]: {
          labwareDef: fixture_tiprack_300_ul as LabwareDefinition2,
          displayName: 'fresh tips',
          x: MOCK_300_UL_TIPRACK_COORDS[0],
          y: MOCK_300_UL_TIPRACK_COORDS[1],
          z: MOCK_300_UL_TIPRACK_COORDS[2],
        },
      })

    when(mockUseModuleRenderInfoForProtocolById)
      .calledWith(ROBOT_NAME, RUN_ID)
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
  it('should render the Labware Position Check and Labware Offset Data text', () => {
    const { getByText } = render()

    getByText('Labware Position Check and Labware Offset Data')
    getByText(
      'Labware Position Check is a recommended workflow that helps you verify the position of each labware on the deck. During this check, you can create Labware Offsets that adjust how the robot moves to each labware in the X, Y and Z directions.'
    )
  })
  it('should render LPC button and clicking should launch modal', () => {
    const { getByRole, getByText } = render()
    const button = getByRole('button', {
      name: 'run labware position check',
    })
    fireEvent.click(button)
    getByText('mock Labware Position Check')
  })
  it('should render a disabled LPC button when a run has started', () => {
    when(mockUseRunHasStarted).calledWith(RUN_ID).mockReturnValue(true)
    const { getByRole, queryByText } = render()
    const button = getByRole('button', {
      name: 'run labware position check',
    })
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(queryByText('mock Labware Position Check')).toBeNull()
  })
  it('should render the module extra attention banner when there are modules/labware that need extra attention', () => {
    when(mockUseModuleRenderInfoForProtocolById)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({
        [mockMagneticModule.moduleId]: {
          moduleId: mockMagneticModule.moduleId,
          x: MOCK_MAGNETIC_MODULE_COORDS[0],
          y: MOCK_MAGNETIC_MODULE_COORDS[1],
          z: MOCK_MAGNETIC_MODULE_COORDS[2],
          moduleDef: mockMagneticModule as any,
          nestedLabwareDisplayName: 'Source Plate',
          nestedLabwareDef: null,
          nestedLabwareId: null,
          protocolLoadOrder: 0,
          slotName: '3',
          attachedModuleMatch: null,
        },
      } as any)

    when(mockGetModuleTypesThatRequireExtraAttention)
      .calledWith([mockMagneticModule.model])
      .mockReturnValue(['magneticModuleType'])

    when(mockModuleExtraAttention)
      .calledWith(
        componentPropsMatcher({
          moduleTypes: ['magneticModuleType'],
          modulesInfo: {
            [mockMagneticModule.moduleId]: {
              moduleId: mockMagneticModule.moduleId,
              x: MOCK_MAGNETIC_MODULE_COORDS[0],
              y: MOCK_MAGNETIC_MODULE_COORDS[1],
              z: MOCK_MAGNETIC_MODULE_COORDS[2],
              moduleDef: mockMagneticModule as any,
              nestedLabwareDisplayName: 'Source Plate',
              nestedLabwareDef: null,
              nestedLabwareId: null,
              protocolLoadOrder: 0,
              slotName: '3',
              attachedModuleMatch: null,
            },
          },
          runId: RUN_ID,
        })
      )
      .mockReturnValue(
        <div>
          mock module extra attention banner with magnetic module and TC
        </div>
      )

    const { getByText } = render()
    getByText('mock module extra attention banner with magnetic module and TC')
  })
  it('should close Labware Offset Success toast when LPC is launched', () => {
    const mockSetIsShowingLPCSuccessToast = jest.fn()
    when(mockUseLPCSuccessToast).calledWith().mockReturnValue({
      setIsShowingLPCSuccessToast: mockSetIsShowingLPCSuccessToast,
    })
    const { getByRole } = render()
    const button = getByRole('button', {
      name: 'run labware position check',
    })
    fireEvent.click(button)
    expect(mockSetIsShowingLPCSuccessToast).toHaveBeenCalledWith(false)
  })
  it('should render a disabled LPC button when a robot-side protocol analysis is not complete', () => {
    when(mockUseProtocolDetailsForRun)
      .calledWith(RUN_ID)
      .mockReturnValue({
        protocolData: null,
      } as any)
    const { getByRole } = render()
    const button = getByRole('button', {
      name: 'run labware position check',
    })
    expect(button).toBeDisabled()
  })
  it('should render a disabled LPC button when a protocol without a pipette AND without a labware is uploaded', () => {
    when(mockUseProtocolDetailsForRun)
      .calledWith(RUN_ID)
      .mockReturnValue({
        protocolData: { labware: {}, pipettes: {} },
      } as any)
    const { getByRole } = render()
    const button = getByRole('button', {
      name: 'run labware position check',
    })
    expect(button).toBeDisabled()
  })
  it('should render a disabled LPC button when robot calibration is incomplete', () => {
    when(mockUseRunCalibrationStatus)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({
        complete: false,
      })
    const { getByRole } = render()
    const button = getByRole('button', {
      name: 'run labware position check',
    })
    expect(button).toBeDisabled()
  })
  it('should render a disabled LPC button when modules are not connected', () => {
    when(mockUseUnmatchedModulesForProtocol)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({
        missingModuleIds: ['temperatureModuleV1'],
        remainingAttachedModules: [],
      })
    const { getByRole } = render()
    const button = getByRole('button', {
      name: 'run labware position check',
    })
    expect(button).toBeDisabled()
  })
  it('should render a disabled LPC button when modules are not connected and robot calibration is incomplete', () => {
    when(mockUseRunCalibrationStatus)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({
        complete: false,
      })
    when(mockUseUnmatchedModulesForProtocol)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({
        missingModuleIds: ['temperatureModuleV1'],
        remainingAttachedModules: [],
      })
    const { getByRole } = render()
    const button = getByRole('button', {
      name: 'run labware position check',
    })
    expect(button).toBeDisabled()
  })
  it('should render a disabled LPC button when a protocol does not load a tip rack', () => {
    when(mockUseProtocolDetailsForRun)
      .calledWith(RUN_ID)
      .mockReturnValue({
        protocolData: {
          labware: {
            'labware-0': {
              slot: '1',
              displayName: 'someDisplayName',
              definitionId: LABWARE_DEF_ID,
            },
          },
          labwareDefinitions: {
            [LABWARE_DEF_ID]: { parameters: { isTiprack: false } },
          },
          pipettes: {
            [PRIMARY_PIPETTE_ID]: {
              name: PRIMARY_PIPETTE_NAME,
              mount: 'left',
            },
          },
        },
      } as any)
    const { getByRole } = render()
    const button = getByRole('button', {
      name: 'run labware position check',
    })
    expect(button).toBeDisabled()
  })
  it('should render a disabled LPC button when a protocol does not include a pickUpTip', () => {
    when(mockUseProtocolDetailsForRun)
      .calledWith(RUN_ID)
      .mockReturnValue({
        protocolData: {
          labware: {
            [mockLabwarePositionCheckStepTipRack.labwareId]: {
              slot: '1',
              displayName: 'someDisplayName',
              definitionId: LABWARE_DEF_ID,
            },
          },
          labwareDefinitions: {
            [LABWARE_DEF_ID]: LABWARE_DEF,
          },
          pipettes: {
            [PRIMARY_PIPETTE_ID]: {
              name: PRIMARY_PIPETTE_NAME,
              mount: 'left',
            },
          },
          commands: [],
        },
      } as any)
    const { getByRole } = render()
    const button = getByRole('button', {
      name: 'run labware position check',
    })
    expect(button).toBeDisabled()
  })
  it('should render a get labware offset data link only when setting is true', () => {
    when(mockGetIsLabwareOffsetCodeSnippetsOn).mockReturnValue(true)
    const { getByRole } = render()
    const getOffsetDataLink = getByRole('link', {
      name: 'Get Labware Offset Data',
    })
    fireEvent.click(getOffsetDataLink)
    getByRole('button', {
      name: 'Jupyter Notebook',
    })
  })
  it('should render a proceed to run button', () => {
    const { getByRole } = render()
    getByRole('button', {
      name: 'Mock ProceedToRunButton',
    })
  })
})
