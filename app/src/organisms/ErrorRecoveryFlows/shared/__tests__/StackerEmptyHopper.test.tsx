import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { clickButtonLabeled } from '/app/organisms/ErrorRecoveryFlows/__tests__/util'

import { RECOVERY_MAP } from '../../constants'
import { StackerEmptyHopper } from '../StackerEmptyHopper'

import type { Mock } from 'vitest'
import type { ComponentProps } from 'react'

describe('Render StackerEmptyHopper', () => {
  let props: ComponentProps<typeof StackerEmptyHopper>
  let mockHandleMotionRouting: Mock
  let mockSkipFailedCommand: Mock
  let mockProceedNextStep: Mock
  let mockGoBackPrevStep: Mock

  beforeEach(() => {
    mockHandleMotionRouting = vi.fn(() => Promise.resolve())
    mockSkipFailedCommand = vi.fn(() => Promise.resolve())
    mockProceedNextStep = vi.fn(() => Promise.resolve())
    mockGoBackPrevStep = vi.fn(() => Promise.resolve())

    props = {
      routeUpdateActions: {
        handleMotionRouting: mockHandleMotionRouting,
        proceedNextStep: mockProceedNextStep,
        goBackPrevStep: mockGoBackPrevStep,
      } as any,
      recoveryCommands: {
        skipFailedCommand: mockSkipFailedCommand,
      } as any,
      currentRecoveryOptionUtils: {
        selectedRecoveryOption: RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_RETRY.ROUTE,
      } as any,
      stepCounts: { hasRunDiverged: false },
    } as any
  })

  const render = (props: ComponentProps<typeof StackerEmptyHopper>) => {
    return renderWithProviders(<StackerEmptyHopper {...props} />, {
      i18nInstance: i18n,
    })[0]
  }

  it('calls proceedNextStep when primary button is clicked', async () => {
    render(props)

    clickButtonLabeled('Continue')

    await waitFor(() => {
      expect(mockProceedNextStep).toHaveBeenCalled()
    })
  })

  it('calls goBackPrevStep when secondary button is clicked', async () => {
    render(props)

    clickButtonLabeled('Go back')

    await waitFor(() => {
      expect(mockGoBackPrevStep).toHaveBeenCalled()
    })
  })

  it.each([
    RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_RETRY.STEPS.EMPTY_STACKER,
    RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.STEPS.EMPTY_STACKER,
  ])(`renders correct title for step $step`, step => {
    props.recoveryMap = {
      ...props.recoveryMap,
      route: RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_RETRY.ROUTE,
      step: step,
    }
    render(props)

    screen.getByText('Empty stacker of labware above latch')
    screen.getByText('Empty the stacker of all labware above the latch.')
    screen.getByText(
      'Labware stuck on the latch will be retrieved later in recovery.'
    )
  })

  it.each([
    RECOVERY_MAP.STACKER_STALLED_RETRY.STEPS.EMPTY_STACKER,
    RECOVERY_MAP.STACKER_STALLED_SKIP.STEPS.EMPTY_STACKER,
  ])(`renders correct title for step $step`, step => {
    props.recoveryMap = {
      ...props.recoveryMap,
      route: RECOVERY_MAP.STACKER_STALLED_SKIP.ROUTE,
      step: step,
    }
    render(props)

    screen.getByText('Empty stacker of labware above latch')
    screen.getByText('Empty the stacker of all labware above the latch.')
    screen.getByText('Close the robot and stacker door before proceeding.')
  })
})
