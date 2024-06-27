import * as React from 'react'
import { beforeEach, describe, it } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { mockRecoveryContentProps } from '../__fixtures__'
import { RecoveryInProgress } from '../RecoveryInProgress'
import { RECOVERY_MAP } from '../constants'

const render = (props: React.ComponentProps<typeof RecoveryInProgress>) => {
  return renderWithProviders(<RecoveryInProgress {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('RecoveryInProgress', () => {
  const {
    ROBOT_CANCELING,
    ROBOT_IN_MOTION,
    ROBOT_RESUMING,
    ROBOT_RETRYING_STEP,
    ROBOT_PICKING_UP_TIPS,
  } = RECOVERY_MAP
  let props: React.ComponentProps<typeof RecoveryInProgress>

  beforeEach(() => {
    props = {
      ...mockRecoveryContentProps,
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

  it(`renders appropriate copy when the route is ${ROBOT_RETRYING_STEP.ROUTE}`, () => {
    props = {
      ...props,
      recoveryMap: {
        route: ROBOT_RETRYING_STEP.ROUTE,
        step: ROBOT_RETRYING_STEP.STEPS.RETRYING,
      },
    }
    render(props)

    screen.getByText('Stand back, retrying failed step')
  })

  it(`renders appropriate copy when the route is ${ROBOT_CANCELING.ROUTE}`, () => {
    props = {
      ...props,
      recoveryMap: {
        route: ROBOT_CANCELING.ROUTE,
        step: ROBOT_CANCELING.STEPS.CANCELING,
      },
    }
    render(props)

    screen.getByText('Canceling run')
  })

  it(`renders appropriate copy when the route is ${ROBOT_PICKING_UP_TIPS.ROUTE}`, () => {
    props = {
      ...props,
      recoveryMap: {
        route: ROBOT_PICKING_UP_TIPS.ROUTE,
        step: ROBOT_PICKING_UP_TIPS.STEPS.PICKING_UP_TIPS,
      },
    }
    render(props)

    screen.getByText('Stand back, picking up tips')
  })
})
