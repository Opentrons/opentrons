import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { clickButtonLabeled } from '/app/organisms/ErrorRecoveryFlows/__tests__/util'

import { RECOVERY_MAP } from '../../constants'
import { StackerReengageLatch } from '../StackerReengageLatch'

import type { Mock } from 'vitest'
import type { ComponentProps } from 'react'

describe('Render StackerReengageLatch', () => {
  let props: ComponentProps<typeof StackerReengageLatch>
  let mockHandleMotionRouting: Mock
  let mockCloseLabwareLatch: Mock
  let mockProceedNextStep: Mock
  let mockGoBackPrevStep: Mock

  beforeEach(() => {
    mockHandleMotionRouting = vi.fn(() => Promise.resolve())
    mockCloseLabwareLatch = vi.fn(() => Promise.resolve())
    mockProceedNextStep = vi.fn(() => Promise.resolve())
    mockGoBackPrevStep = vi.fn(() => Promise.resolve())

    props = {
      routeUpdateActions: {
        handleMotionRouting: mockHandleMotionRouting,
        proceedNextStep: mockProceedNextStep,
        goBackPrevStep: mockGoBackPrevStep,
      } as any,
      recoveryCommands: {
        closeLabwareLatch: mockCloseLabwareLatch,

      } as any,
      currentRecoveryOptionUtils: {
        selectedRecoveryOption: RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_RETRY.ROUTE,
      } as any,
      stepCounts: { hasRunDiverged: false },
    } as any
  })

  const render = (props: ComponentProps<typeof StackerReengageLatch>) => {
    return renderWithProviders(<StackerReengageLatch {...props} />, {
      i18nInstance: i18n,
    })[0]
  }

  it('calls proceedNextStep when primary button is clicked', async () => {
    render(props)

    clickButtonLabeled('Re-engage latch')
    expect(mockHandleMotionRouting).toHaveBeenCalledWith(
      true,
      RECOVERY_MAP.ROBOT_IN_MOTION.ROUTE
    )

    await waitFor(() => {
      expect(mockCloseLabwareLatch).toHaveBeenCalled()
    })
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

  it(`renders correct title`, () => {
    render(props)

    screen.getByText('Prepare for stacker latch to re-engage')
    screen.getByText(
      'The stacker latch will re-engage so that you can reload the stacker. Make sure that any obstructions have been cleared.'
    )
  })
})
