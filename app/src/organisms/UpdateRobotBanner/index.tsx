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
import { Portal } from '../../App/portal'
import { StyledText } from '../../atoms/text'
import { Banner } from '../../atoms/Banner'
import { UNREACHABLE } from '../../redux/discovery'
import { getRobotUpdateDisplayInfo } from '../../redux/robot-update'
import { UpdateBuildroot } from '../Devices/RobotSettings/UpdateBuildroot'

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
  const [
    showSoftwareUpdateModal,
    setShowSoftwareUpdateModal,
  ] = React.useState<boolean>(false)

  const handleLaunchModal: React.MouseEventHandler = e => {
    e.preventDefault()
    e.stopPropagation()
    setShowSoftwareUpdateModal(true)
  }

  return (autoUpdateAction === 'upgrade' || autoUpdateAction === 'downgrade') &&
    robot !== null &&
    robot.healthStatus === 'ok' ? (
    <Flex onClick={e => e.stopPropagation()} flexDirection={DIRECTION_COLUMN}>
      <Banner type="error" {...styleProps}>
        <StyledText as="p" marginRight={SPACING.spacing4}>
          {t('robot_software_update_required')}
        </StyledText>
        <Btn
          onClick={handleLaunchModal}
          css={TYPOGRAPHY.pRegular}
          textDecoration={TYPOGRAPHY.textDecorationUnderline}
        >
          {t('view_update')}
        </Btn>
      </Banner>
      {showSoftwareUpdateModal &&
      robot != null &&
      robot.status !== UNREACHABLE ? (
        <Portal level="top">
          <UpdateBuildroot
            robot={robot}
            close={() => setShowSoftwareUpdateModal(false)}
          />
        </Portal>
      ) : null}
    </Flex>
  ) : null
}
