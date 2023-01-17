import * as React from 'react'
import uniqueId from 'lodash/uniqueId'
import { mountWithStore, renderWithProviders } from '@opentrons/components'
import { act } from 'react-dom/test-utils'

import * as RobotApi from '../../../../../redux/robot-api'
import * as Sessions from '../../../../../redux/sessions'
import { mockTipLengthCalibrationSessionAttributes } from '../../../../../redux/sessions/__fixtures__'

import { useDashboardCalibrateTipLength } from '../useDashboardCalibrateTipLength'
import { tipLengthCalibrationStarted } from '../../../../../redux/analytics'
import { i18n } from '../../../../../i18n'

import type { DashboardCalTipLengthInvoker } from '../useDashboardCalibrateTipLength'

jest.mock('../../../../../redux/sessions/selectors')
jest.mock('../../../../../redux/robot-api/selectors')
jest.mock('lodash/uniqueId')

const mockUniqueId = uniqueId as jest.MockedFunction<typeof uniqueId>
const mockGetRobotSessionOfType = Sessions.getRobotSessionOfType as jest.MockedFunction<
  typeof Sessions.getRobotSessionOfType
>
const mockGetRequestById = RobotApi.getRequestById as jest.MockedFunction<
  typeof RobotApi.getRequestById
>

describe('useDashboardCalibrateTipLength hook', () => {
  let startCalibration: DashboardCalTipLengthInvoker
  let CalWizardComponent: JSX.Element | null
  const robotName = 'robotName'
  const mountString = 'left'

  const TestUseDashboardCalibrateTipLength = (): JSX.Element => {
    const [
      _startCalibration,
      _CalWizardComponent,
    ] = useDashboardCalibrateTipLength(robotName)
    React.useEffect(() => {
      startCalibration = _startCalibration
      CalWizardComponent = _CalWizardComponent
    })
    return <>{CalWizardComponent}</>
  }

  beforeEach(() => {
    let mockIdCounter = 0
    mockUniqueId.mockImplementation(() => `mockId_${mockIdCounter++}`)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('returns start callback, and no wizard if session not present', () => {
    const [, store] = renderWithProviders(
      <TestUseDashboardCalibrateTipLength />,
      {
        initialState: { robotApi: {}, sessions: {} },
        i18nInstance: i18n
      }
    )
    expect(typeof startCalibration).toBe('function')
    expect(CalWizardComponent).toBe(null)

    act(() =>
      startCalibration({
        params: { mount: mountString },
        hasBlockModalResponse: true,
      })
    )

    expect(store.dispatch).toHaveBeenCalledWith({
      ...Sessions.ensureSession(
        robotName,
        Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION,
        {
          mount: mountString,
          hasCalibrationBlock: true,
          tipRackDefinition: null,
        }
      ),
      meta: { requestId: expect.any(String) },
    })
    expect(store.dispatch).toHaveBeenCalledWith(
      tipLengthCalibrationStarted(
        'tip-length-no-protocol',
        mountString,
        true,
        'default Opentrons tip rack for pipette on mount'
      )
    )
  })

  it('wizard should appear after create request succeeds with session and close on closeWizard', () => {
    const seshId = 'fake-session-id'
    const mockTipLengthCalSession = {
      id: seshId,
      ...mockTipLengthCalibrationSessionAttributes,
      details: {
        ...mockTipLengthCalibrationSessionAttributes.details,
        currentStep: Sessions.TIP_LENGTH_STEP_CALIBRATION_COMPLETE,
      },
    }
    const { store, wrapper } = mountWithStore(
      <TestUseDashboardCalibrateTipLength />,
      {
        initialState: { robotApi: {} },
      }
    )
    mockGetRobotSessionOfType.mockReturnValue(mockTipLengthCalSession)
    mockGetRequestById.mockReturnValue({
      status: RobotApi.SUCCESS,
      response: {
        method: 'POST',
        ok: true,
        path: '/',
        status: 200,
      },
    })
    act(() =>
      startCalibration({
        params: { mount: mountString },
        hasBlockModalResponse: true,
      })
    )
    wrapper.setProps({})
    expect(CalWizardComponent).not.toBe(null)

    wrapper.find('button[aria-label="Exit"]').invoke('onClick')?.(
      {} as React.MouseEvent
    )
    wrapper.find('button[aria-label="Exit"]').invoke('onClick')?.(
      {} as React.MouseEvent
    )
    wrapper.setProps({})
    expect(store.dispatch).toHaveBeenCalledWith({
      ...Sessions.deleteSession(robotName, seshId),
      meta: { requestId: expect.any(String) },
    })
  })
})
