import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { clickButtonLabeled } from '/app/organisms/ErrorRecoveryFlows/__tests__/util'

import { RECOVERY_MAP } from '../../constants'
import { StackerHomeShuttle } from '../StackerHomeShuttle'

import type { Mock } from 'vitest'
import type { ComponentProps } from 'react'

describe('Render StackerHomeShuttle', () => {
  let props: ComponentProps<typeof StackerHomeShuttle>
  let mockHandleMotionRouting: Mock
  let mockHomeShuttle: Mock
  let mockProceedNextStep: Mock
  let mockGoBackPrevStep: Mock

  beforeEach(() => {
    mockHandleMotionRouting = vi.fn(() => Promise.resolve())
    mockHomeShuttle = vi.fn(() => Promise.resolve())
    mockProceedNextStep = vi.fn(() => Promise.resolve())
    mockGoBackPrevStep = vi.fn(() => Promise.resolve())

    props = {
      routeUpdateActions: {
        handleMotionRouting: mockHandleMotionRouting,
        proceedNextStep: mockProceedNextStep,
        goBackPrevStep: mockGoBackPrevStep,
      } as any,
      recoveryCommands: {
        homeShuttle: mockHomeShuttle,
      } as any,
      currentRecoveryOptionUtils: {
        selectedRecoveryOption: RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_RETRY.ROUTE,
      } as any,
      stepCounts: { hasRunDiverged: false },
      recoveryMap: {
        route: RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_RETRY.ROUTE,
        step:
          RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_RETRY.STEPS
            .PREPARE_TRACK_FOR_HOMING,
      },
    } as any
  })

  const render = (props: ComponentProps<typeof StackerHomeShuttle>) => {
    return renderWithProviders(<StackerHomeShuttle {...props} />, {
      i18nInstance: i18n,
    })[0]
  }

  it('calls proceedNextStep when primary button is clicked', async () => {
    render(props)

    clickButtonLabeled('Home now')

    await waitFor(() => {
      expect(mockHandleMotionRouting).toHaveBeenNthCalledWith(1, true)
    })
    await waitFor(() => {
      expect(mockHomeShuttle).toHaveBeenCalled()
    })
    await waitFor(() => {
      expect(mockHandleMotionRouting).toHaveBeenNthCalledWith(2, false)
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

  it.each([
    {
      route: RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_RETRY.ROUTE,
      step:
        RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_RETRY.STEPS.PREPARE_TRACK_FOR_HOMING,
    },
    {
      route: RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.ROUTE,
      step:
        RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.STEPS.PREPARE_TRACK_FOR_HOMING,
    },
    {
      route: RECOVERY_MAP.STACKER_SHUTTLE_MISSING_RETRY.ROUTE,
      step:
        RECOVERY_MAP.STACKER_SHUTTLE_MISSING_RETRY.STEPS
          .PREPARE_TRACK_FOR_HOMING,
    },
    {
      route: RECOVERY_MAP.STACKER_STALLED_RETRY.ROUTE,
      step: RECOVERY_MAP.STACKER_STALLED_RETRY.STEPS.PREPARE_TRACK_FOR_HOMING,
    },
    {
      route: RECOVERY_MAP.STACKER_STALLED_SKIP.ROUTE,
      step: RECOVERY_MAP.STACKER_STALLED_SKIP.STEPS.PREPARE_TRACK_FOR_HOMING,
    },
  ])(`renders correct title for route $route step $step`, ({ route, step }) => {
    props.recoveryMap = {
      route: route,
      step: step,
    }
    render(props)

    screen.getByText('Prepare track for homing')
    screen.getByText(
      'Carefully clear the track of any dislodged labware or obstructions.'
    )
    screen.getByText('Close the robot door before proceeding.')
  })

  it.each([
    {
      route: RECOVERY_MAP.STACKER_STALLED_RETRY.ROUTE,
      step:
        RECOVERY_MAP.STACKER_STALLED_RETRY.STEPS.CLEAR_TRACK_OF_OBSTRUCTIONS,
    },
    {
      route: RECOVERY_MAP.STACKER_STALLED_SKIP.ROUTE,
      step: RECOVERY_MAP.STACKER_STALLED_SKIP.STEPS.CLEAR_TRACK_OF_OBSTRUCTIONS,
    },
  ])(`renders correct title for route $route step $step`, ({ route, step }) => {
    props.recoveryMap = {
      route: route,
      step: step,
    }
    render(props)

    screen.getByText('Clear track of obstructions')
    screen.getByText(
      'Carefully clear the track of any dislodged labware or obstructions.'
    )
    screen.getByText('Close the robot and stacker door before proceeding.')
  })
})
