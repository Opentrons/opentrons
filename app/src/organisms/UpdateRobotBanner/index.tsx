import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  SPACING,
  TYPOGRAPHY,
  Btn,
  useInterval,
} from '@opentrons/components'
import { Portal } from '../../App/portal'
import { StyledText } from '../../atoms/text'
import { Banner } from '../../atoms/Banner'
import { UNREACHABLE } from '../../redux/discovery'
import { checkShellUpdate } from '../../redux/shell'
import { getBuildrootUpdateDisplayInfo } from '../../redux/buildroot'
import { UpdateBuildroot } from '../Devices/RobotSettings/UpdateBuildroot'

import type { StyleProps } from '@opentrons/components'
import type { State, Dispatch } from '../../redux/types'
import type { DiscoveredRobot } from '../../redux/discovery/types'

interface UpdateRobotBannerProps extends StyleProps {
  robot: DiscoveredRobot
}

const UPDATE_RECHECK_DELAY_MS = 60000

export function UpdateRobotBanner(props: UpdateRobotBannerProps): JSX.Element {
  const { robot, ...styleProps } = props
  const { t } = useTranslation('device_settings')
  const dispatch = useDispatch<Dispatch>()
  const checkAppUpdate = React.useCallback(() => dispatch(checkShellUpdate()), [
    dispatch,
  ])
  const { autoUpdateAction } = useSelector((state: State) => {
    return getBuildrootUpdateDisplayInfo(state, robot.name)
  })
  const [
    showSoftwareUpdateModal,
    setShowSoftwareUpdateModal,
  ] = React.useState<boolean>(false)

  // check for available updates
  useInterval(
    checkAppUpdate,
    autoUpdateAction === 'upgrade' || autoUpdateAction === 'downgrade'
      ? 1000
      : UPDATE_RECHECK_DELAY_MS
  )
  const handleLaunchModal: React.MouseEventHandler = e => {
    e.preventDefault()
    e.stopPropagation()
    setShowSoftwareUpdateModal(true)
  }
  const handleCloseBanner: React.MouseEventHandler = e => {
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <Flex onClick={e => e.stopPropagation()}>
      {autoUpdateAction === 'upgrade' || autoUpdateAction === 'downgrade' ? (
        <Banner type="warning" onCloseClick={handleCloseBanner} {...styleProps}>
          <StyledText as="p" marginRight={SPACING.spacing2}>
            {t('robot_server_versions_banner_title')}
          </StyledText>
          <Btn
            onClick={handleLaunchModal}
            css={TYPOGRAPHY.pRegular}
            textDecoration={TYPOGRAPHY.textDecorationUnderline}
          >
            {t('robot_server_versions_view_update')}
          </Btn>
        </Banner>
      ) : null}
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
  )
}
