// app info card with version and updated
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'

import {
  SPACING_AUTO,
  Flex,
  AlertItem,
  useMountEffect,
  Box,
  Text,
  Link,
  DIRECTION_ROW,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  TEXT_DECORATION_UNDERLINE,
  SPACING,
  TYPOGRAPHY,
  COLORS,
  ALIGN_START,
} from '@opentrons/components'
import { TertiaryButton, ToggleButton } from '../../atoms/Buttons'
import { ExternalLink } from '../../atoms/Link/ExternalLink'
import { Divider } from '../../atoms/structure'
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
import { useTrackEvent } from '../../redux/analytics'
import { UpdateAppModal } from '../UpdateAppModal'
import { PreviousVersionModal } from './PreviousVersionModal'

import type { Dispatch, State } from '../../redux/types'

const SOFTWARE_SYNC_URL =
  'https://support.opentrons.com/en/articles/1795303-get-started-update-your-ot-2#:~:text=It%E2%80%99s%20important%20to%20understand,that%20runs%20your%20protocols).'

const ENABLE_APP_UPDATE_NOTIFICATIONS = 'Enable app update notifications'
const EVENT_APP_UPDATE_NOTIFICATIONS_TOGGLED = 'appUpdateNotificationsToggled'

export function GeneralSettings(): JSX.Element {
  const { t } = useTranslation('app_settings')
  const dispatch = useDispatch<Dispatch>()
  const trackEvent = useTrackEvent()
  const [
    showPreviousVersionModal,
    setShowPreviousVersionModal,
  ] = React.useState(false)
  const updateAvailable = Boolean(useSelector(getAvailableShellUpdate))
  const [showUpdateModal, setShowUpdateModal] = React.useState(updateAvailable)
  const [showUpdateBanner, setShowUpdateBanner] = React.useState(
    updateAvailable
  )

  // may be enabled, disabled, or unknown (because config is loading)
  const enabled = useSelector((s: State) => {
    const ignored = getAlertIsPermanentlyIgnored(s, ALERT_APP_UPDATE_AVAILABLE)
    return ignored !== null ? !ignored : null
  })

  const handleToggle = (): void => {
    if (enabled !== null) {
      dispatch(
        enabled
          ? alertPermanentlyIgnored(ALERT_APP_UPDATE_AVAILABLE)
          : alertUnignored(ALERT_APP_UPDATE_AVAILABLE)
      )

      trackEvent({
        name: EVENT_APP_UPDATE_NOTIFICATIONS_TOGGLED,
        // this looks wierd, but the control is a toggle, which makes the next
        // "enabled" setting `!enabled`. Therefore the next "ignored" setting is
        // `!!enabled`, or just `enabled`
        properties: { updatesIgnored: enabled },
      })
    }
  }

  useMountEffect(() => {
    dispatch(checkShellUpdate())
  })
  return (
    <>
      <Box paddingX={SPACING.spacing4} paddingY={SPACING.spacing5}>
        {showUpdateBanner && (
          <Box marginBottom={SPACING.spacing4}>
            <AlertItem
              type="warning"
              title={
                <>
                  {t('update_available')}
                  <Link
                    textDecoration={TEXT_DECORATION_UNDERLINE}
                    onClick={() => setShowUpdateModal(true)}
                  >
                    {t('view_update')}
                  </Link>
                </>
              }
              onCloseClick={() => setShowUpdateBanner(false)}
            />
          </Box>
        )}
        <Flex
          flexDirection={DIRECTION_ROW}
          alignItems={updateAvailable ? ALIGN_CENTER : ALIGN_START}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          gridGap={SPACING.spacing4}
        >
          <Box width="70%">
            <Text css={TYPOGRAPHY.h3SemiBold} paddingBottom={SPACING.spacing3}>
              {t('software_version')}
            </Text>
            <Text css={TYPOGRAPHY.pRegular} paddingBottom={SPACING.spacing3}>
              {CURRENT_VERSION}
            </Text>
            <Link
              role="button"
              css={TYPOGRAPHY.pSemiBold}
              color={COLORS.blue}
              onClick={() => setShowPreviousVersionModal(true)}
            >
              {t('restore_previous')}
            </Link>
            <Text css={TYPOGRAPHY.pRegular} paddingY={SPACING.spacing3}>
              {t('manage_versions')}
            </Text>
            <ExternalLink css={TYPOGRAPHY.pSemiBold} href={SOFTWARE_SYNC_URL}>
              {t('versions_sync')}
            </ExternalLink>
          </Box>
          {updateAvailable ? (
            <TertiaryButton
              disabled={!updateAvailable}
              marginLeft={SPACING_AUTO}
              onClick={() => setShowUpdateModal(true)}
            >
              {t('view_software_update')}
            </TertiaryButton>
          ) : (
            <Text
              fontSize={TYPOGRAPHY.fontSizeCaption}
              lineHeight={TYPOGRAPHY.lineHeight12}
              color={COLORS.darkGreyEnabled}
              paddingY={SPACING.spacing5}
            >
              {t('up_to_date')}
            </Text>
          )}
        </Flex>
        <Divider marginY={SPACING.spacing5} />
        <Text css={TYPOGRAPHY.h3SemiBold} paddingBottom={SPACING.spacing3}>
          {t('update_alerts')}
        </Text>
        <Flex
          flexDirection={DIRECTION_ROW}
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
        >
          <Text css={TYPOGRAPHY.pRegular}>{t('receive_alert')}</Text>
          <ToggleButton
            label={ENABLE_APP_UPDATE_NOTIFICATIONS}
            marginRight={SPACING.spacing4}
            disabled={enabled === null}
            toggledOn={enabled === true}
            onClick={handleToggle}
          />
        </Flex>
        <Divider marginY={SPACING.spacing5} />
        <Flex
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
        >
          <Text css={TYPOGRAPHY.h3SemiBold} paddingBottom={SPACING.spacing3}>
            {t('connect_ip')}
          </Text>
          <TertiaryButton marginLeft={SPACING_AUTO}>
            {t('setup_connection')}
          </TertiaryButton>
        </Flex>
      </Box>
      {showUpdateModal ? (
        <UpdateAppModal closeModal={() => setShowUpdateModal(false)} />
      ) : null}
      {showPreviousVersionModal ? (
        <PreviousVersionModal
          closeModal={() => setShowPreviousVersionModal(false)}
        />
      ) : null}
    </>
  )
}
