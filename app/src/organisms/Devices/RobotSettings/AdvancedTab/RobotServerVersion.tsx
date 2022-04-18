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
import { StyledText } from '../../../../atoms/text'
import { Banner } from '../../../../atoms/Banner'
import { getRobotApiVersion } from '../../../../redux/discovery'
import { checkShellUpdate } from '../../../../redux/shell'
import { getBuildrootUpdateDisplayInfo } from '../../../../redux/buildroot'

import type { ViewableRobot } from '../../../../redux/discovery/types'
import type { State, Dispatch } from '../../../../redux/types'

interface RobotServerVersionProps {
  robot: ViewableRobot
  robotName: string
}

const UPDATE_RECHECK_DELAY_MS = 60000
const GITHUB_LINK =
  'https://github.com/Opentrons/opentrons/blob/edge/app-shell/build/release-notes.md'

export function RobotServerVersion({
  robot,
  robotName,
}: RobotServerVersionProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const dispatch = useDispatch<Dispatch>()
  const checkAppUpdate = React.useCallback(() => dispatch(checkShellUpdate()), [
    dispatch,
  ])
  const { autoUpdateAction, autoUpdateDisabledReason } = useSelector(
    (state: State) => {
      return getBuildrootUpdateDisplayInfo(state, robotName)
    }
  )
  const [showBanner, setShowBanner] = React.useState<boolean>(
    autoUpdateAction !== 'reinstall'
  )
  const robotServerVersion =
    (robot as ViewableRobot) != null ? getRobotApiVersion(robot) : null

  const updateDisabled = autoUpdateDisabledReason !== null // pass to modal

  const bannerMessage = `${t('robot_server_versions_banner_title')} ${t(
    'robot_server_versions_view_update'
  )}`

  // const ViewUpdateButton = (): JSX.Element => {
  //   <Link>
  //   </Link>
  // }

  // const SoftwareUpdateBanner = (): JSX.Element => {
  //   return(

  //   )
  // }

  // Display the banner when the autoUpdateAction is not reinstall which is upgrade or downgrade

  React.useEffect(() => {
    if (autoUpdateAction !== 'reinstall') {
      setShowBanner(true)
    }
  }, [])

  // check for available updates
  useInterval(checkAppUpdate, UPDATE_RECHECK_DELAY_MS)

  return (
    <>
      {showBanner ? (
        <Banner
          type="warning"
          onCloseClick={() => setShowBanner(false)}
          title={bannerMessage}
        ></Banner>
      ) : (
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
