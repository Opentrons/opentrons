import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
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
  useInterval,
  JUSTIFY_FLEX_END,
} from '@opentrons/components'
import { useRobot } from '../../hooks'
import { StyledText } from '../../../../atoms/text'
import { Banner } from '../../../../atoms/Banner'
import { getRobotApiVersion } from '../../../../redux/discovery'
import { checkShellUpdate } from '../../../../redux/shell'
import { getBuildrootUpdateDisplayInfo } from '../../../../redux/buildroot'

import type { State, Dispatch } from '../../../../redux/types'

interface RobotServerVersionProps {
  robotName: string
  updateSoftwareUpdateModal: (isOpen: boolean) => void
}

const UPDATE_RECHECK_DELAY_MS = 60000
const GITHUB_LINK =
  'https://github.com/Opentrons/opentrons/blob/edge/app-shell/build/release-notes.md'

export function RobotServerVersion({
  robotName,
  updateSoftwareUpdateModal,
}: RobotServerVersionProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const dispatch = useDispatch<Dispatch>()
  const robot = useRobot(robotName)
  const checkAppUpdate = React.useCallback(() => dispatch(checkShellUpdate()), [
    dispatch,
  ])
  const { autoUpdateAction } = useSelector((state: State) => {
    return getBuildrootUpdateDisplayInfo(state, robotName)
  })
  const [showUpdateBanner, setShowUpdateBanner] = React.useState<boolean>(
    autoUpdateAction !== 'reinstall'
  )
  const robotServerVersion =
    robot?.status != null ? getRobotApiVersion(robot) : null

  // check for available updates
  useInterval(checkAppUpdate, UPDATE_RECHECK_DELAY_MS)

  return (
    <>
      {showUpdateBanner ? (
        <Box marginBottom={SPACING.spacing4} width="100%">
          <Banner
            type="warning"
            onCloseClick={() => setShowUpdateBanner(false)}
          >
            <StyledText as="p" marginRight={SPACING.spacing2}>
              {t('robot_server_versions_banner_title')}
            </StyledText>
            <Link
              onClick={() => updateSoftwareUpdateModal(true)}
              css={TYPOGRAPHY.pRegular}
              textDecoration={TYPOGRAPHY.textDecorationUnderline}
            >
              {t('robot_server_versions_view_update')}
            </Link>
          </Banner>
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
            as="h3"
            css={TYPOGRAPHY.h3SemiBold}
            paddingBottom={SPACING.spacing3}
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
            {t('robot_server_versions_description')}
            <Link
              external
              href={GITHUB_LINK}
              id="AdvancedSettings_GitHubLink"
            >{` ${t('github')}`}</Link>
          </StyledText>
        </Box>
      </Flex>
    </>
  )
}
