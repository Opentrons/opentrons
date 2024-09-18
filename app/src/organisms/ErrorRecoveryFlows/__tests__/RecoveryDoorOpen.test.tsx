import * as React from 'react'
import { describe, it, beforeEach, vi, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { RUN_STATUS_AWAITING_RECOVERY_PAUSED } from '@opentrons/api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { mockRecoveryContentProps } from '../__fixtures__'
import { i18n } from '/app/i18n'
import { RecoveryDoorOpen } from '../RecoveryDoorOpen'

import type { Mock } from 'vitest'
import { clickButtonLabeled } from './util'

const render = (props: React.ComponentProps<typeof RecoveryDoorOpen>) => {
  return renderWithProviders(<RecoveryDoorOpen {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('RecoveryDoorOpen', () => {
  let props: React.ComponentProps<typeof RecoveryDoorOpen>
  let mockResumeRecovery: Mock

  beforeEach(() => {
    mockResumeRecovery = vi.fn()
    props = {
      ...mockRecoveryContentProps,
      recoveryActionMutationUtils: {
        resumeRecovery: mockResumeRecovery,
        isResumeRecoveryLoading: false,
      },
      runStatus: RUN_STATUS_AWAITING_RECOVERY_PAUSED,
    }
  })

  it('renders the correct content', () => {
    render(props)

    screen.getByTestId('recovery_door_alert_icon')
    screen.getByText('Robot door is open')
    screen.getByText(
      'Close the robot door, and then resume the recovery action.'
    )
  })

  it(`calls resumeRecovery when the primary button is clicked and the run status is ${RUN_STATUS_AWAITING_RECOVERY_PAUSED}`, () => {
    render(props)

    clickButtonLabeled('Resume')

    expect(mockResumeRecovery).toHaveBeenCalledTimes(1)
  })
})
