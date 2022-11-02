import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { SPACING } from '@opentrons/components'
import { Banner } from '../../atoms/Banner'
import { REACHABLE } from '../../redux/discovery'

import type { DiscoveredRobot } from '../../redux/discovery/types'

interface ReachableBannerProps {
  robot: DiscoveredRobot
}

export function ReachableBanner(
  props: ReachableBannerProps
): JSX.Element | null {
  const { robot } = props
  const { t } = useTranslation('shared')
  return robot.status === REACHABLE && robot.serverHealthStatus === 'ok' ? (
    <Banner type="error" marginRight={SPACING.spacing5}>
      {t('robot_is_reachable_but_not_responding', {
        hostname: robot.ip,
      })}
    </Banner>
  ) : null
}
