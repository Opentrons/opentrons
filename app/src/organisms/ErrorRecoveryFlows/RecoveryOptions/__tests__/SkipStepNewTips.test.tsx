import * as React from 'react'
import { describe, it, vi, expect, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'

import { mockRecoveryContentProps } from '../../__fixtures__'
import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { SkipStepNewTips, SkipStepWithNewTips } from '../SkipStepNewTips'
import { RECOVERY_MAP } from '../../constants'
import { SelectRecoveryOption } from '../SelectRecoveryOption'
import { clickButtonLabeled } from '../../__tests__/util'

import type { Mock } from 'vitest'

vi.mock('/app/molecules/Command')
vi.mock('../SelectRecoveryOption')
vi.mock('../../shared', async () => {
  const actual = await vi.importActual('../../shared')
  return {
    ...actual,
    ReplaceTips: vi.fn(() => <div>MOCK_REPLACE_TIPS</div>),
    SelectTips: vi.fn(() => <div>MOCK_SELECT_TIPS</div>),
  }
})

const render = (props: React.ComponentProps<typeof SkipStepNewTips>) => {
  return renderWithProviders(<SkipStepNewTips {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const renderSkipStepWithNewTips = (
  props: React.ComponentProps<typeof SkipStepWithNewTips>
) => {
  return renderWithProviders(<SkipStepWithNewTips {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('SkipStepNewTips', () => {
  let props: React.ComponentProps<typeof SkipStepNewTips>
  let mockProceedToRouteAndStep: Mock

  beforeEach(() => {
    mockProceedToRouteAndStep = vi.fn()

    props = {
      ...mockRecoveryContentProps,
      routeUpdateActions: {
        proceedToRouteAndStep: mockProceedToRouteAndStep,
      } as any,
    }

    vi.mocked(SelectRecoveryOption).mockReturnValue(
      <div>MOCK_SELECT_RECOVERY_OPTION</div>
    )
  })

  it(`renders ReplaceTips when step is ${RECOVERY_MAP.SKIP_STEP_WITH_NEW_TIPS.STEPS.REPLACE_TIPS}`, () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        step: RECOVERY_MAP.SKIP_STEP_WITH_NEW_TIPS.STEPS.REPLACE_TIPS,
      },
    }
    render(props)
    screen.getByText('MOCK_REPLACE_TIPS')
  })

  it(`renders SelectTips when step is ${RECOVERY_MAP.SKIP_STEP_WITH_NEW_TIPS.STEPS.SELECT_TIPS}`, () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        step: RECOVERY_MAP.SKIP_STEP_WITH_NEW_TIPS.STEPS.SELECT_TIPS,
      },
    }
    render(props)
    screen.getByText('MOCK_SELECT_TIPS')
  })

  it(`renders SkipStepWithNewTips when step is ${RECOVERY_MAP.SKIP_STEP_WITH_NEW_TIPS.STEPS.SKIP}`, () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        step: RECOVERY_MAP.SKIP_STEP_WITH_NEW_TIPS.STEPS.SKIP,
      },
    }
    render(props)
    screen.getByText('Skip to next step with new tips')
  })

  it('renders SelectRecoveryOption as a fallback', () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        step: 'UNKNOWN_STEP' as any,
      },
    }
    render(props)
    screen.getByText('MOCK_SELECT_RECOVERY_OPTION')
  })

  it(`proceeds to ${RECOVERY_MAP.DROP_TIP_FLOWS.ROUTE} route and ${RECOVERY_MAP.DROP_TIP_FLOWS.STEPS.BEFORE_BEGINNING} step when step is ${RECOVERY_MAP.SKIP_STEP_WITH_NEW_TIPS.STEPS.DROP_TIPS}`, () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        step: RECOVERY_MAP.SKIP_STEP_WITH_NEW_TIPS.STEPS.DROP_TIPS,
      },
    }
    render(props)
    expect(mockProceedToRouteAndStep).toHaveBeenCalledWith(
      RECOVERY_MAP.DROP_TIP_FLOWS.ROUTE,
      RECOVERY_MAP.DROP_TIP_FLOWS.STEPS.BEFORE_BEGINNING
    )
  })
})

describe('SkipStepWithNewTips', () => {
  let props: React.ComponentProps<typeof SkipStepWithNewTips>
  let mockhandleMotionRouting: Mock
  let mockSkipFailedCommand: Mock

  beforeEach(() => {
    mockhandleMotionRouting = vi.fn(() => Promise.resolve())
    mockSkipFailedCommand = vi.fn(() => Promise.resolve())

    props = {
      ...mockRecoveryContentProps,
      routeUpdateActions: {
        handleMotionRouting: mockhandleMotionRouting,
      } as any,
      recoveryCommands: {
        skipFailedCommand: mockSkipFailedCommand,
      } as any,
    }
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders the component with the correct text', () => {
    renderSkipStepWithNewTips(props)
    screen.getByText('Skip to next step with new tips')
    screen.queryByText(
      'The failed dispense step will not be completed. The run will continue from the next step.'
    )
    screen.queryByText('Close the robot door before proceeding.')
  })

  it('calls the correct routeUpdateActions and recoveryCommands in the correct order when the primary button is clicked', async () => {
    renderSkipStepWithNewTips(props)
    clickButtonLabeled('Continue run now')

    await waitFor(() => {
      expect(mockhandleMotionRouting).toHaveBeenCalledWith(
        true,
        RECOVERY_MAP.ROBOT_SKIPPING_STEP.ROUTE
      )
    })
    await waitFor(() => {
      expect(mockSkipFailedCommand).toHaveBeenCalled()
    })

    expect(mockhandleMotionRouting.mock.invocationCallOrder[0]).toBeLessThan(
      mockSkipFailedCommand.mock.invocationCallOrder[0]
    )
  })
})
