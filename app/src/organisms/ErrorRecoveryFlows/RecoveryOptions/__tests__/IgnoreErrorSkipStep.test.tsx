import * as React from 'react'
import { describe, it, vi, expect, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'

import { mockRecoveryContentProps } from '../../__fixtures__'
import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '../../../../i18n'
import {
  IgnoreErrorSkipStep,
  IgnoreErrorStepHome,
  IgnoreOptions,
} from '../IgnoreErrorSkipStep'
import { RECOVERY_MAP } from '../../constants'
import { SelectRecoveryOption } from '../SelectRecoveryOption'
import { clickButtonLabeled } from '../../__tests__/util'

import type { Mock } from 'vitest'

vi.mock('../shared', async () => {
  const actual = await vi.importActual('../shared')
  return {
    ...actual,
    RecoverySingleColumnContentWrapper: vi.fn(({ children }) => (
      <div>{children}</div>
    )),
  }
})
vi.mock('../SelectRecoveryOption')

const render = (props: React.ComponentProps<typeof IgnoreErrorSkipStep>) => {
  return renderWithProviders(<IgnoreErrorSkipStep {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const renderIgnoreErrorStepHome = (
  props: React.ComponentProps<typeof IgnoreErrorStepHome>
) => {
  return renderWithProviders(<IgnoreErrorStepHome {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('IgnoreErrorSkipStep', () => {
  let props: React.ComponentProps<typeof IgnoreErrorSkipStep>

  beforeEach(() => {
    props = {
      ...mockRecoveryContentProps,
    }

    vi.mocked(SelectRecoveryOption).mockReturnValue(
      <div>MOCK_SELECT_RECOVERY_OPTION</div>
    )
  })

  it(`renders IgnoreErrorStepHome when step is ${RECOVERY_MAP.IGNORE_AND_SKIP.STEPS.SELECT_IGNORE_KIND}`, () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        step: RECOVERY_MAP.IGNORE_AND_SKIP.STEPS.SELECT_IGNORE_KIND,
      },
    }
    render(props)
    screen.getByText('Ignore similar errors later in the run?')
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

describe('IgnoreErrorStepHome', () => {
  let props: React.ComponentProps<typeof IgnoreErrorStepHome>
  let mockIgnoreErrorKindThisRun: Mock
  let mockProceedToRouteAndStep: Mock
  let mockGoBackPrevStep: Mock

  beforeEach(() => {
    mockIgnoreErrorKindThisRun = vi.fn(() => Promise.resolve())
    mockProceedToRouteAndStep = vi.fn()
    mockGoBackPrevStep = vi.fn()

    props = {
      ...mockRecoveryContentProps,
      isOnDevice: true,
      recoveryCommands: {
        ignoreErrorKindThisRun: mockIgnoreErrorKindThisRun,
      } as any,
      routeUpdateActions: {
        proceedToRouteAndStep: mockProceedToRouteAndStep,
        goBackPrevStep: mockGoBackPrevStep,
      } as any,
    }
  })

  it('calls ignoreOnce when "ignore_only_this_error" is selected and primary button is clicked', async () => {
    renderIgnoreErrorStepHome(props)
    fireEvent.click(screen.queryAllByText('Ignore only this error')[0])
    clickButtonLabeled('Continue')
    await waitFor(() => {
      expect(mockProceedToRouteAndStep).toHaveBeenCalledWith(
        RECOVERY_MAP.FILL_MANUALLY_AND_SKIP.ROUTE,
        RECOVERY_MAP.FILL_MANUALLY_AND_SKIP.STEPS.SKIP
      )
    })
  })

  it('calls ignoreAlways when "ignore_all_errors_of_this_type" is selected and primary button is clicked', async () => {
    renderIgnoreErrorStepHome(props)
    fireEvent.click(screen.queryAllByText('Ignore all errors of this type')[0])
    clickButtonLabeled('Continue')
    await waitFor(() => {
      expect(mockIgnoreErrorKindThisRun).toHaveBeenCalled()
    })
    await waitFor(() => {
      expect(mockProceedToRouteAndStep).toHaveBeenCalledWith(
        RECOVERY_MAP.FILL_MANUALLY_AND_SKIP.ROUTE,
        RECOVERY_MAP.FILL_MANUALLY_AND_SKIP.STEPS.SKIP
      )
    })
  })

  it('calls goBackPrevStep when secondary button is clicked', () => {
    renderIgnoreErrorStepHome(props)
    clickButtonLabeled('Go back')
    expect(mockGoBackPrevStep).toHaveBeenCalled()
  })
})

describe('IgnoreOptions', () => {
  let props: React.ComponentProps<typeof IgnoreOptions>

  beforeEach(() => {
    props = {
      ignoreOptions: [
        'ignore_only_this_error',
        'ignore_all_errors_of_this_type',
      ],
      setSelectedOption: vi.fn(),
      selectedOption: 'ignore_only_this_error',
    }
  })

  it('renders the ignore options', () => {
    renderWithProviders(<IgnoreOptions {...props} />, {
      i18nInstance: i18n,
    })
    screen.getByText('Ignore only this error')
    screen.getByText('Ignore all errors of this type')
  })

  it('calls setSelectedOption when an option is selected', () => {
    renderWithProviders(<IgnoreOptions {...props} />, {
      i18nInstance: i18n,
    })
    fireEvent.click(screen.getByText('Ignore all errors of this type'))
    expect(props.setSelectedOption).toHaveBeenCalledWith(
      'ignore_all_errors_of_this_type'
    )
  })
})
