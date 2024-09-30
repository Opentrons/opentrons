import { useTranslation } from 'react-i18next'
import {
  Box,
  Flex,
  JUSTIFY_FLEX_END,
  PrimaryButton,
  SPACING,
  LegacyStyledText,
  Modal,
} from '@opentrons/components'

import { ExternalLink } from '/app/atoms/Link/ExternalLink'

export const UNINSTALL_APP_URL =
  'https://support.opentrons.com/s/article/Uninstall-the-Opentrons-App'
export const PREVIOUS_RELEASES_URL =
  'https://github.com/Opentrons/opentrons/releases'

interface PreviousVersionModalProps {
  closeModal: () => void
}

export function PreviousVersionModal(
  props: PreviousVersionModalProps
): JSX.Element {
  const { t } = useTranslation(['app_settings', 'branded'])

  return (
    <Modal onClose={props.closeModal} title={t('how_to_restore')}>
      <Box>
        <LegacyStyledText as="p" paddingBottom={SPACING.spacing8}>
          {t('branded:restore_description')}
        </LegacyStyledText>
        <ExternalLink
          href={UNINSTALL_APP_URL}
          id="PreviousVersionModal_uninstallingAppLink"
        >
          {t('branded:learn_uninstalling')}
        </ExternalLink>
        <Box marginY={SPACING.spacing8} />
        <ExternalLink
          href={PREVIOUS_RELEASES_URL}
          id="PreviousVersionModal_previousReleases"
        >
          {t('branded:previous_releases')}
        </ExternalLink>
      </Box>
      <Flex justifyContent={JUSTIFY_FLEX_END}>
        <PrimaryButton
          marginTop={SPACING.spacing24}
          onClick={props.closeModal}
          id="PreviousVersionModal_closeButton"
        >
          {t('close')}
        </PrimaryButton>
      </Flex>
    </Modal>
  )
}
