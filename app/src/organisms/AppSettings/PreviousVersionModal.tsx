import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Box,
  Flex,
  JUSTIFY_FLEX_END,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { Modal } from '../../atoms/Modal'
import { ExternalLink } from '../../atoms/Link/ExternalLink'
import { PrimaryButton } from '../../atoms/Buttons'
import { StyledText } from '../../atoms/text'

export const UNINSTALL_APP_URL =
  'https://support.opentrons.com/en/articles/2393514-uninstall-the-opentrons-app'

export const PREVIOUS_RELEASES_URL =
  'https://github.com/Opentrons/opentrons/releases'

interface PreviousVersionModalProps {
  closeModal: () => void
}

export function PreviousVersionModal(
  props: PreviousVersionModalProps
): JSX.Element {
  const { t } = useTranslation('app_settings')

  return (
    <Modal onClose={props.closeModal} title={t('how_to_restore')}>
      <Box>
        <StyledText as="p" paddingBottom={SPACING.spacing3}>
          {t('restore_description')}
        </StyledText>
        <ExternalLink
          href={UNINSTALL_APP_URL}
          paddingBottom={SPACING.spacing3}
          css={TYPOGRAPHY.pSemiBold}
          id="PreviousVersionModal_uninstallingAppLink"
        >
          {t('learn_uninstalling')}
        </ExternalLink>
        <br />
        <ExternalLink
          href={PREVIOUS_RELEASES_URL}
          css={TYPOGRAPHY.pSemiBold}
          id="PreviousVersionModal_previousReleases"
        >
          {t('previous_releases')}
        </ExternalLink>
      </Box>
      <Flex justifyContent={JUSTIFY_FLEX_END}>
        <PrimaryButton
          marginTop={SPACING.spacing5}
          onClick={props.closeModal}
          id="PreviousVersionModal_closeButton"
        >
          {t('close')}
        </PrimaryButton>
      </Flex>
    </Modal>
  )
}
