import * as React from 'react'
import { describe, it, vi, expect, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'

import { mockRecoveryContentProps } from '../__fixtures__'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { RecoveryError } from '../RecoveryError'
import { RECOVERY_MAP } from '../constants'

import type { Mock } from 'vitest'

const render = (props: React.ComponentProps<typeof RecoveryError>) => {
  return renderWithProviders(<RecoveryError {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const { ERROR_WHILE_RECOVERING } = RECOVERY_MAP

describe('RecoveryError', () => {
  let props: React.ComponentProps<typeof RecoveryError>
  let proceedToRouteAndStepMock: Mock
  let getRecoverOptionCopyMock: Mock

  beforeEach(() => {
    proceedToRouteAndStepMock = vi.fn()
    getRecoverOptionCopyMock = vi.fn()

    props = {
      ...mockRecoveryContentProps,
      routeUpdateActions: {
        ...mockRecoveryContentProps.routeUpdateActions,
        proceedToRouteAndStep: proceedToRouteAndStepMock,
      },
      getRecoveryOptionCopy: getRecoverOptionCopyMock,
      recoveryMap: {
        route: ERROR_WHILE_RECOVERING.ROUTE,
        step: ERROR_WHILE_RECOVERING.STEPS.RECOVERY_ACTION_FAILED,
      },
    }

    getRecoverOptionCopyMock.mockReturnValue('Retry step')
  })

  it(`renders ErrorRecoveryFlowError when step is ${ERROR_WHILE_RECOVERING.STEPS.RECOVERY_ACTION_FAILED}`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.ERROR_WHILE_RECOVERING.STEPS.RECOVERY_ACTION_FAILED
    render(props)

    expect(screen.getByText('Retry step failed')).toBeInTheDocument()
    expect(
      screen.getByText('Return to the menu to choose how to proceed.')
    ).toBeInTheDocument()
    expect(screen.getByText('Back to menu')).toBeInTheDocument()
  })

  it(`renders RecoveryDropTipFlowErrors when step is ${ERROR_WHILE_RECOVERING.STEPS.DROP_TIP_GENERAL_ERROR}`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.ERROR_WHILE_RECOVERING.STEPS.DROP_TIP_GENERAL_ERROR
    render(props)

    expect(screen.getByText('Retry step failed')).toBeInTheDocument()
    expect(
      screen.getByText('Return to the menu to choose how to proceed.')
    ).toBeInTheDocument()
    expect(screen.getByText('Return to menu')).toBeInTheDocument()
  })

  it(`renders RecoveryDropTipFlowErrors when step is ${ERROR_WHILE_RECOVERING.STEPS.DROP_TIP_BLOWOUT_FAILED}`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.ERROR_WHILE_RECOVERING.STEPS.DROP_TIP_BLOWOUT_FAILED
    render(props)

    expect(screen.getByText('Blowout failed')).toBeInTheDocument()
    expect(
      screen.getByText(
        'You can still drop the attached tips before proceeding to tip selection.'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('Continue to drop tip')).toBeInTheDocument()
  })

  it(`renders RecoveryDropTipFlowErrors when step is ${ERROR_WHILE_RECOVERING.STEPS.DROP_TIP_TIP_DROP_FAILED}`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.ERROR_WHILE_RECOVERING.STEPS.DROP_TIP_TIP_DROP_FAILED
    render(props)

    expect(screen.getByText('Tip drop failed')).toBeInTheDocument()
    expect(
      screen.getByText('Return to the menu to choose how to proceed.')
    ).toBeInTheDocument()
    expect(screen.getByText('Return to menu')).toBeInTheDocument()
  })

  it(`calls proceedToRouteAndStep with ${RECOVERY_MAP.OPTION_SELECTION.ROUTE} when the "Back to menu" button is clicked in ErrorRecoveryFlowError`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.ERROR_WHILE_RECOVERING.STEPS.RECOVERY_ACTION_FAILED
    render(props)

    fireEvent.click(screen.getByText('Back to menu'))

    expect(proceedToRouteAndStepMock).toHaveBeenCalledWith(
      RECOVERY_MAP.OPTION_SELECTION.ROUTE
    )
  })

  it(`calls proceedToRouteAndStep with ${RECOVERY_MAP.OPTION_SELECTION.ROUTE} when the "Return to menu" button is clicked in RecoveryDropTipFlowErrors with step ${ERROR_WHILE_RECOVERING.STEPS.DROP_TIP_GENERAL_ERROR}`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.ERROR_WHILE_RECOVERING.STEPS.DROP_TIP_GENERAL_ERROR
    render(props)

    fireEvent.click(screen.getByText('Return to menu'))

    expect(proceedToRouteAndStepMock).toHaveBeenCalledWith(
      RECOVERY_MAP.OPTION_SELECTION.ROUTE
    )
  })

  it(`calls proceedToRouteAndStep with ${RECOVERY_MAP.OPTION_SELECTION.ROUTE} when the "Return to menu" button is clicked in RecoveryDropTipFlowErrors with step ${ERROR_WHILE_RECOVERING.STEPS.DROP_TIP_TIP_DROP_FAILED}`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.ERROR_WHILE_RECOVERING.STEPS.DROP_TIP_TIP_DROP_FAILED
    render(props)

    fireEvent.click(screen.getByText('Return to menu'))

    expect(proceedToRouteAndStepMock).toHaveBeenCalledWith(
      RECOVERY_MAP.OPTION_SELECTION.ROUTE
    )
  })

  it(`calls proceedToRouteAndStep with DROP_TIP_FLOWS.ROUTE and ${RECOVERY_MAP.DROP_TIP_FLOWS.STEPS.CHOOSE_TIP_DROP} when the "Continue to drop tip" button is clicked in RecoveryDropTipFlowErrors with step ${ERROR_WHILE_RECOVERING.STEPS.DROP_TIP_BLOWOUT_FAILED}`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.ERROR_WHILE_RECOVERING.STEPS.DROP_TIP_BLOWOUT_FAILED
    render(props)

    fireEvent.click(screen.getByText('Continue to drop tip'))

    expect(proceedToRouteAndStepMock).toHaveBeenCalledWith(
      RECOVERY_MAP.DROP_TIP_FLOWS.ROUTE,
      RECOVERY_MAP.DROP_TIP_FLOWS.STEPS.CHOOSE_TIP_DROP
    )
  })
})
