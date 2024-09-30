import { useTranslation } from 'react-i18next'
import { SPACING, Banner } from '@opentrons/components'
import { REACHABLE } from '/app/redux/discovery'

import type { DiscoveredRobot } from '/app/redux/discovery/types'

interface ReachableBannerProps {
  robot: DiscoveredRobot
}

export function ReachableBanner(
  props: ReachableBannerProps
): JSX.Element | null {
  const { robot } = props
  const { t } = useTranslation('shared')
  return robot.status === REACHABLE && robot.serverHealthStatus === 'ok' ? (
    <Banner
      type="error"
      marginRight={SPACING.spacing24}
      iconMarginLeft={SPACING.spacing4}
    >
      {t('robot_is_reachable_but_not_responding', {
        hostname: robot.ip,
      })}
    </Banner>
  ) : null
}
