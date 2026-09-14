import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  Box,
  COLORS,
  Flex,
  JUSTIFY_FLEX_END,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  Link,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { TertiaryButton } from '/app/atoms/buttons'
import { useIsFlex, useRobot } from '/app/redux-resources/robots'
import { getRobotApiVersion } from '/app/redux/discovery'
import { getRobotUpdateDisplayInfo } from '/app/redux/robot-update'

import { UpdateRobotBanner } from '../../../UpdateRobotBanner'
import { handleUpdateBuildroot } from '../UpdateBuildroot'

import type { ReactNode } from 'react'
import type { State } from '/app/redux/types'

interface RobotServerVersionProps {
  robotName: string
}

const GITHUB_LINK =
  'https://github.com/Opentrons/opentrons/blob/edge/api/release-notes.md'

export function RobotServerVersion({
  robotName,
}: RobotServerVersionProps): ReactNode {
  const { t } = useTranslation(['device_settings', 'shared', 'branded'])
  const robot = useRobot(robotName)
  const isFlex = useIsFlex(robotName)
  const { autoUpdateAction } = useSelector((state: State) => {
    return getRobotUpdateDisplayInfo(state, robotName)
  })

  const robotServerVersion =
    robot?.status != null ? getRobotApiVersion(robot) : null

  return (
    <>
      {autoUpdateAction !== 'reinstall' && robot != null ? (
        <Box marginBottom={SPACING.spacing16} width="100%">
          <UpdateRobotBanner robot={robot} />
        </Box>
      ) : null}
      <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <Box width="70%">
          <LegacyStyledText
            css={TYPOGRAPHY.pSemiBold}
            paddingBottom={SPACING.spacing4}
          >
            {t('robot_server_version')}
          </LegacyStyledText>
          <LegacyStyledText forwardedAs="p" paddingBottom={SPACING.spacing4}>
            {robotServerVersion != null
              ? `v${robotServerVersion}`
              : t('robot_settings_advanced_unknown')}
          </LegacyStyledText>
          {isFlex ? (
            <LegacyStyledText forwardedAs="p" paddingBottom={SPACING.spacing4}>
              {t('branded:robot_server_version_ot3_description')}
            </LegacyStyledText>
          ) : null}
          <LegacyStyledText forwardedAs="p">
            {t('shared:view_latest_release_notes')}
            <Link
              external
              href={GITHUB_LINK}
              css={TYPOGRAPHY.linkPSemiBold}
            >{` ${t('shared:github')}`}</Link>
          </LegacyStyledText>
        </Box>
        {autoUpdateAction !== 'reinstall' && robot != null ? null : (
          <Flex justifyContent={JUSTIFY_FLEX_END} alignItems={ALIGN_CENTER}>
            <LegacyStyledText
              forwardedAs="label"
              color={COLORS.grey50}
              paddingRight={SPACING.spacing16}
            >
              {t('up_to_date')}
            </LegacyStyledText>
            <TertiaryButton
              onClick={() => {
                handleUpdateBuildroot(robot)
              }}
              textTransform={TYPOGRAPHY.textTransformCapitalize}
            >
              {t('reinstall')}
            </TertiaryButton>
          </Flex>
        )}
      </Flex>
    </>
  )
}
