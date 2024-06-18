import * as React from 'react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act, screen, waitFor } from '@testing-library/react'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { mockRecoveryContentProps } from '../__fixtures__'
import {
  ErrorRecoveryContent,
  ErrorRecoveryComponent,
  useInitialPipetteHome,
  useERWizard,
} from '../ErrorRecoveryWizard'
import { RECOVERY_MAP } from '../constants'
import { BeforeBeginning } from '../BeforeBeginning'
import {
  SelectRecoveryOption,
  RetryStep,
  RetryNewTips,
  CancelRun,
  ManageTips,
} from '../RecoveryOptions'
import { RecoveryInProgress } from '../RecoveryInProgress'
import { RecoveryError } from '../RecoveryError'

import type { Mock } from 'vitest'

vi.mock('../BeforeBeginning')
vi.mock('../RecoveryOptions')
vi.mock('../RecoveryInProgress')
vi.mock('../RecoveryError')

describe('useERWizard', () => {
  it('has correct initial values', () => {
    const { result } = renderHook(() => useERWizard())
    expect(result.current.showERWizard).toBe(false)
    expect(result.current.hasLaunchedRecovery).toBe(false)
  })

  it('correctly toggles showERWizard and updates hasLaunchedRecovery as expected', async () => {
    const { result } = renderHook(() => useERWizard())

    await act(async () => {
      await result.current.toggleERWizard(true)
    })

    expect(result.current.showERWizard).toBe(true)
    expect(result.current.hasLaunchedRecovery).toBe(true)

    await act(async () => {
      await result.current.toggleERWizard(false)
    })

    expect(result.current.showERWizard).toBe(false)
    expect(result.current.hasLaunchedRecovery).toBe(false)
  })
})

const renderRecoveryContent = (
  props: React.ComponentProps<typeof ErrorRecoveryContent>
) => {
  return renderWithProviders(<ErrorRecoveryContent {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ErrorRecoveryContent', () => {
  const {
    OPTION_SELECTION,
    BEFORE_BEGINNING,
    RETRY_FAILED_COMMAND,
    ROBOT_CANCELING,
    ROBOT_RESUMING,
    ROBOT_IN_MOTION,
    ROBOT_RETRYING_STEP,
    ROBOT_PICKING_UP_TIPS,
    RETRY_NEW_TIPS,
    CANCEL_RUN,
    DROP_TIP_FLOWS,
    ERROR_WHILE_RECOVERING,
  } = RECOVERY_MAP

  let props: React.ComponentProps<typeof ErrorRecoveryContent>

  beforeEach(() => {
    props = mockRecoveryContentProps

    vi.mocked(SelectRecoveryOption).mockReturnValue(
      <div>MOCK_SELECT_RECOVERY_OPTION</div>
    )
    vi.mocked(BeforeBeginning).mockReturnValue(<div>MOCK_BEFORE_BEGINNING</div>)
    vi.mocked(RetryStep).mockReturnValue(<div>MOCK_RESUME_RUN</div>)
    vi.mocked(RecoveryInProgress).mockReturnValue(<div>MOCK_IN_PROGRESS</div>)
    vi.mocked(CancelRun).mockReturnValue(<div>MOCK_CANCEL_RUN</div>)
    vi.mocked(ManageTips).mockReturnValue(<div>MOCK_DROP_TIP_FLOWS</div>)
    vi.mocked(RetryNewTips).mockReturnValue(<div>MOCK_RETRY_NEW_TIPS</div>)
    vi.mocked(RecoveryError).mockReturnValue(<div>MOCK_RECOVERY_ERROR</div>)
  })

  it(`returns SelectRecoveryOption when the route is ${OPTION_SELECTION.ROUTE}`, () => {
    renderRecoveryContent(props)

    screen.getByText('MOCK_SELECT_RECOVERY_OPTION')
  })

  it(`returns BeforeBeginning when the route is ${BEFORE_BEGINNING.ROUTE}`, () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        route: BEFORE_BEGINNING.ROUTE,
      },
    }
    renderRecoveryContent(props)

    screen.getByText('MOCK_BEFORE_BEGINNING')
  })

  it(`returns ResumeRun when the route is ${RETRY_FAILED_COMMAND.ROUTE}`, () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        route: RETRY_FAILED_COMMAND.ROUTE,
      },
    }
    renderRecoveryContent(props)

    screen.getByText('MOCK_RESUME_RUN')
  })

  it(`returns ManageTips when the route is ${DROP_TIP_FLOWS.ROUTE}`, () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        route: DROP_TIP_FLOWS.ROUTE,
      },
    }
    renderRecoveryContent(props)

    screen.getByText('MOCK_DROP_TIP_FLOWS')
  })

  it(`returns CancelRun when the route is ${CANCEL_RUN.ROUTE}`, () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        route: CANCEL_RUN.ROUTE,
      },
    }
    renderRecoveryContent(props)

    screen.getByText('MOCK_CANCEL_RUN')
  })

  it(`returns RetryNewTips when the route is ${RETRY_NEW_TIPS.ROUTE}`, () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        route: RETRY_NEW_TIPS.ROUTE,
      },
    }
    renderRecoveryContent(props)

    screen.getByText('MOCK_RETRY_NEW_TIPS')
  })

  it(`returns RecoveryError when the route is ${ERROR_WHILE_RECOVERING.ROUTE}`, () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        route: ERROR_WHILE_RECOVERING.ROUTE,
      },
    }
    renderRecoveryContent(props)

    screen.getByText('MOCK_RECOVERY_ERROR')
  })

  it(`returns RecoveryInProgressModal when the route is ${ROBOT_CANCELING.ROUTE}`, () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        route: ROBOT_CANCELING.ROUTE,
      },
    }
    renderRecoveryContent(props)

    screen.getByText('MOCK_IN_PROGRESS')
  })

  it(`returns RecoveryInProgressModal when the route is ${ROBOT_IN_MOTION.ROUTE}`, () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        route: ROBOT_IN_MOTION.ROUTE,
      },
    }
    renderRecoveryContent(props)

    screen.getByText('MOCK_IN_PROGRESS')
  })

  it(`returns RecoveryInProgressModal when the route is ${ROBOT_RESUMING.ROUTE}`, () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        route: ROBOT_IN_MOTION.ROUTE,
      },
    }
    renderRecoveryContent(props)

    screen.getByText('MOCK_IN_PROGRESS')
  })

  it(`returns RecoveryInProgressModal when the route is ${ROBOT_RETRYING_STEP.ROUTE}`, () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        route: ROBOT_IN_MOTION.ROUTE,
      },
    }
    renderRecoveryContent(props)

    screen.getByText('MOCK_IN_PROGRESS')
  })

  it(`returns RecoveryInProgressModal when the route is ${ROBOT_PICKING_UP_TIPS.ROUTE}`, () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        route: ROBOT_PICKING_UP_TIPS.ROUTE,
      },
    }
    renderRecoveryContent(props)

    screen.getByText('MOCK_IN_PROGRESS')
  })
})

describe('useInitialPipetteHome', () => {
  let mockZHomePipetteZAxes: Mock
  let mockSetRobotInMotion: Mock
  let mockRecoveryCommands: any
  let mockRouteUpdateActions: any

  beforeEach(() => {
    mockZHomePipetteZAxes = vi.fn()
    mockSetRobotInMotion = vi.fn()

    mockSetRobotInMotion.mockResolvedValue(() => mockZHomePipetteZAxes())
    mockZHomePipetteZAxes.mockResolvedValue(() => mockSetRobotInMotion())

    mockRecoveryCommands = {
      homePipetteZAxes: mockZHomePipetteZAxes,
    } as any
    mockRouteUpdateActions = {
      setRobotInMotion: mockSetRobotInMotion,
    } as any
  })

  it('does not z-home the pipettes if error recovery was not launched', () => {
    renderHook(() =>
      useInitialPipetteHome({
        hasLaunchedRecovery: false,
        recoveryCommands: mockRecoveryCommands,
        routeUpdateActions: mockRouteUpdateActions,
      })
    )

    expect(mockSetRobotInMotion).not.toHaveBeenCalled()
  })

  it('sets the motion screen properly and z-homes all pipettes only on the initial render of Error Recovery', async () => {
    const { rerender } = renderHook(() =>
      useInitialPipetteHome({
        hasLaunchedRecovery: true,
        recoveryCommands: mockRecoveryCommands,
        routeUpdateActions: mockRouteUpdateActions,
      })
    )

    await waitFor(() => {
      expect(mockSetRobotInMotion).toHaveBeenCalledWith(true)
    })
    await waitFor(() => {
      expect(mockZHomePipetteZAxes).toHaveBeenCalledTimes(1)
    })
    await waitFor(() => {
      expect(mockSetRobotInMotion).toHaveBeenCalledWith(false)
    })

    expect(mockSetRobotInMotion.mock.invocationCallOrder[0]).toBeLessThan(
      mockZHomePipetteZAxes.mock.invocationCallOrder[0]
    )
    expect(mockZHomePipetteZAxes.mock.invocationCallOrder[0]).toBeLessThan(
      mockSetRobotInMotion.mock.invocationCallOrder[1]
    )

    rerender()

    await waitFor(() => {
      expect(mockSetRobotInMotion).toHaveBeenCalledTimes(2)
    })
    await waitFor(() => {
      expect(mockZHomePipetteZAxes).toHaveBeenCalledTimes(1)
    })
  })
})

const renderRecoveryComponent = (
  props: React.ComponentProps<typeof ErrorRecoveryComponent>
) => {
  return renderWithProviders(<ErrorRecoveryComponent {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ErrorRecoveryComponent', () => {
  let props: React.ComponentProps<typeof ErrorRecoveryComponent>

  beforeEach(() => {
    props = mockRecoveryContentProps
  })

  it('renders an intervention modal with appropriate text', () => {
    renderRecoveryComponent(props)
    screen.getByTestId('__otInterventionModal')
    screen.getByText('Recovery Mode')
    screen.getByText('View error details')
  })

  it('renders alternative header text if the recovery mode has not been launched', () => {
    props = { ...props, hasLaunchedRecovery: false }
    renderRecoveryComponent(props)
    screen.getByText('Cancel run')
  })
})
