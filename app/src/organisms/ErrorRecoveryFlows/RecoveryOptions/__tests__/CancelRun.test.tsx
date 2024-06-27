import * as React from 'react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
import { mockRecoveryContentProps } from '../../__fixtures__'
import { CancelRun } from '../CancelRun'
import { RECOVERY_MAP } from '../../constants'

import type { Mock } from 'vitest'

const render = (props: React.ComponentProps<typeof CancelRun>) => {
  return renderWithProviders(<CancelRun {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('RecoveryFooterButtons', () => {
  const { CANCEL_RUN, ROBOT_CANCELING, DROP_TIP_FLOWS } = RECOVERY_MAP
  let props: React.ComponentProps<typeof CancelRun>
  let mockGoBackPrevStep: Mock
  let mockSetRobotInMotion: Mock
  let mockProceedToRouteAndStep: Mock

  beforeEach(() => {
    mockGoBackPrevStep = vi.fn()
    mockSetRobotInMotion = vi.fn(() => Promise.resolve())
    mockProceedToRouteAndStep = vi.fn()
    const mockRouteUpdateActions = {
      goBackPrevStep: mockGoBackPrevStep,
      setRobotInMotion: mockSetRobotInMotion,
      proceedToRouteAndStep: mockProceedToRouteAndStep,
    } as any

    props = {
      ...mockRecoveryContentProps,
      routeUpdateActions: mockRouteUpdateActions,
      recoveryMap: {
        route: CANCEL_RUN.ROUTE,
        step: CANCEL_RUN.STEPS.CONFIRM_CANCEL,
      },
      tipStatusUtils: {
        isLoadingTipStatus: false,
        areTipsAttached: false,
      } as any,
      recoveryCommands: { cancelRun: vi.fn() } as any,
    }
  })

  it('renders appropriate copy and click behavior', async () => {
    render(props)

    screen.getByText('Are you sure you want to cancel?')
    screen.queryByText(
      'If tips are attached, you can choose to blowout any aspirated liquid and drop tips before the run is terminated.'
    )

    const secondaryBtn = screen.getByRole('button', { name: 'Go back' })

    fireEvent.click(secondaryBtn)

    expect(mockGoBackPrevStep).toHaveBeenCalled()
  })

  it('should call commands in the correct order for the primaryOnClick callback', async () => {
    const setRobotInMotionMock = vi.fn(() => Promise.resolve())
    const cancelRunMock = vi.fn(() => Promise.resolve())

    const mockRecoveryCommands = {
      cancelRun: cancelRunMock,
    } as any

    const mockRouteUpdateActions = {
      setRobotInMotion: setRobotInMotionMock,
    } as any

    render({
      ...props,
      recoveryCommands: mockRecoveryCommands,
      routeUpdateActions: mockRouteUpdateActions,
    })

    const primaryBtn = screen.getByRole('button', { name: 'Confirm' })
    fireEvent.click(primaryBtn)

    await waitFor(() => {
      expect(setRobotInMotionMock).toHaveBeenCalledTimes(1)
    })
    await waitFor(() => {
      expect(setRobotInMotionMock).toHaveBeenCalledWith(
        true,
        ROBOT_CANCELING.ROUTE
      )
    })
    await waitFor(() => {
      expect(cancelRunMock).toHaveBeenCalledTimes(1)
    })

    expect(setRobotInMotionMock.mock.invocationCallOrder[0]).toBeLessThan(
      cancelRunMock.mock.invocationCallOrder[0]
    )
  })

  it('should route the user to ManageTips if tips are attached, tip status is not loading, and the user clicks the appropriate button', () => {
    props = {
      ...props,
      tipStatusUtils: {
        isLoadingTipStatus: false,
        areTipsAttached: true,
      } as any,
    }

    render(props)

    const primaryBtn = screen.getByRole('button', { name: 'Confirm' })

    fireEvent.click(primaryBtn)
    expect(mockProceedToRouteAndStep).toHaveBeenCalledWith(DROP_TIP_FLOWS.ROUTE)
  })

  it('should not yet route the user if the user clicks the appropriate button, but tip detection is still loading', () => {
    props = {
      ...props,
      tipStatusUtils: {
        isLoadingTipStatus: true,
        areTipsAttached: false,
      } as any,
    }

    render(props)

    const primaryBtn = screen.getByRole('button', { name: 'Confirm' })

    fireEvent.click(primaryBtn)
    expect(mockProceedToRouteAndStep).not.toHaveBeenCalled()
    expect(mockSetRobotInMotion).not.toHaveBeenCalled()
  })

  it('should will cancel the run if no tips are detected', () => {
    props = {
      ...props,
      tipStatusUtils: {
        isLoadingTipStatus: false,
        areTipsAttached: false,
      } as any,
    }

    render(props)

    const primaryBtn = screen.getByRole('button', { name: 'Confirm' })

    fireEvent.click(primaryBtn)
    expect(mockProceedToRouteAndStep).not.toHaveBeenCalled()
    expect(mockSetRobotInMotion).toHaveBeenCalled()
  })
})
