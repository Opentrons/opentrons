import * as React from 'react'
import uniqueId from 'lodash/uniqueId'
import { mountWithStore, renderWithProviders } from '@opentrons/components'
import { act } from 'react-dom/test-utils'

import { LoadingState } from '../../../../../organisms/CalibrationPanels'
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
        i18nInstance: i18n,
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
        mountString,
        true,
        'default Opentrons tip rack for pipette on mount'
      )
    )
  })

  it('shows AskForCalibrationBlockModal when required', () => {
    const { wrapper } = mountWithStore(<TestUseDashboardCalibrateTipLength />, {
      initialState: { robotApi: {} },
    })
    act(() =>
      startCalibration({
        params: { mount: mountString },
        hasBlockModalResponse: null,
      })
    )

    wrapper.setProps({})
    expect(CalWizardComponent).not.toBe(null)
    expect(
      wrapper.containsMatchingElement(<button>Use trash bin</button>)
    ).toBeTruthy()
    expect(
      wrapper.containsMatchingElement(<button>Use Calibration Block</button>)
    ).toBeTruthy()
    const useBlockButton = wrapper.findWhere(
      n => n.type() === 'button' && n.text() === 'Use Calibration Block'
    )
    useBlockButton.simulate('click')

    wrapper.setProps({})
    expect(
      wrapper.containsMatchingElement(<button>Use trash bin</button>)
    ).toBeFalsy()
    expect(
      wrapper.containsMatchingElement(<button>Use Calibration Block</button>)
    ).toBeFalsy()
  })

  it('closes AskForCalibrationBlockModal when exit is clicked', () => {
    const { wrapper } = mountWithStore(<TestUseDashboardCalibrateTipLength />, {
      initialState: { robotApi: {} },
    })
    act(() =>
      startCalibration({
        params: { mount: mountString },
        hasBlockModalResponse: null,
      })
    )

    wrapper.setProps({})
    expect(CalWizardComponent).not.toBe(null)
    expect(
      wrapper.containsMatchingElement(<button>Use trash bin</button>)
    ).toBeTruthy()
    expect(
      wrapper.containsMatchingElement(<button>Use Calibration Block</button>)
    ).toBeTruthy()

    wrapper.find('button[aria-label="Exit"]').invoke('onClick')?.(
      {} as React.MouseEvent
    )
    wrapper.setProps({})
    expect(
      wrapper.containsMatchingElement(<button>Use trash bin</button>)
    ).toBeFalsy()
    expect(
      wrapper.containsMatchingElement(<button>Use Calibration Block</button>)
    ).toBeFalsy()
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

  it('loading state modal should appear while session is being created', () => {
    const seshId = 'fake-session-id'
    const mockDeckCalSession = {
      id: seshId,
      ...mockTipLengthCalibrationSessionAttributes,
      details: {
        ...mockTipLengthCalibrationSessionAttributes.details,
        currentStep: Sessions.TIP_LENGTH_STEP_SESSION_STARTED,
      },
    }
    const { wrapper } = mountWithStore(<TestUseDashboardCalibrateTipLength />, {
      initialState: { robotApi: {} },
    })
    mockGetRobotSessionOfType.mockReturnValue(mockDeckCalSession)
    mockGetRequestById.mockReturnValue({
      status: RobotApi.PENDING,
    })
    act(() =>
      startCalibration({
        params: { mount: mountString },
        hasBlockModalResponse: null,
      })
    )
    wrapper.setProps({})
    expect(CalWizardComponent).not.toBe(null)
    expect(LoadingState).not.toBe(null)
  })
})
