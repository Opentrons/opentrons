import { screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { mockRecoveryContentProps } from '../../__fixtures__'
import { clickButtonLabeled } from '../../__tests__/util'
import { RECOVERY_MAP } from '../../constants'
import { RetryWithSameTips } from '../RetryWithSameTips'

import type { Mock } from 'vitest'
import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof RetryWithSameTips>) => {
  return renderWithProviders(<RetryWithSameTips {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('RetryWithSameTips', () => {
  let props: ComponentProps<typeof RetryWithSameTips>
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
    render(props)
    screen.getByText('Retry with same tips')
    screen.queryByText('The robot will retry the step with the same tips.')
    screen.queryByText('Close the robot door before proceeding.')
  })

  it('calls the correct routeUpdateActions and recoveryCommands in the correct order when the primary button is clicked', async () => {
    render(props)

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
