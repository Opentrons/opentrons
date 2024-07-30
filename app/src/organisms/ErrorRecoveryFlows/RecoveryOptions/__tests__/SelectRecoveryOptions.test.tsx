import * as React from 'react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { when } from 'vitest-when'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
import { mockRecoveryContentProps } from '../../__fixtures__'
import {
  SelectRecoveryOption,
  ODDRecoveryOptions,
  DesktopRecoveryOptions,
  getRecoveryOptions,
  GENERAL_ERROR_OPTIONS,
  OVERPRESSURE_WHILE_ASPIRATING_OPTIONS,
  OVERPRESSURE_PREPARE_TO_ASPIRATE,
  OVERPRESSURE_WHILE_DISPENSING_OPTIONS,
  NO_LIQUID_DETECTED_OPTIONS,
} from '../SelectRecoveryOption'
import { RECOVERY_MAP, ERROR_KINDS } from '../../constants'
import { clickButtonLabeled } from '../../__tests__/util'

import type { Mock } from 'vitest'

const renderSelectRecoveryOption = (
  props: React.ComponentProps<typeof SelectRecoveryOption>
) => {
  return renderWithProviders(
    <SelectRecoveryOption {...{ ...mockRecoveryContentProps, ...props }} />,
    {
      i18nInstance: i18n,
    }
  )[0]
}

const renderODDRecoveryOptions = (
  props: React.ComponentProps<typeof ODDRecoveryOptions>
) => {
  return renderWithProviders(<ODDRecoveryOptions {...props} />, {
    i18nInstance: i18n,
  })[0]
}
const renderDesktopRecoveryOptions = (
  props: React.ComponentProps<typeof DesktopRecoveryOptions>
) => {
  return renderWithProviders(<DesktopRecoveryOptions {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('SelectRecoveryOption', () => {
  const { RETRY_FAILED_COMMAND, RETRY_NEW_TIPS } = RECOVERY_MAP
  let props: React.ComponentProps<typeof SelectRecoveryOption>
  let mockProceedToRouteAndStep: Mock
  let mockSetSelectedRecoveryOption: Mock
  let mockGetRecoveryOptionCopy: Mock

  beforeEach(() => {
    mockProceedToRouteAndStep = vi.fn()
    mockSetSelectedRecoveryOption = vi.fn(() => Promise.resolve())
    mockGetRecoveryOptionCopy = vi.fn()
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
      currentRecoveryOptionUtils: {
        setSelectedRecoveryOption: mockSetSelectedRecoveryOption,
      } as any,
      getRecoveryOptionCopy: mockGetRecoveryOptionCopy,
    }

    when(mockGetRecoveryOptionCopy)
      .calledWith(RECOVERY_MAP.RETRY_FAILED_COMMAND.ROUTE)
      .thenReturn('Retry step')
    when(mockGetRecoveryOptionCopy)
      .calledWith(RECOVERY_MAP.CANCEL_RUN.ROUTE)
      .thenReturn('Cancel run')
    when(mockGetRecoveryOptionCopy)
      .calledWith(RECOVERY_MAP.RETRY_NEW_TIPS.ROUTE)
      .thenReturn('Retry with new tips')
    when(mockGetRecoveryOptionCopy)
      .calledWith(RECOVERY_MAP.FILL_MANUALLY_AND_SKIP.ROUTE)
      .thenReturn('Manually fill well and skip to next step')
    when(mockGetRecoveryOptionCopy)
      .calledWith(RECOVERY_MAP.RETRY_SAME_TIPS.ROUTE)
      .thenReturn('Retry with same tips')
    when(mockGetRecoveryOptionCopy)
      .calledWith(RECOVERY_MAP.SKIP_STEP_WITH_SAME_TIPS.ROUTE)
      .thenReturn('Skip to next step with same tips')
  })

  it('sets the selected recovery option when clicking continue', () => {
    renderSelectRecoveryOption(props)

    clickButtonLabeled('Continue')

    expect(mockSetSelectedRecoveryOption).toHaveBeenCalledWith(
      RETRY_FAILED_COMMAND.ROUTE
    )
  })

  it('renders appropriate "General Error" copy and click behavior', () => {
    renderSelectRecoveryOption(props)

    screen.getByText('Choose a recovery action')

    const retryStepOption = screen.getAllByRole('label', { name: 'Retry step' })
    clickButtonLabeled('Continue')
    expect(
      screen.queryByRole('button', { name: 'Go back' })
    ).not.toBeInTheDocument()

    fireEvent.click(retryStepOption[0])
    clickButtonLabeled('Continue')

    expect(mockProceedToRouteAndStep).toHaveBeenCalledWith(
      RETRY_FAILED_COMMAND.ROUTE
    )
  })

  it('renders appropriate "Overpressure while aspirating" copy and click behavior', () => {
    props = {
      ...props,
      errorKind: ERROR_KINDS.OVERPRESSURE_WHILE_ASPIRATING,
    }

    renderSelectRecoveryOption(props)

    screen.getByText('Choose a recovery action')

    const retryNewTips = screen.getAllByRole('label', {
      name: 'Retry with new tips',
    })
    expect(
      screen.queryByRole('button', { name: 'Go back' })
    ).not.toBeInTheDocument()

    fireEvent.click(retryNewTips[0])
    clickButtonLabeled('Continue')

    expect(mockProceedToRouteAndStep).toHaveBeenCalledWith(RETRY_NEW_TIPS.ROUTE)
  })

  it('renders appropriate "No liquid detected" copy and click behavior', () => {
    props = {
      ...props,
      errorKind: ERROR_KINDS.NO_LIQUID_DETECTED,
    }

    renderSelectRecoveryOption(props)

    screen.getByText('Choose a recovery action')

    const fillManuallyAndSkip = screen.getAllByRole('label', {
      name: 'Manually fill well and skip to next step',
    })

    fireEvent.click(fillManuallyAndSkip[0])
    clickButtonLabeled('Continue')

    expect(mockProceedToRouteAndStep).toHaveBeenCalledWith(
      RECOVERY_MAP.FILL_MANUALLY_AND_SKIP.ROUTE
    )
  })

  it('renders appropriate "Overpressure prepare to aspirate" copy and click behavior', () => {
    props = {
      ...props,
      errorKind: ERROR_KINDS.OVERPRESSURE_PREPARE_TO_ASPIRATE,
    }

    renderSelectRecoveryOption(props)

    screen.getByText('Choose a recovery action')

    const retrySameTips = screen.getAllByRole('label', {
      name: 'Retry with same tips',
    })

    fireEvent.click(retrySameTips[0])
    clickButtonLabeled('Continue')

    expect(mockProceedToRouteAndStep).toHaveBeenCalledWith(
      RECOVERY_MAP.RETRY_SAME_TIPS.ROUTE
    )
  })

  it('renders appropriate "Overpressure while dispensing" copy and click behavior', () => {
    props = {
      ...props,
      errorKind: ERROR_KINDS.OVERPRESSURE_WHILE_DISPENSING,
    }

    renderSelectRecoveryOption(props)

    screen.getByText('Choose a recovery action')

    const skipStepWithSameTips = screen.getAllByRole('label', {
      name: 'Skip to next step with same tips',
    })

    fireEvent.click(skipStepWithSameTips[0])
    clickButtonLabeled('Continue')

    expect(mockProceedToRouteAndStep).toHaveBeenCalledWith(
      RECOVERY_MAP.SKIP_STEP_WITH_SAME_TIPS.ROUTE
    )
  })
})
;([
  ['desktop', renderDesktopRecoveryOptions] as const,
  ['odd', renderODDRecoveryOptions] as const,
] as const).forEach(([target, renderer]) => {
  describe(`RecoveryOptions on ${target}`, () => {
    let props: React.ComponentProps<typeof DesktopRecoveryOptions>
    let mockSetSelectedRoute: Mock
    let mockGetRecoveryOptionCopy: Mock

    beforeEach(() => {
      mockSetSelectedRoute = vi.fn()
      mockGetRecoveryOptionCopy = vi.fn()
      const generalRecoveryOptions = getRecoveryOptions(
        ERROR_KINDS.GENERAL_ERROR
      )

      props = {
        validRecoveryOptions: generalRecoveryOptions,
        setSelectedRoute: mockSetSelectedRoute,
        getRecoveryOptionCopy: mockGetRecoveryOptionCopy,
      }

      when(mockGetRecoveryOptionCopy)
        .calledWith(RECOVERY_MAP.RETRY_FAILED_COMMAND.ROUTE)
        .thenReturn('Retry step')
      when(mockGetRecoveryOptionCopy)
        .calledWith(RECOVERY_MAP.CANCEL_RUN.ROUTE)
        .thenReturn('Cancel run')
      when(mockGetRecoveryOptionCopy)
        .calledWith(RECOVERY_MAP.RETRY_NEW_TIPS.ROUTE)
        .thenReturn('Retry with new tips')
      when(mockGetRecoveryOptionCopy)
        .calledWith(RECOVERY_MAP.FILL_MANUALLY_AND_SKIP.ROUTE)
        .thenReturn('Manually fill well and skip to next step')
      when(mockGetRecoveryOptionCopy)
        .calledWith(RECOVERY_MAP.RETRY_SAME_TIPS.ROUTE)
        .thenReturn('Retry with same tips')
      when(mockGetRecoveryOptionCopy)
        .calledWith(RECOVERY_MAP.SKIP_STEP_WITH_SAME_TIPS.ROUTE)
        .thenReturn('Skip to next step with same tips')
      when(mockGetRecoveryOptionCopy)
        .calledWith(RECOVERY_MAP.SKIP_STEP_WITH_NEW_TIPS.ROUTE)
        .thenReturn('Skip to next step with new tips')
      when(mockGetRecoveryOptionCopy)
        .calledWith(RECOVERY_MAP.IGNORE_AND_SKIP.ROUTE)
        .thenReturn('Ignore error and skip to next step')
    })

    it('renders valid recovery options for a general error errorKind', () => {
      renderer(props)

      screen.getByRole('label', { name: 'Retry step' })
      screen.getByRole('label', { name: 'Cancel run' })
    })

    it(`renders valid recovery options for a ${ERROR_KINDS.OVERPRESSURE_WHILE_ASPIRATING} errorKind`, () => {
      props = {
        ...props,
        validRecoveryOptions: OVERPRESSURE_WHILE_ASPIRATING_OPTIONS,
      }

      renderer(props)

      screen.getByRole('label', { name: 'Retry with new tips' })
      screen.getByRole('label', { name: 'Cancel run' })
    })

    it('updates the selectedRoute when a new option is selected', () => {
      renderer(props)

      fireEvent.click(screen.getByRole('label', { name: 'Cancel run' }))

      expect(mockSetSelectedRoute).toHaveBeenCalledWith(
        RECOVERY_MAP.CANCEL_RUN.ROUTE
      )
    })

    it(`renders valid recovery options for a ${ERROR_KINDS.NO_LIQUID_DETECTED} errorKind`, () => {
      props = {
        ...props,
        validRecoveryOptions: NO_LIQUID_DETECTED_OPTIONS,
      }

      renderer(props)

      screen.getByRole('label', {
        name: 'Manually fill well and skip to next step',
      })
      screen.getByRole('label', { name: 'Ignore error and skip to next step' })
      screen.getByRole('label', { name: 'Cancel run' })
    })

    it(`renders valid recovery options for a ${ERROR_KINDS.OVERPRESSURE_PREPARE_TO_ASPIRATE} errorKind`, () => {
      props = {
        ...props,
        validRecoveryOptions: OVERPRESSURE_PREPARE_TO_ASPIRATE,
      }

      renderer(props)

      screen.getByRole('label', { name: 'Retry with new tips' })
      screen.getByRole('label', { name: 'Retry with same tips' })
      screen.getByRole('label', { name: 'Cancel run' })
    })

    it(`renders valid recovery options for a ${ERROR_KINDS.OVERPRESSURE_WHILE_DISPENSING} errorKind`, () => {
      props = {
        ...props,
        validRecoveryOptions: OVERPRESSURE_WHILE_DISPENSING_OPTIONS,
      }

      renderer(props)

      screen.getByRole('label', { name: 'Skip to next step with same tips' })
      screen.getByRole('label', { name: 'Skip to next step with new tips' })
      screen.getByRole('label', { name: 'Cancel run' })
    })
  })
})

describe('getRecoveryOptions', () => {
  it(`returns valid options when the errorKind is ${ERROR_KINDS.GENERAL_ERROR}`, () => {
    const generalErrorOptions = getRecoveryOptions(ERROR_KINDS.GENERAL_ERROR)
    expect(generalErrorOptions).toBe(GENERAL_ERROR_OPTIONS)
  })

  it(`returns valid options when the errorKind is ${ERROR_KINDS.OVERPRESSURE_WHILE_ASPIRATING}`, () => {
    const generalErrorOptions = getRecoveryOptions(
      ERROR_KINDS.OVERPRESSURE_WHILE_ASPIRATING
    )
    expect(generalErrorOptions).toBe(OVERPRESSURE_WHILE_ASPIRATING_OPTIONS)
  })

  it(`returns valid options when the errorKind is ${ERROR_KINDS.NO_LIQUID_DETECTED}`, () => {
    const noLiquidDetectedOptions = getRecoveryOptions(
      ERROR_KINDS.NO_LIQUID_DETECTED
    )
    expect(noLiquidDetectedOptions).toBe(NO_LIQUID_DETECTED_OPTIONS)
  })

  it(`returns valid options when the errorKind is ${ERROR_KINDS.OVERPRESSURE_PREPARE_TO_ASPIRATE}`, () => {
    const overpressurePrepareToAspirateOptions = getRecoveryOptions(
      ERROR_KINDS.OVERPRESSURE_PREPARE_TO_ASPIRATE
    )
    expect(overpressurePrepareToAspirateOptions).toBe(
      OVERPRESSURE_PREPARE_TO_ASPIRATE
    )
  })

  it(`returns valid options when the errorKind is ${ERROR_KINDS.OVERPRESSURE_WHILE_DISPENSING}`, () => {
    const overpressureWhileDispensingOptions = getRecoveryOptions(
      ERROR_KINDS.OVERPRESSURE_WHILE_DISPENSING
    )
    expect(overpressureWhileDispensingOptions).toBe(
      OVERPRESSURE_WHILE_DISPENSING_OPTIONS
    )
  })
})
