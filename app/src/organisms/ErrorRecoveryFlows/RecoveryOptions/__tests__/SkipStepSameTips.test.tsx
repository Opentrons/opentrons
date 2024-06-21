import * as React from 'react'
import { describe, it, vi, expect, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'

import { mockRecoveryContentProps } from '../../__fixtures__'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
import { SkipStepSameTips, SkipStepSameTipsInfo } from '../SkipStepSameTips'
import { RECOVERY_MAP } from '../../constants'
import { SelectRecoveryOption } from '../SelectRecoveryOption'

import type { Mock } from 'vitest'

vi.mock('../../../../molecules/Command')
vi.mock('../SelectRecoveryOption')

const render = (props: React.ComponentProps<typeof SkipStepSameTips>) => {
  return renderWithProviders(<SkipStepSameTips {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const renderSkipStepSameTipsInfo = (
  props: React.ComponentProps<typeof SkipStepSameTipsInfo>
) => {
  return renderWithProviders(<SkipStepSameTipsInfo {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('SkipStepSameTips', () => {
  let props: React.ComponentProps<typeof SkipStepSameTips>

  beforeEach(() => {
    props = {
      ...mockRecoveryContentProps,
    }

    vi.mocked(SelectRecoveryOption).mockReturnValue(
      <div>MOCK_SELECT_RECOVERY_OPTION</div>
    )
  })

  it(`renders SkipStepSameTipsInfo when step is ${RECOVERY_MAP.SKIP_STEP_WITH_SAME_TIPS.STEPS.SKIP}`, () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        step: RECOVERY_MAP.SKIP_STEP_WITH_SAME_TIPS.STEPS.SKIP,
      },
    }
    render(props)
    screen.getByText('Skip to next step with same tips')
  })

  it('renders SelectRecoveryOption as a fallback', () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        step: 'UNKNOWN_STEP',
      },
    }
    render(props)
    screen.getByText('MOCK_SELECT_RECOVERY_OPTION')
  })
})

describe('SkipStepSameTipsInfo', () => {
  let props: React.ComponentProps<typeof SkipStepSameTipsInfo>
  let mockSetRobotInMotion: Mock
  let mockSkipFailedCommand: Mock
  let mockResumeRun: Mock

  beforeEach(() => {
    mockSetRobotInMotion = vi.fn(() => Promise.resolve())
    mockSkipFailedCommand = vi.fn(() => Promise.resolve())
    mockResumeRun = vi.fn()

    props = {
      ...mockRecoveryContentProps,
      routeUpdateActions: {
        setRobotInMotion: mockSetRobotInMotion,
      } as any,
      recoveryCommands: {
        skipFailedCommand: mockSkipFailedCommand,
        resumeRun: mockResumeRun,
      } as any,
    }
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders the component with the correct text', () => {
    renderSkipStepSameTipsInfo(props)
    screen.getByText('Skip to next step with same tips')
    screen.queryByText(
      'The failed dispense step will not be completed. The run will continue from the next step.'
    )
    screen.queryByText('Close the robot door before proceeding.')
  })

  it('calls the correct routeUpdateActions and recoveryCommands in the correct order when the primary button is clicked', async () => {
    renderSkipStepSameTipsInfo(props)
    fireEvent.click(screen.getByRole('button', { name: 'Continue run now' }))

    await waitFor(() => {
      expect(mockSetRobotInMotion).toHaveBeenCalledWith(
        true,
        RECOVERY_MAP.ROBOT_SKIPPING_STEP.ROUTE
      )
    })
    await waitFor(() => {
      expect(mockSkipFailedCommand).toHaveBeenCalled()
    })
    await waitFor(() => {
      expect(mockResumeRun).toHaveBeenCalled()
    })

    expect(mockSetRobotInMotion.mock.invocationCallOrder[0]).toBeLessThan(
      mockSkipFailedCommand.mock.invocationCallOrder[0]
    )
    expect(mockSkipFailedCommand.mock.invocationCallOrder[0]).toBeLessThan(
      mockResumeRun.mock.invocationCallOrder[0]
    )
  })
})
