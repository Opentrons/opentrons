import * as React from 'react'
import { beforeEach, describe, it, vi } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { RecoveryInProgress } from '../RecoveryInProgress'
import { ERROR_KINDS, RECOVERY_MAP } from '../constants'

const render = (props: React.ComponentProps<typeof RecoveryInProgress>) => {
  return renderWithProviders(<RecoveryInProgress {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('RecoveryInProgress', () => {
  const { ROBOT_IN_MOTION, ROBOT_RESUMING } = RECOVERY_MAP
  let props: React.ComponentProps<typeof RecoveryInProgress>

  beforeEach(() => {
    props = {
      isOnDevice: true,
      errorKind: ERROR_KINDS.GENERAL_ERROR,
      onComplete: vi.fn(),
      routeUpdateActions: vi.fn() as any,
      recoveryMap: {
        route: ROBOT_IN_MOTION.ROUTE,
        step: ROBOT_IN_MOTION.STEPS.IN_MOTION,
      },
    }
  })

  it(`renders appropriate copy when the route is ${ROBOT_IN_MOTION.ROUTE}`, () => {
    render(props)

    screen.getByText('Stand back, robot is in motion')
  })

  it(`renders appropriate copy when the route is ${ROBOT_RESUMING.ROUTE}`, () => {
    props = {
      ...props,
      recoveryMap: {
        route: ROBOT_RESUMING.ROUTE,
        step: ROBOT_RESUMING.STEPS.RESUMING,
      },
    }
    render(props)

    screen.getByText('Stand back, resuming current step')
  })
})
