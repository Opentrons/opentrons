import * as React from 'react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
import { mockRecoveryContentProps } from '../../__fixtures__'
import {
  SelectRecoveryOption,
  RecoveryOptions,
  getRecoveryOptions,
  GENERAL_ERROR_OPTIONS,
} from '../SelectRecoveryOption'
import { RECOVERY_MAP, ERROR_KINDS } from '../../constants'

import type { Mock } from 'vitest'

const renderSelectRecoveryOption = (
  props: React.ComponentProps<typeof SelectRecoveryOption>
) => {
  return renderWithProviders(<SelectRecoveryOption {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const renderRecoveryOptions = (
  props: React.ComponentProps<typeof RecoveryOptions>
) => {
  return renderWithProviders(<RecoveryOptions {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('SelectRecoveryOption', () => {
  const { RETRY_FAILED_COMMAND } = RECOVERY_MAP
  let props: React.ComponentProps<typeof SelectRecoveryOption>
  let mockProceedToRouteAndStep: Mock

  beforeEach(() => {
    mockProceedToRouteAndStep = vi.fn()
    const mockRouteUpdateActions = {
      proceedToRouteAndStep: mockProceedToRouteAndStep,
    } as any

    props = {
      ...mockRecoveryContentProps,
      routeUpdateActions: mockRouteUpdateActions,
      recoveryMap: {
        route: RETRY_FAILED_COMMAND.ROUTE,
        step: RETRY_FAILED_COMMAND.STEPS.CONFIRM_RETRY,
      },
      tipStatusUtils: { determineTipStatus: vi.fn() } as any,
    }
  })

  it('renders appropriate "General Error" copy and click behavior', () => {
    renderSelectRecoveryOption(props)

    screen.getByText('Choose a recovery action')

    const retryStepOption = screen.getByRole('label', { name: 'Retry step' })
    const continueBtn = screen.getByRole('button', { name: 'Continue' })
    expect(
      screen.queryByRole('button', { name: 'Go back' })
    ).not.toBeInTheDocument()

    fireEvent.click(retryStepOption)
    fireEvent.click(continueBtn)

    expect(mockProceedToRouteAndStep).toHaveBeenCalledWith(
      RETRY_FAILED_COMMAND.ROUTE
    )
  })
})

describe('RecoveryOptions', () => {
  let props: React.ComponentProps<typeof RecoveryOptions>
  let mockSetSelectedRoute: Mock

  beforeEach(() => {
    mockSetSelectedRoute = vi.fn()
    const generalRecoveryOptions = getRecoveryOptions(ERROR_KINDS.GENERAL_ERROR)

    props = {
      validRecoveryOptions: generalRecoveryOptions,
      setSelectedRoute: mockSetSelectedRoute,
    }
  })

  it('renders valid recovery options for a general error errorKind', () => {
    renderRecoveryOptions(props)

    screen.getByRole('label', { name: 'Retry step' })
    screen.getByRole('label', { name: 'Cancel run' })
  })

  it('updates the selectedRoute when a new option is selected', () => {
    renderRecoveryOptions(props)

    fireEvent.click(screen.getByRole('label', { name: 'Cancel run' }))

    expect(mockSetSelectedRoute).toHaveBeenCalledWith(
      RECOVERY_MAP.CANCEL_RUN.ROUTE
    )
  })
})

describe('getRecoveryOptions', () => {
  it(`returns general error options when the errorKind is ${ERROR_KINDS.GENERAL_ERROR}`, () => {
    const generalErrorOptions = getRecoveryOptions(ERROR_KINDS.GENERAL_ERROR)
    expect(generalErrorOptions).toBe(GENERAL_ERROR_OPTIONS)
  })
})
