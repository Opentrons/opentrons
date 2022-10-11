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
import { StyledText } from '../../../../atoms/text'
import { Portal } from '../../../../App/portal'
import { getRobotApiVersion, UNREACHABLE } from '../../../../redux/discovery'
import { getBuildrootUpdateDisplayInfo } from '../../../../redux/buildroot'
import { UpdateRobotBanner } from '../../../UpdateRobotBanner'
import { useIsOT3, useRobot } from '../../hooks'
import { UpdateBuildroot } from '../UpdateBuildroot'

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
  const isOT3 = useIsOT3(robotName)
  const [showVersionInfoModal, setShowVersionInfoModal] = React.useState(false)
  const { autoUpdateAction } = useSelector((state: State) => {
    return getBuildrootUpdateDisplayInfo(state, robotName)
  })

  const robotServerVersion =
    robot?.status != null ? getRobotApiVersion(robot) : null

  return (
    <>
      {showVersionInfoModal && robot != null && robot.status !== UNREACHABLE ? (
        <Portal level="top">
          <UpdateBuildroot
            robot={robot}
            close={() => setShowVersionInfoModal(false)}
          />
        </Portal>
      ) : null}
      {autoUpdateAction !== 'reinstall' && robot != null ? (
        <Box marginBottom={SPACING.spacing4} width="100%">
          <UpdateRobotBanner robot={robot} />
        </Box>
      ) : null}
      <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <Box width="70%">
          <StyledText
            css={TYPOGRAPHY.pSemiBold}
            paddingBottom={SPACING.spacing2}
            id="AdvancedSettings_RobotServerVersion"
          >
            {t('robot_server_version')}
          </StyledText>
          <StyledText as="p" paddingBottom={SPACING.spacing2}>
            {robotServerVersion != null
              ? `v${robotServerVersion}`
              : t('robot_settings_advanced_unknown')}
          </StyledText>
          {isOT3 ? (
            <StyledText as="p" paddingBottom={SPACING.spacing2}>
              {t('robot_server_version_ot3_description')}
            </StyledText>
          ) : null}
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
        {autoUpdateAction !== 'reinstall' && robot != null ? null : (
          <Flex justifyContent={JUSTIFY_FLEX_END} alignItems="center">
            <StyledText as="label" color={COLORS.darkGreyEnabled}>
              {t('up_to_date')}
            </StyledText>
          </Flex>
        )}
      </Flex>
    </>
  )
}
