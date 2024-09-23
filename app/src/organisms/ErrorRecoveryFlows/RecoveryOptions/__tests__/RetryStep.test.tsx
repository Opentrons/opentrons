import * as React from 'react'
import { describe, it, vi, expect, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'

import { mockRecoveryContentProps } from '../../__fixtures__'
import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { RetryStep, RetryStepInfo } from '../RetryStep'
import { RECOVERY_MAP } from '../../constants'
import { SelectRecoveryOption } from '../SelectRecoveryOption'

import { clickButtonLabeled } from '../../__tests__/util'

import type { Mock } from 'vitest'

vi.mock('/app/molecules/Command')
vi.mock('../SelectRecoveryOption')

const render = (props: React.ComponentProps<typeof RetryStep>) => {
  return renderWithProviders(<RetryStep {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const renderRetryStepInfo = (
  props: React.ComponentProps<typeof RetryStepInfo>
) => {
  return renderWithProviders(<RetryStepInfo {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('RetryStep', () => {
  let props: React.ComponentProps<typeof RetryStep>

  beforeEach(() => {
    props = {
      ...mockRecoveryContentProps,
    }

    vi.mocked(SelectRecoveryOption).mockReturnValue(
      <div>MOCK_SELECT_RECOVERY_OPTION</div>
    )
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it(`renders RetryStepInfo when step is ${RECOVERY_MAP.RETRY_FAILED_COMMAND.STEPS.CONFIRM_RETRY}`, () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        step: RECOVERY_MAP.RETRY_FAILED_COMMAND.STEPS.CONFIRM_RETRY,
      },
    }
    render(props)
    screen.getByText('Retry step')
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
})

describe('RetryStepInfo', () => {
  let props: React.ComponentProps<typeof RetryStepInfo>
  let mockhandleMotionRouting: Mock
  let mockRetryFailedCommand: Mock
  let mockResumeRun: Mock

  beforeEach(() => {
    mockhandleMotionRouting = vi.fn(() => Promise.resolve())
    mockRetryFailedCommand = vi.fn(() => Promise.resolve())
    mockResumeRun = vi.fn()

    props = {
      ...mockRecoveryContentProps,
      routeUpdateActions: {
        handleMotionRouting: mockhandleMotionRouting,
      } as any,
      recoveryCommands: {
        retryFailedCommand: mockRetryFailedCommand,
        resumeRun: mockResumeRun,
      } as any,
    }
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders the component with the correct text', () => {
    renderRetryStepInfo(props)
    screen.getByText('Retry step')
    screen.queryByText(
      'First, take any necessary actions to prepare the robot to retry the failed step.'
    )
    screen.queryByText('Then, close the robot door before proceeding.')
  })

  it('calls the correct routeUpdateActions and recoveryCommands in the correct order when the primary button is clicked', async () => {
    renderRetryStepInfo(props)
    clickButtonLabeled('Retry now')

    await waitFor(() => {
      expect(mockhandleMotionRouting).toHaveBeenCalledWith(
        true,
        RECOVERY_MAP.ROBOT_RETRYING_STEP.ROUTE
      )
    })
    await waitFor(() => {
      expect(mockRetryFailedCommand).toHaveBeenCalled()
    })
    await waitFor(() => {
      expect(mockResumeRun).toHaveBeenCalled()
    })

    expect(mockhandleMotionRouting.mock.invocationCallOrder[0]).toBeLessThan(
      mockRetryFailedCommand.mock.invocationCallOrder[0]
    )
    expect(mockRetryFailedCommand.mock.invocationCallOrder[0]).toBeLessThan(
      mockResumeRun.mock.invocationCallOrder[0]
    )
  })
})
