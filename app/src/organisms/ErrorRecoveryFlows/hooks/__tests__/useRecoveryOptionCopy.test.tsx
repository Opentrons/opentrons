import { screen } from '@testing-library/react'
import { describe, it } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { ERROR_KINDS, RECOVERY_MAP } from '../../constants'
import { useRecoveryOptionCopy } from '../useRecoveryOptionCopy'

import type { ComponentProps, ReactNode } from 'react'
import type { ErrorKind, RecoveryRoute } from '../../types'

function MockRenderCmpt({
  route,
  errorKind,
}: {
  route: RecoveryRoute | null
  errorKind?: ErrorKind
}): ReactNode {
  const getRecoveryOptionCopy = useRecoveryOptionCopy()

  return (
    <div>
      {getRecoveryOptionCopy(route, errorKind ?? ERROR_KINDS.GENERAL_ERROR)}
    </div>
  )
}

const render = (props: ComponentProps<typeof MockRenderCmpt>) => {
  return renderWithProviders(<MockRenderCmpt {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('useRecoveryOptionCopy', () => {
  it(`renders the correct copy for ${RECOVERY_MAP.RETRY_STEP.ROUTE}`, () => {
    render({ route: RECOVERY_MAP.RETRY_STEP.ROUTE })

    screen.getByText('Retry step')
  })

  it(`renders the correct copy for ${RECOVERY_MAP.RETRY_STEP.ROUTE} when the error kind is ${ERROR_KINDS.TIP_DROP_FAILED}`, () => {
    render({
      route: RECOVERY_MAP.RETRY_STEP.ROUTE,
      errorKind: ERROR_KINDS.TIP_DROP_FAILED,
    })

    screen.getByText('Retry dropping tip')
  })

  it(`renders the correct copy for ${RECOVERY_MAP.RETRY_STEP.ROUTE} when the error kind is ${ERROR_KINDS.TIP_NOT_DETECTED}`, () => {
    render({
      route: RECOVERY_MAP.RETRY_STEP.ROUTE,
      errorKind: ERROR_KINDS.TIP_NOT_DETECTED,
    })

    screen.getByText('Retry picking up tip')
  })

  it(`renders the correct copy for ${RECOVERY_MAP.CANCEL_RUN.ROUTE}`, () => {
    render({ route: RECOVERY_MAP.CANCEL_RUN.ROUTE })

    screen.getByText('Cancel run')
  })

  it(`renders the correct copy for ${RECOVERY_MAP.RETRY_NEW_TIPS.ROUTE}`, () => {
    render({ route: RECOVERY_MAP.RETRY_NEW_TIPS.ROUTE })

    screen.getByText('Retry with new tips')
  })

  it(`renders the correct copy for ${RECOVERY_MAP.RETRY_SAME_TIPS.ROUTE}`, () => {
    render({ route: RECOVERY_MAP.RETRY_SAME_TIPS.ROUTE })

    screen.getByText('Retry with same tips')
  })

  it(`renders the correct copy for ${RECOVERY_MAP.MANUAL_FILL_AND_RETRY_SAME_TIPS.ROUTE}`, () => {
    render({ route: RECOVERY_MAP.MANUAL_FILL_AND_RETRY_SAME_TIPS.ROUTE })

    screen.getByText('Manually fill well and retry with same tips')
  })

  it(`renders the correct copy for ${RECOVERY_MAP.MANUAL_FILL_AND_RETRY_NEW_TIPS.ROUTE}`, () => {
    render({ route: RECOVERY_MAP.MANUAL_FILL_AND_RETRY_NEW_TIPS.ROUTE })

    screen.getByText('Manually fill well and retry with new tips')
  })

  it(`renders the correct copy for ${RECOVERY_MAP.IGNORE_AND_SKIP.ROUTE}`, () => {
    render({ route: RECOVERY_MAP.IGNORE_AND_SKIP.ROUTE })

    screen.getByText('Ignore error and skip to next step')
  })

  it(`renders the correct copy for ${RECOVERY_MAP.SKIP_STEP_WITH_NEW_TIPS.ROUTE}`, () => {
    render({ route: RECOVERY_MAP.SKIP_STEP_WITH_NEW_TIPS.ROUTE })

    screen.getByText('Skip to next step with new tips')
  })

  it(`renders the correct copy for ${RECOVERY_MAP.SKIP_STEP_WITH_SAME_TIPS.ROUTE}`, () => {
    render({ route: RECOVERY_MAP.SKIP_STEP_WITH_SAME_TIPS.ROUTE })

    screen.getByText('Skip to next step with same tips')
  })

  it(`renders the correct copy for ${RECOVERY_MAP.MANUAL_MOVE_AND_SKIP.ROUTE}`, () => {
    render({ route: RECOVERY_MAP.MANUAL_MOVE_AND_SKIP.ROUTE })

    screen.getByText('Manually move labware and skip to next step')
  })

  it(`renders the correct copy for ${RECOVERY_MAP.MANUAL_REPLACE_AND_RETRY.ROUTE}`, () => {
    render({ route: RECOVERY_MAP.MANUAL_REPLACE_AND_RETRY.ROUTE })

    screen.getByText('Manually replace labware on deck and retry step')
  })

  it(`renders the correct copy for ${RECOVERY_MAP.HOME_AND_RETRY.ROUTE}`, () => {
    render({ route: RECOVERY_MAP.HOME_AND_RETRY.ROUTE })
    screen.getByText('Home gantry and retry step')
  })

  it(`renders the correct copy for ${RECOVERY_MAP.STACKER_STALLED_RETRY.ROUTE}`, () => {
    render({ route: RECOVERY_MAP.STACKER_STALLED_RETRY.ROUTE })

    screen.getByText('Clear obstruction in stacker and retry step')
  })

  it(`renders the correct copy for ${RECOVERY_MAP.STACKER_HOPPER_EMPTY_RETRY.ROUTE}`, () => {
    render({ route: RECOVERY_MAP.STACKER_HOPPER_EMPTY_RETRY.ROUTE })
  })

  it(`renders the correct copy for ${RECOVERY_MAP.STACKER_STALLED_SKIP.ROUTE}`, () => {
    render({ route: RECOVERY_MAP.STACKER_STALLED_SKIP.ROUTE })

    screen.getByText('Manually load labware onto labware shuttle and skip step')
  })

  it(`renders the correct copy for ${RECOVERY_MAP.STACKER_STALLED_STORE_SKIP.ROUTE}`, () => {
    render({ route: RECOVERY_MAP.STACKER_STALLED_STORE_SKIP.ROUTE })

    screen.getByText('Clear obstruction in stacker and skip to next step')
  })

  it(`renders the correct copy for ${RECOVERY_MAP.VACUUM_CARBOY_FULL_RETRY.ROUTE}`, () => {
    render({ route: RECOVERY_MAP.VACUUM_CARBOY_FULL_RETRY.ROUTE })

    screen.getByText('Empty waste and retry step')
  })

  it(`renders the correct copy for ${RECOVERY_MAP.VACUUM_CARBOY_FULL_SKIP.ROUTE}`, () => {
    render({ route: RECOVERY_MAP.VACUUM_CARBOY_FULL_SKIP.ROUTE })

    screen.getByText('Empty waste and skip step')
  })

  it(`renders the correct copy for ${RECOVERY_MAP.VACUUM_PRESSURE_NOT_REACHED_RETRY.ROUTE}`, () => {
    render({ route: RECOVERY_MAP.VACUUM_PRESSURE_NOT_REACHED_RETRY.ROUTE })

    screen.getByText('Inspect module and retry step')
  })

  it('renders "Unknown action" for an unknown recovery option', () => {
    render({ route: 'unknown_route' as RecoveryRoute })

    screen.getByText('Unknown action')
  })

  it('renders "Unknown action" for a null recovery option', () => {
    render({ route: null })

    screen.getByText('Unknown action')
  })
})
