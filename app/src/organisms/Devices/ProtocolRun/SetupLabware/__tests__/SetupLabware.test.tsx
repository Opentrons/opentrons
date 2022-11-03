import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { StaticRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../../i18n'
import { useLPCSuccessToast } from '../../../../ProtocolSetup/hooks'
import { LabwarePositionCheck } from '../../../../LabwarePositionCheck'
import { getModuleTypesThatRequireExtraAttention } from '../../../../ProtocolSetup/RunSetupCard/LabwareSetup/utils/getModuleTypesThatRequireExtraAttention'
import {
  getIsLabwareOffsetCodeSnippetsOn,
  useFeatureFlag,
} from '../../../../../redux/config'
import {
  useProtocolDetailsForRun,
  useRunCalibrationStatus,
  useRunHasStarted,
  useUnmatchedModulesForProtocol,
} from '../../../hooks'
import { SetupLabwareList } from '../SetupLabwareList'
import { SetupLabwareMap } from '../SetupLabwareMap'
import { SetupLabware } from '..'

jest.mock('../SetupLabwareList')
jest.mock('../SetupLabwareMap')
jest.mock('../../../../ProtocolSetup/hooks')
jest.mock('../../../../LabwarePositionCheck')
jest.mock(
  '../../../../ProtocolSetup/RunSetupCard/LabwareSetup/utils/getModuleTypesThatRequireExtraAttention'
)
jest.mock('../../../../RunTimeControl/hooks')
jest.mock('../../../../../redux/config')
jest.mock('../../../hooks')

const mockUseFeatureFlag = useFeatureFlag as jest.MockedFunction<
  typeof useFeatureFlag
>
const mockGetModuleTypesThatRequireExtraAttention = getModuleTypesThatRequireExtraAttention as jest.MockedFunction<
  typeof getModuleTypesThatRequireExtraAttention
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
const mockSetupLabwareList = SetupLabwareList as jest.MockedFunction<
  typeof SetupLabwareList
>
const mockSetupLabwareMap = SetupLabwareMap as jest.MockedFunction<
  typeof SetupLabwareMap
>

const ROBOT_NAME = 'otie'
const RUN_ID = '1'
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
        robotName={ROBOT_NAME}
        runId={RUN_ID}
        protocolRunHeaderRef={null}
        expandStep={jest.fn()}
        nextStep={'liquid_setup_step'}
      />
    </StaticRouter>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('SetupLabwareMap', () => {
  beforeEach(() => {
    when(mockGetModuleTypesThatRequireExtraAttention)
      .calledWith(expect.anything())
      .mockReturnValue([])

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
    when(mockUseFeatureFlag)
      .calledWith('enableManualDeckStateModification')
      .mockReturnValue(false)
    when(mockSetupLabwareMap).mockReturnValue(<div>mock setup labware map</div>)
    when(mockSetupLabwareList).mockReturnValue(
      <div> mock setup labware list</div>
    )
    when(mockUseFeatureFlag)
      .calledWith('enableLiquidSetup')
      .mockReturnValue(false)
  })

  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should render the map view when ff is turned off', () => {
    const { getByText } = render()
    getByText('mock setup labware map')
  })

  it('should render the list view when ff is turned off, clicking the toggle button will turn to map view', () => {
    when(mockUseFeatureFlag)
      .calledWith('enableLiquidSetup')
      .mockReturnValue(true)
    const { getByText, getByRole } = render()
    getByText('mock setup labware list')
    getByRole('button', { name: 'List View' })
    const mapView = getByRole('button', { name: 'Map View' })
    fireEvent.click(mapView)
    getByText('mock setup labware map')
  })

  it.todo(
    'should render the Labware Position Check and curren offset data text'
  )
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
})
