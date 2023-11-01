import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { StaticRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../../i18n'
import { useLPCSuccessToast } from '../../../hooks/useLPCSuccessToast'
import { LabwarePositionCheck } from '../../../../LabwarePositionCheck'
import { getModuleTypesThatRequireExtraAttention } from '../../utils'
import { getIsLabwareOffsetCodeSnippetsOn } from '../../../../../redux/config'
import {
  useLPCDisabledReason,
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
jest.mock('../../../../LabwarePositionCheck')
jest.mock('../../utils/getModuleTypesThatRequireExtraAttention')
jest.mock('../../../../RunTimeControl/hooks')
jest.mock('../../../../../redux/config')
jest.mock('../../../hooks')
jest.mock('../../../hooks/useLPCSuccessToast')

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
const mockUseLPCDisabledReason = useLPCDisabledReason as jest.MockedFunction<
  typeof useLPCDisabledReason
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

describe('SetupLabware', () => {
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
    when(mockSetupLabwareMap).mockReturnValue(<div>mock setup labware map</div>)
    when(mockSetupLabwareList).mockReturnValue(
      <div> mock setup labware list</div>
    )
    when(mockUseLPCDisabledReason).mockReturnValue(null)
  })

  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should render the list view, clicking the toggle button will turn to map view', () => {
    const { getByText, getByRole } = render()
    getByText('mock setup labware list')
    getByRole('button', { name: 'List View' })
    const mapView = getByRole('button', { name: 'Map View' })
    fireEvent.click(mapView)
    getByText('mock setup labware map')
  })
})
