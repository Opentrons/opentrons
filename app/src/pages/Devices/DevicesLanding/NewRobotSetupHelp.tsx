import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_FLEX_END,
  DIRECTION_COLUMN,
  Flex,
  Link,
  TYPOGRAPHY,
  PrimaryButton,
  SPACING,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import { Portal } from '../../../App/portal'
import { LegacyModal } from '../../../molecules/LegacyModal'
import { ExternalLink } from '../../../atoms/Link/ExternalLink'

const NEW_ROBOT_SETUP_SUPPORT_ARTICLE_HREF =
  'https://support.opentrons.com/s/ot2-get-started'

export function NewRobotSetupHelp(): JSX.Element {
  const { t } = useTranslation(['devices_landing', 'shared'])
  const [showNewRobotHelpModal, setShowNewRobotHelpModal] = React.useState(
    false
  )

  return (
    <>
      <Link
        css={TYPOGRAPHY.darkLinkLabelSemiBold}
        role="button"
        onClick={() => setShowNewRobotHelpModal(true)}
      >
        {t('see_how_to_setup_new_robot')}
      </Link>
      <Portal level="top">
        {showNewRobotHelpModal ? (
          <LegacyModal
            title={t('how_to_setup_a_robot')}
            onClose={() => setShowNewRobotHelpModal(false)}
          >
            <Flex flexDirection={DIRECTION_COLUMN}>
              <StyledText as="p" marginBottom={SPACING.spacing16}>
                {t('use_usb_cable_for_new_robot')}
              </StyledText>
              <ExternalLink href={NEW_ROBOT_SETUP_SUPPORT_ARTICLE_HREF}>
                {t('learn_more_about_new_robot_setup')}
              </ExternalLink>
              <PrimaryButton
                onClick={() => setShowNewRobotHelpModal(false)}
                alignSelf={ALIGN_FLEX_END}
                textTransform={TYPOGRAPHY.textTransformCapitalize}
              >
                {t('shared:close')}
              </PrimaryButton>
            </Flex>
          </LegacyModal>
        ) : null}
      </Portal>
    </>
  )
}
