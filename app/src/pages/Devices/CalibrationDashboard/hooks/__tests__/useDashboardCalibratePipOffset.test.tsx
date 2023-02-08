import * as React from 'react'
import uniqueId from 'lodash/uniqueId'
import { mountWithStore, renderWithProviders } from '@opentrons/components'
import { act } from 'react-dom/test-utils'

import { LoadingState } from '../../../../../organisms/CalibrationPanels'
import * as RobotApi from '../../../../../redux/robot-api'
import * as Sessions from '../../../../../redux/sessions'
import { mockPipetteOffsetCalibrationSessionAttributes } from '../../../../../redux/sessions/__fixtures__'

import { useDashboardCalibratePipOffset } from '../useDashboardCalibratePipOffset'
import { pipetteOffsetCalibrationStarted } from '../../../../../redux/analytics'

import type { DashboardCalOffsetInvoker } from '../useDashboardCalibratePipOffset'
import { i18n } from '../../../../../i18n'

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

describe('useDashboardCalibratePipOffset hook', () => {
  let startCalibration: DashboardCalOffsetInvoker
  let CalWizardComponent: JSX.Element | null
  const robotName = 'robotName'
  const mountString = 'left'
  const onComplete = jest.fn()

  const TestUseDashboardCalibratePipOffset = (): JSX.Element => {
    const [
      _startCalibration,
      _CalWizardComponent,
    ] = useDashboardCalibratePipOffset(robotName, onComplete)
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
      <TestUseDashboardCalibratePipOffset />,
      {
        initialState: { robotApi: {}, sessions: {} },
        i18nInstance: i18n,
      }
    )
    expect(typeof startCalibration).toBe('function')
    expect(CalWizardComponent).toBe(null)

    act(() =>
      startCalibration({
        params: { mount: mountString },
      })
    )

    expect(store.dispatch).toHaveBeenCalledWith({
      ...Sessions.ensureSession(
        robotName,
        Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION,
        {
          mount: mountString,
          shouldRecalibrateTipLength: false,
          hasCalibrationBlock: false,
          tipRackDefinition: null,
        }
      ),
      meta: { requestId: expect.any(String) },
    })
    expect(store.dispatch).toHaveBeenCalledWith(
      pipetteOffsetCalibrationStarted(mountString, false, false, null)
    )
  })

  it('wizard should appear after create request succeeds with session and close on closeWizard', () => {
    const seshId = 'fake-session-id'
    const mockPipOffsetCalSession = {
      id: seshId,
      ...mockPipetteOffsetCalibrationSessionAttributes,
      details: {
        ...mockPipetteOffsetCalibrationSessionAttributes.details,
        currentStep: Sessions.PIP_OFFSET_STEP_CALIBRATION_COMPLETE,
      },
    }
    const { store, wrapper } = mountWithStore(
      <TestUseDashboardCalibratePipOffset />,
      {
        initialState: { robotApi: {} },
      }
    )
    mockGetRobotSessionOfType.mockReturnValue(mockPipOffsetCalSession)
    mockGetRequestById.mockReturnValue({
      status: RobotApi.SUCCESS,
      response: {
        method: 'POST',
        ok: true,
        path: '/',
        status: 200,
      },
    })
    act(() => startCalibration({ params: { mount: mountString } }))
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
    mockGetRobotSessionOfType.mockReturnValue(null)
    wrapper.setProps({})
    expect(CalWizardComponent).toBe(null)
    expect(onComplete).toHaveBeenCalled()
  })

  it('loading state modal should appear while session is being created', () => {
    const seshId = 'fake-session-id'
    const mockDeckCalSession = {
      id: seshId,
      ...mockPipetteOffsetCalibrationSessionAttributes,
      details: {
        ...mockPipetteOffsetCalibrationSessionAttributes.details,
        currentStep: Sessions.PIP_OFFSET_STEP_SESSION_STARTED,
      },
    }
    const { wrapper } = mountWithStore(<TestUseDashboardCalibratePipOffset />, {
      initialState: { robotApi: {} },
    })
    mockGetRobotSessionOfType.mockReturnValue(mockDeckCalSession)
    mockGetRequestById.mockReturnValue({
      status: RobotApi.PENDING,
    })
    act(() => startCalibration({ params: { mount: mountString } }))
    wrapper.setProps({})
    expect(CalWizardComponent).not.toBe(null)
    expect(LoadingState).not.toBe(null)
  })
})
