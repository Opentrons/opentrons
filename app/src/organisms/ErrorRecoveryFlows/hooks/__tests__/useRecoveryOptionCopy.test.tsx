import type * as React from 'react'

import { describe, it } from 'vitest'
import { screen } from '@testing-library/react'

import { useRecoveryOptionCopy } from '../useRecoveryOptionCopy'
import { RECOVERY_MAP } from '../../constants'

import type { RecoveryRoute } from '../../types'
import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

function MockRenderCmpt({
  route,
}: {
  route: RecoveryRoute | null
}): JSX.Element {
  const getRecoveryOptionCopy = useRecoveryOptionCopy()

  return <div>{getRecoveryOptionCopy(route)}</div>
}

const render = (props: React.ComponentProps<typeof MockRenderCmpt>) => {
  return renderWithProviders(<MockRenderCmpt {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('useRecoveryOptionCopy', () => {
  it(`renders the correct copy for ${RECOVERY_MAP.RETRY_STEP.ROUTE}`, () => {
    render({ route: RECOVERY_MAP.RETRY_STEP.ROUTE })

    screen.getByText('Retry step')
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

  it(`renders the correct copy for ${RECOVERY_MAP.MANUAL_FILL_AND_SKIP.ROUTE}`, () => {
    render({ route: RECOVERY_MAP.MANUAL_FILL_AND_SKIP.ROUTE })

    screen.getByText('Manually fill well and skip to next step')
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

  it('renders "Unknown action" for an unknown recovery option', () => {
    render({ route: 'unknown_route' as RecoveryRoute })

    screen.getByText('Unknown action')
  })
})
