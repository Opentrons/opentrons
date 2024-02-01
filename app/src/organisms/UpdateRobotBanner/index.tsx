import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  SPACING,
  TYPOGRAPHY,
  Btn,
  DIRECTION_COLUMN,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { Banner } from '../../atoms/Banner'
import { getRobotUpdateDisplayInfo } from '../../redux/robot-update'
import { handleUpdateBuildroot } from '../Devices/RobotSettings/UpdateBuildroot'

import type { StyleProps } from '@opentrons/components'
import type { State } from '../../redux/types'
import type { DiscoveredRobot } from '../../redux/discovery/types'

interface UpdateRobotBannerProps extends StyleProps {
  robot: DiscoveredRobot
}

export function UpdateRobotBanner(
  props: UpdateRobotBannerProps
): JSX.Element | null {
  const { robot, ...styleProps } = props
  const { t } = useTranslation('device_settings')

  const { autoUpdateAction } = useSelector((state: State) => {
    return getRobotUpdateDisplayInfo(state, robot?.name)
  })

  return (autoUpdateAction === 'upgrade' || autoUpdateAction === 'downgrade') &&
    robot !== null &&
    robot.healthStatus === 'ok' ? (
    <Flex onClick={(e: React.MouseEvent) => e.stopPropagation()} flexDirection={DIRECTION_COLUMN}>
      <Banner type="error" {...styleProps}>
        <StyledText as="p" marginRight={SPACING.spacing4}>
          {t('robot_software_update_required')}
        </StyledText>
        <Btn
          onClick={() => handleUpdateBuildroot(robot)}
          css={TYPOGRAPHY.pRegular}
          textDecoration={TYPOGRAPHY.textDecorationUnderline}
        >
          {t('view_update')}
        </Btn>
      </Banner>
    </Flex>
  ) : null
}
