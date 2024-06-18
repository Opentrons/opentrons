import * as React from 'react'

import { describe, it } from 'vitest'
import { screen } from '@testing-library/react'

import { useRecoveryOptionCopy } from '../useRecoveryOptionCopy'
import { RECOVERY_MAP } from '../../constants'

import type { RecoveryRoute } from '../../types'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'

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
  it(`renders the correct copy for ${RECOVERY_MAP.RETRY_FAILED_COMMAND.ROUTE}`, () => {
    render({ route: RECOVERY_MAP.RETRY_FAILED_COMMAND.ROUTE })

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

  it('renders "Unknown action" for an unknown recovery option', () => {
    render({ route: 'unknown_route' as RecoveryRoute })

    screen.getByText('Unknown action')
  })
})
