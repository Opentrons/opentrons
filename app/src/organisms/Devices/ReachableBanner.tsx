import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Banner } from '../../atoms/Banner'
import { REACHABLE } from '../../redux/discovery'
import { SPACING } from '@opentrons/components'
import type { DiscoveredRobot } from '../../redux/discovery/types'

interface ReachableBannerProps {
  robot: DiscoveredRobot
}

export function ReachableBanner(
  props: ReachableBannerProps
): JSX.Element | null {
  const { robot } = props
  const { t } = useTranslation('shared')
  return robot.status === REACHABLE ? (
    <Banner type="error" marginBottom={SPACING.spacing4}>
      {robot.serverHealthStatus === 'ok'
        ? t('robot_is_reachable_but_not_responding', {
            hostname: robot.ip,
          })
        : t('robot_was_seen_but_is_unreachable', {
            hostname: robot.ip,
          })}
    </Banner>
  ) : null
}
