// @flow
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import {
  ALIGN_CENTER,
  C_WHITE,
  C_TRANSPARENT,
  DIRECTION_COLUMN,
  FONT_SIZE_BODY_2,
  FONT_SIZE_HEADER,
  FONT_STYLE_ITALIC,
  FONT_WEIGHT_REGULAR,
  JUSTIFY_FLEX_END,
  SIZE_4,
  SPACING_2,
  SPACING_3,
  SPACING_4,
  BaseModal,
  Box,
  Flex,
  Icon,
  SecondaryBtn,
  Text,
} from '@opentrons/components'

import {
  getShellUpdateState,
  downloadShellUpdate,
  applyShellUpdate,
} from '../../shell'

import { Portal } from '../portal'
import { ErrorModal } from '../modals'
import { ReleaseNotes } from '../ReleaseNotes'

import type { Dispatch } from '../../types'

export type UpdateAppModalProps = {|
  closeModal: () => mixed,
|}

// TODO(mc, 2020-10-06): i18n
const APP_VERSION = 'App Version'
const AVAILABLE = 'Available'
const DOWNLOADED = 'Downloaded'
const DOWNLOAD_IN_PROGRESS = 'Download in progress'
const DOWNLOAD = 'Download'
const RESTART_APP = 'Restart App'
const NOT_NOW = 'Not Now'
const UPDATE_ERROR = 'Update Error'
const SOMETHING_WENT_WRONG = 'Something went wrong while updating your app'

const FINISH_UPDATE_INSTRUCTIONS = (
  <>
    <Text marginBottom={SPACING_3}>
      Restart your app to complete the update. Please note the following:
    </Text>
    <Box as="ol" paddingLeft={SPACING_3}>
      <li>
        <Text marginBottom={SPACING_2}>
          After updating the Opentrons App, <strong>update your OT-2</strong> to
          ensure the app and robot software is in sync.
        </Text>
      </li>
      <li>
        <Text>
          You should update the Opentrons App on <strong>all computers</strong>{' '}
          that you use with your OT-2.
        </Text>
      </li>
    </Box>
  </>
)

const SPINNER = (
  <Portal>
    <BaseModal
      color={C_WHITE}
      backgroundColor={C_TRANSPARENT}
      fontSize={FONT_SIZE_BODY_2}
      fontStyle={FONT_STYLE_ITALIC}
    >
      <Flex alignItems={ALIGN_CENTER} flexDirection={DIRECTION_COLUMN}>
        <Icon spin name="ot-spinner" width={SIZE_4} />
        <Text marginTop={SPACING_4}>{DOWNLOAD_IN_PROGRESS}</Text>
      </Flex>
    </BaseModal>
  </Portal>
)

export function UpdateAppModal(props: UpdateAppModalProps): React.Node {
  const { closeModal } = props
  const dispatch = useDispatch<Dispatch>()
  const updateState = useSelector(getShellUpdateState)
  const { downloaded, downloading, error, info: updateInfo } = updateState
  const version = updateInfo?.version ?? ''
  const releaseNotes = updateInfo?.releaseNotes

  const updateButtonText = downloaded ? RESTART_APP : DOWNLOAD
  const handleUpdateButtonClick = () => {
    dispatch(downloaded ? applyShellUpdate() : downloadShellUpdate())
  }

  if (error) {
    return (
      <ErrorModal
        error={error}
        heading={UPDATE_ERROR}
        description={SOMETHING_WENT_WRONG}
        close={closeModal}
      />
    )
  }

  if (downloading) return SPINNER

  return (
    <Portal>
      <BaseModal
        fontSize={FONT_SIZE_BODY_2}
        header={
          <Flex alignItems={ALIGN_CENTER}>
            <Icon name="alert" width="1em" marginRight={SPACING_2} />
            <Text
              as="h2"
              fontSize={FONT_SIZE_HEADER}
              fontWeight={FONT_WEIGHT_REGULAR}
            >
              {APP_VERSION} {version} {downloaded ? DOWNLOADED : AVAILABLE}
            </Text>
          </Flex>
        }
        footer={
          <Flex justifyContent={JUSTIFY_FLEX_END}>
            <SecondaryBtn marginRight={SPACING_3} onClick={closeModal}>
              {NOT_NOW}
            </SecondaryBtn>
            <SecondaryBtn onClick={handleUpdateButtonClick}>
              {updateButtonText}
            </SecondaryBtn>
          </Flex>
        }
      >
        {downloaded ? (
          FINISH_UPDATE_INSTRUCTIONS
        ) : (
          <ReleaseNotes source={releaseNotes} />
        )}
      </BaseModal>
    </Portal>
  )
}
