import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  Box,
  SPACING,
  TYPOGRAPHY,
  COLORS,
  Link,
  JUSTIFY_FLEX_END,
} from '@opentrons/components'
import { UpdateBuildroot } from '../../../../pages/Robots/RobotSettings/UpdateBuildroot'
import { Portal } from '../../../../App/portal'
import { StyledText } from '../../../../atoms/text'
import { getRobotApiVersion, UNREACHABLE } from '../../../../redux/discovery'
import { getBuildrootUpdateDisplayInfo } from '../../../../redux/buildroot'
import { UpdateRobotBanner } from '../../../UpdateRobotBanner'
import { useRobot } from '../../hooks'

import type { State } from '../../../../redux/types'

interface RobotServerVersionProps {
  robotName: string
}

const GITHUB_LINK =
  'https://github.com/Opentrons/opentrons/blob/edge/app-shell/build/release-notes.md'

export function RobotServerVersion({
  robotName,
}: RobotServerVersionProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared'])
  const robot = useRobot(robotName)
  const { autoUpdateAction } = useSelector((state: State) => {
    return getBuildrootUpdateDisplayInfo(state, robotName)
  })
  const [
    showSoftwareUpdateModal,
    setShowSoftwareUpdateModal,
  ] = React.useState<boolean>(false)

  const handleLaunchRobotUpdateModal = (): void => {
    setShowSoftwareUpdateModal(true)
  }
  const robotServerVersion =
    robot?.status != null ? getRobotApiVersion(robot) : null

  return (
    <>
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
      {autoUpdateAction !== 'reinstall' && robot != null ? (
        <Box marginBottom={SPACING.spacing4} width="100%">
          <UpdateRobotBanner
            robot={robot}
            handleLaunchRobotUpdateModal={handleLaunchRobotUpdateModal}
          />
        </Box>
      ) : (
        // TODO: add reinstall option
        <Flex justifyContent={JUSTIFY_FLEX_END}>
          <StyledText as="label" color={COLORS.darkGreyEnabled}>
            {t('robot_server_versions_status')}
          </StyledText>
        </Flex>
      )}
      <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <Box width="70%">
          <StyledText
            as="h2"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            paddingBottom={SPACING.spacing4}
            id="AdvancedSettings_RobotServerVersion"
          >
            {t('robot_server_versions')}
          </StyledText>
          <StyledText as="p" paddingBottom={SPACING.spacing2}>
            {robotServerVersion != null
              ? `v${robotServerVersion}`
              : t('robot_settings_advanced_unknown')}
          </StyledText>
          <StyledText as="p">
            {t('shared:view_latest_release_notes')}
            <Link
              external
              href={GITHUB_LINK}
              id="AdvancedSettings_GitHubLink"
              css={TYPOGRAPHY.linkPSemiBold}
            >{` ${t('shared:github')}`}</Link>
          </StyledText>
        </Box>
      </Flex>
    </>
  )
}
