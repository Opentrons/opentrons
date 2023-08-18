import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link as InternalLink } from 'react-router-dom'

import {
  ALIGN_CENTER,
  C_BLUE,
  C_TRANSPARENT,
  C_WHITE,
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  FONT_SIZE_BODY_1,
  FONT_SIZE_HEADER,
  FONT_STYLE_ITALIC,
  FONT_WEIGHT_REGULAR,
  JUSTIFY_FLEX_END,
  SIZE_4,
  SIZE_6,
  SPACING,
  useMountEffect,
  BaseModal,
  Btn,
  Box,
  Flex,
  Icon,
  SecondaryBtn,
  Text,
  TYPOGRAPHY,
} from '@opentrons/components'

import {
  getShellUpdateState,
  downloadShellUpdate,
  applyShellUpdate,
} from '../../redux/shell'

import { ErrorModal } from '../../molecules/modals'
import { ReleaseNotes } from '../../molecules/ReleaseNotes'

import type { Dispatch } from '../../redux/types'

export interface UpdateAppModalProps {
  dismissAlert?: (remember: boolean) => unknown
  closeModal?: () => unknown
}

// TODO(mc, 2020-10-06): i18n
const APP_VERSION = 'App Version'
const AVAILABLE = 'Available'
const DOWNLOADED = 'Downloaded'
const DOWNLOAD_IN_PROGRESS = 'Download in progress'
const DOWNLOAD = 'Download'
const RESTART_APP = 'Restart App'
const NOT_NOW = 'Not Now'
const OK = 'OK'
const UPDATE_ERROR = 'Update Error'
const SOMETHING_WENT_WRONG = 'Something went wrong while updating your app'
const TURN_OFF_UPDATE_NOTIFICATIONS = 'Turn off update notifications'
const YOUVE_TURNED_OFF_NOTIFICATIONS = "You've Turned Off Update Notifications"
const VIEW_APP_SOFTWARE_SETTINGS = 'View App Software Settings'
const NOTIFICATIONS_DISABLED_DESCRIPTION = (
  <>
    You{"'"}ve chosen to not be notified when an app update is available. You
    can change this setting under More {'>'} App {'>'}{' '}
    App&nbsp;Software&nbsp;Settings.
  </>
)

const FINISH_UPDATE_INSTRUCTIONS = (
  <>
    <Text marginBottom={SPACING.spacing16}>
      Restart your app to complete the update. Please note the following:
    </Text>
    <Box as="ol" paddingLeft={SPACING.spacing16}>
      <li>
        <Text marginBottom={SPACING.spacing8}>
          After updating the Opentrons App, <strong>update your robot</strong>{' '}
          to ensure the app and robot software is in sync.
        </Text>
      </li>
      <li>
        <Text>
          You should update the Opentrons App on <strong>all computers</strong>{' '}
          that you use with your robot.
        </Text>
      </li>
    </Box>
  </>
)

const SPINNER = (
  <BaseModal
    color={C_WHITE}
    backgroundColor={C_TRANSPARENT}
    fontSize={TYPOGRAPHY.fontSizeH3}
    fontStyle={FONT_STYLE_ITALIC}
  >
    <Flex alignItems={ALIGN_CENTER} flexDirection={DIRECTION_COLUMN}>
      <Icon spin name="ot-spinner" width={SIZE_4} />
      <Text marginTop={SPACING.spacing32}>{DOWNLOAD_IN_PROGRESS}</Text>
    </Flex>
  </BaseModal>
)

export function UpdateAppModal(props: UpdateAppModalProps): JSX.Element {
  const { dismissAlert, closeModal } = props
  const [updatesIgnored, setUpdatesIgnored] = React.useState(false)
  const dispatch = useDispatch<Dispatch>()
  const updateState = useSelector(getShellUpdateState)
  const { downloaded, downloading, error, info: updateInfo } = updateState
  const version = updateInfo?.version ?? ''
  const releaseNotes = updateInfo?.releaseNotes

  const handleUpdateClick = (): void => {
    dispatch(downloaded ? applyShellUpdate() : downloadShellUpdate())
  }

  // ensure close handlers are called on close button click or on component
  // unmount (for safety), but not both
  const latestHandleClose = React.useRef<(() => void) | null>(null)

  React.useEffect(() => {
    latestHandleClose.current = () => {
      if (typeof dismissAlert === 'function') dismissAlert(updatesIgnored)
      if (typeof closeModal === 'function') closeModal()
      latestHandleClose.current = null
    }
  })

  const handleCloseClick = (): void => {
    latestHandleClose.current && latestHandleClose.current()
  }

  useMountEffect(() => {
    return () => {
      latestHandleClose.current && latestHandleClose.current()
    }
  })

  if (error) {
    return (
      <ErrorModal
        error={error}
        heading={UPDATE_ERROR}
        description={SOMETHING_WENT_WRONG}
        close={handleCloseClick}
      />
    )
  }

  if (downloading) return SPINNER

  // TODO(mc, 2020-10-08): refactor most of this back into a new AlertModal
  // component built with BaseModal
  return (
    <BaseModal
      overlayColor="#737373e6"
      maxWidth="38rem"
      fontSize={TYPOGRAPHY.fontSizeH3}
      header={
        <Text
          as="h2"
          display={DISPLAY_FLEX}
          alignItems={ALIGN_CENTER}
          fontSize={FONT_SIZE_HEADER}
          fontWeight={FONT_WEIGHT_REGULAR}
        >
          <Icon name="alert" width="1em" marginRight={SPACING.spacing8} />
          {updatesIgnored
            ? YOUVE_TURNED_OFF_NOTIFICATIONS
            : `${APP_VERSION} ${version} ${
                downloaded ? DOWNLOADED : AVAILABLE
              }`}
        </Text>
      }
      footer={
        <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_FLEX_END}>
          {updatesIgnored ? (
            <>
              <SecondaryBtn
                as={InternalLink}
                to="/more/app"
                onClick={handleCloseClick}
                marginRight={SPACING.spacing16}
              >
                {VIEW_APP_SOFTWARE_SETTINGS}
              </SecondaryBtn>
              <SecondaryBtn onClick={handleCloseClick}>{OK}</SecondaryBtn>
            </>
          ) : (
            <>
              {dismissAlert != null && !downloaded ? (
                <Btn
                  color={C_BLUE}
                  marginRight={SPACING.spacingAuto}
                  fontSize={FONT_SIZE_BODY_1}
                  onClick={() => setUpdatesIgnored(true)}
                >
                  {TURN_OFF_UPDATE_NOTIFICATIONS}
                </Btn>
              ) : null}
              <SecondaryBtn
                marginRight={SPACING.spacing16}
                onClick={handleCloseClick}
              >
                {NOT_NOW}
              </SecondaryBtn>
              <SecondaryBtn onClick={handleUpdateClick}>
                {downloaded ? RESTART_APP : DOWNLOAD}
              </SecondaryBtn>
            </>
          )}
        </Flex>
      }
    >
      <Box maxWidth={SIZE_6}>
        {updatesIgnored ? (
          NOTIFICATIONS_DISABLED_DESCRIPTION
        ) : downloaded ? (
          FINISH_UPDATE_INSTRUCTIONS
        ) : (
          <ReleaseNotes source={releaseNotes} />
        )}
      </Box>
    </BaseModal>
  )
}
