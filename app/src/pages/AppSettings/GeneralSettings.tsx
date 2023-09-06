// app info card with version and updated
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'

import {
  SPACING_AUTO,
  Flex,
  useMountEffect,
  Box,
  Link,
  DIRECTION_ROW,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
  COLORS,
  ALIGN_START,
  DIRECTION_COLUMN,
} from '@opentrons/components'

import { TertiaryButton, ToggleButton } from '../../atoms/buttons'
import { ExternalLink } from '../../atoms/Link/ExternalLink'
import { Divider } from '../../atoms/structure'
import { StyledText } from '../../atoms/text'
import { Banner } from '../../atoms/Banner'
import {
  CURRENT_VERSION,
  getAvailableShellUpdate,
  checkShellUpdate,
} from '../../redux/shell'
import {
  ALERT_APP_UPDATE_AVAILABLE,
  getAlertIsPermanentlyIgnored,
  alertPermanentlyIgnored,
  alertUnignored,
} from '../../redux/alerts'
import {
  useTrackEvent,
  ANALYTICS_APP_UPDATE_NOTIFICATIONS_TOGGLED,
} from '../../redux/analytics'
import { UpdateAppModal } from '../../organisms/UpdateAppModal'
import { PreviousVersionModal } from '../../organisms/AppSettings/PreviousVersionModal'
import { ConnectRobotSlideout } from '../../organisms/AppSettings/ConnectRobotSlideout'
import { Portal } from '../../App/portal'

import type { Dispatch, State } from '../../redux/types'

const SOFTWARE_SYNC_URL =
  'https://support.opentrons.com/s/article/Get-started-Update-your-OT-2'
const GITHUB_LINK =
  'https://github.com/Opentrons/opentrons/blob/edge/app-shell/build/release-notes.md'

const ENABLE_APP_UPDATE_NOTIFICATIONS = 'Enable app update notifications'

export function GeneralSettings(): JSX.Element {
  const { t } = useTranslation(['app_settings', 'shared'])
  const dispatch = useDispatch<Dispatch>()
  const trackEvent = useTrackEvent()
  const [
    showPreviousVersionModal,
    setShowPreviousVersionModal,
  ] = React.useState<boolean>(false)
  const updateAvailable = Boolean(useSelector(getAvailableShellUpdate))
  const [showUpdateBanner, setShowUpdateBanner] = React.useState<boolean>(
    updateAvailable
  )
  const [
    showConnectRobotSlideout,
    setShowConnectRobotSlideout,
  ] = React.useState(false)

  // may be enabled, disabled, or unknown (because config is loading)
  const updateAlertEnabled = useSelector((s: State) => {
    const ignored = getAlertIsPermanentlyIgnored(s, ALERT_APP_UPDATE_AVAILABLE)
    return ignored !== null ? !ignored : null
  })
  const [showUpdateModal, setShowUpdateModal] = React.useState<boolean>(false)
  const handleToggle = (): void => {
    if (updateAlertEnabled !== null) {
      dispatch(
        updateAlertEnabled
          ? alertPermanentlyIgnored(ALERT_APP_UPDATE_AVAILABLE)
          : alertUnignored(ALERT_APP_UPDATE_AVAILABLE)
      )

      trackEvent({
        name: ANALYTICS_APP_UPDATE_NOTIFICATIONS_TOGGLED,
        // this looks weird, but the control is a toggle, which makes the next
        // "enabled" setting `!enabled`. Therefore the next "ignored" setting is
        // `!!enabled`, or just `enabled`
        properties: { updatesIgnored: updateAlertEnabled },
      })
    }
  }

  useMountEffect(() => {
    dispatch(checkShellUpdate())
  })
  return (
    <>
      <Box
        height="calc(100vh - 8.5rem)"
        paddingX={SPACING.spacing16}
        paddingY={SPACING.spacing24}
      >
        {showUpdateBanner && (
          <Box
            marginBottom={SPACING.spacing16}
            id="GeneralSettings_updatebanner"
          >
            <Banner
              type="warning"
              onCloseClick={() => setShowUpdateBanner(false)}
            >
              {t('opentrons_app_update_available_variation')}
              <Link
                textDecoration={TYPOGRAPHY.textDecorationUnderline}
                role="button"
                onClick={() => setShowUpdateModal(true)}
                marginLeft={SPACING.spacing4}
              >
                {t('view_update')}
              </Link>
            </Banner>
          </Box>
        )}
        <Box>
          <Flex
            flexDirection={DIRECTION_ROW}
            alignItems={updateAvailable ? ALIGN_CENTER : ALIGN_START}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            gridGap={SPACING.spacing16}
          >
            {showConnectRobotSlideout && (
              <ConnectRobotSlideout
                isExpanded={showConnectRobotSlideout}
                onCloseClick={() => setShowConnectRobotSlideout(false)}
              />
            )}
            <Box width="65%">
              <StyledText
                css={TYPOGRAPHY.h3SemiBold}
                paddingBottom={SPACING.spacing8}
              >
                {t('software_version')}
              </StyledText>
              <StyledText
                as="p"
                paddingBottom={SPACING.spacing8}
                id="GeneralSettings_currentVersion"
              >
                {CURRENT_VERSION}
              </StyledText>
              <StyledText as="p">
                {t('shared:view_latest_release_notes')}
                <Link
                  external
                  href={GITHUB_LINK}
                  css={TYPOGRAPHY.linkPSemiBold}
                  id="GeneralSettings_GitHubLink"
                >{` ${t('shared:github')}`}</Link>
              </StyledText>
            </Box>
            {updateAvailable ? (
              <TertiaryButton
                disabled={!updateAvailable}
                marginLeft={SPACING_AUTO}
                onClick={() => setShowUpdateModal(true)}
                id="GeneralSettings_softwareUpdate"
              >
                {t('view_software_update')}
              </TertiaryButton>
            ) : (
              <StyledText
                fontSize={TYPOGRAPHY.fontSizeLabel}
                lineHeight={TYPOGRAPHY.lineHeight12}
                color={COLORS.darkGreyEnabled}
                paddingY={SPACING.spacing24}
              >
                {t('up_to_date')}
              </StyledText>
            )}
          </Flex>
          <Box width="70%">
            <StyledText as="p" paddingY={SPACING.spacing8}>
              {t('manage_versions')}
            </StyledText>
          </Box>
          <Box>
            <Flex flexDirection={DIRECTION_COLUMN}>
              <Link
                role="button"
                css={TYPOGRAPHY.linkPSemiBold}
                onClick={() => setShowPreviousVersionModal(true)}
                id="GeneralSettings_previousVersionLink"
              >
                {t('restore_previous')}
              </Link>
              <ExternalLink
                href={SOFTWARE_SYNC_URL}
                id="GeneralSettings_appAndRobotSync"
              >
                {t('versions_sync')}
              </ExternalLink>
            </Flex>
          </Box>
        </Box>
        <Divider marginY={SPACING.spacing24} />
        <StyledText
          css={TYPOGRAPHY.h3SemiBold}
          paddingBottom={SPACING.spacing8}
        >
          {t('update_alerts')}
        </StyledText>
        <Flex
          flexDirection={DIRECTION_ROW}
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
        >
          <StyledText as="p">{t('receive_alert')}</StyledText>
          <ToggleButton
            label={ENABLE_APP_UPDATE_NOTIFICATIONS}
            marginRight={SPACING.spacing16}
            disabled={updateAlertEnabled === null}
            toggledOn={updateAlertEnabled === true}
            onClick={handleToggle}
            id="GeneralSettings_softwareUpdateAlerts"
          />
        </Flex>
        <Divider marginY={SPACING.spacing24} />
        <Flex
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
        >
          <StyledText
            css={TYPOGRAPHY.h3SemiBold}
            paddingBottom={SPACING.spacing8}
          >
            {t('connect_ip')}
          </StyledText>
          <TertiaryButton
            marginLeft={SPACING_AUTO}
            id="GeneralSettings_setUpConnection"
            onClick={() => setShowConnectRobotSlideout(true)}
          >
            {t('setup_connection')}
          </TertiaryButton>
        </Flex>
      </Box>
      {showUpdateModal ? (
        <Portal level="top">
          <UpdateAppModal closeModal={() => setShowUpdateModal(false)} />
        </Portal>
      ) : null}
      {showPreviousVersionModal ? (
        <PreviousVersionModal
          closeModal={() => setShowPreviousVersionModal(false)}
        />
      ) : null}
    </>
  )
}
