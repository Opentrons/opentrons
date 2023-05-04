import { Portal } from '../../App/portal'
import { Banner } from '../../atoms/Banner'
import { StyledText } from '../../atoms/text'
import { getBuildrootUpdateDisplayInfo } from '../../redux/buildroot'
import { UNREACHABLE } from '../../redux/discovery'
import type { DiscoveredRobot } from '../../redux/discovery/types'
import type { State } from '../../redux/types'
import { UpdateBuildroot } from '../Devices/RobotSettings/UpdateBuildroot'
import {
  Flex,
  SPACING,
  TYPOGRAPHY,
  Btn,
  DIRECTION_COLUMN,
} from '@opentrons/components'
import type { StyleProps } from '@opentrons/components'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

interface UpdateRobotBannerProps extends StyleProps {
  robot: DiscoveredRobot
}

export function UpdateRobotBanner(
  props: UpdateRobotBannerProps
): JSX.Element | null {
  const { robot, ...styleProps } = props
  const { t } = useTranslation('device_settings')

  const { autoUpdateAction } = useSelector((state: State) => {
    return getBuildrootUpdateDisplayInfo(state, robot?.name)
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
