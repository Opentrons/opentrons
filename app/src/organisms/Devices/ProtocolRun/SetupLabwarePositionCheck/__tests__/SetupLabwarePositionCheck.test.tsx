import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { StaticRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../../i18n'
import {
  useRunQuery,
  useProtocolQuery,
  useProtocolAnalysisAsDocumentQuery,
} from '@opentrons/react-api-client'
import { useLPCSuccessToast } from '../../../hooks/useLPCSuccessToast'
import { getModuleTypesThatRequireExtraAttention } from '../../utils/getModuleTypesThatRequireExtraAttention'
import { useLaunchLPC } from '../../../../LabwarePositionCheck/useLaunchLPC'
import { getIsLabwareOffsetCodeSnippetsOn } from '../../../../../redux/config'
import {
  useLPCDisabledReason,
  useRunCalibrationStatus,
  useRunHasStarted,
  useUnmatchedModulesForProtocol,
  useRobotType,
} from '../../../hooks'
import { SetupLabwarePositionCheck } from '..'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

jest.mock('../../../../LabwarePositionCheck/useLaunchLPC')
jest.mock('../../utils/getModuleTypesThatRequireExtraAttention')
jest.mock('../../../../RunTimeControl/hooks')
jest.mock('../../../../../redux/config')
jest.mock('../../../hooks')
jest.mock('../../../hooks/useLPCSuccessToast')
jest.mock('@opentrons/react-api-client')

const mockGetModuleTypesThatRequireExtraAttention = getModuleTypesThatRequireExtraAttention as jest.MockedFunction<
  typeof getModuleTypesThatRequireExtraAttention
>
const mockUseRunHasStarted = useRunHasStarted as jest.MockedFunction<
  typeof useRunHasStarted
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
const mockUseLPCDisabledReason = useLPCDisabledReason as jest.MockedFunction<
  typeof useLPCDisabledReason
>
const mockUseLaunchLPC = useLaunchLPC as jest.MockedFunction<
  typeof useLaunchLPC
>
const mockUseRobotType = useRobotType as jest.MockedFunction<
  typeof useRobotType
>
const mockUseRunQuery = useRunQuery as jest.MockedFunction<typeof useRunQuery>
const mockUseProtocolQuery = useProtocolQuery as jest.MockedFunction<
  typeof useProtocolQuery
>
const mockUseProtocolAnalysisAsDocumentQuery = useProtocolAnalysisAsDocumentQuery as jest.MockedFunction<
  typeof useProtocolAnalysisAsDocumentQuery
>
const DISABLED_REASON = 'MOCK_DISABLED_REASON'
const ROBOT_NAME = 'otie'
const RUN_ID = '1'

const render = () => {
  return renderWithProviders(
    <StaticRouter>
      <SetupLabwarePositionCheck
        expandLabwareStep={jest.fn()}
        robotName={ROBOT_NAME}
        runId={RUN_ID}
      />
    </StaticRouter>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('SetupLabwarePositionCheck', () => {
  let mockLaunchLPC: jest.Mock

  beforeEach(() => {
    mockLaunchLPC = jest.fn()
    when(mockGetModuleTypesThatRequireExtraAttention)
      .calledWith(expect.anything())
      .mockReturnValue([])

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
    when(mockGetIsLabwareOffsetCodeSnippetsOn).mockReturnValue(false)
    when(mockUseLPCDisabledReason).mockReturnValue(null)
    when(mockUseRobotType)
      .calledWith(ROBOT_NAME)
      .mockReturnValue(FLEX_ROBOT_TYPE)
    when(mockUseLaunchLPC)
      .calledWith(RUN_ID, FLEX_ROBOT_TYPE, 'test protocol')
      .mockReturnValue({
        launchLPC: mockLaunchLPC,
        LPCWizard: <div>mock LPC Wizard</div>,
      })
    when(mockUseRunQuery).mockReturnValue({
      data: {
        data: { protocolId: 'fakeProtocolId' },
      },
    } as any)
    when(mockUseProtocolQuery).mockReturnValue({
      data: { data: { metadata: { protocolName: 'test protocol' } } },
    } as any)
    when(mockUseProtocolAnalysisAsDocumentQuery).mockReturnValue({
      data: null,
    } as any)
  })

  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should render LPC button and clicking should launch modal', () => {
    const { getByRole } = render()
    getByRole('button', {
      name: 'run labware position check',
    }).click()
    expect(mockLaunchLPC).toHaveBeenCalled()
  })
  it('should render a disabled LPC button when disabled LPC reason exists', () => {
    when(mockUseRunHasStarted).calledWith(RUN_ID).mockReturnValue(true)
    when(mockUseLPCDisabledReason).mockReturnValue(DISABLED_REASON)
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
})
