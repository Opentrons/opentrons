import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_FLEX_END,
  DIRECTION_COLUMN,
  Flex,
  FLEX_MAX_CONTENT,
  Link,
  PrimaryButton,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
  Modal,
} from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'
import { ExternalLink } from '/app/atoms/Link/ExternalLink'

const NEW_FLEX_SETUP_SUPPORT_ARTICLE_HREF =
  'https://insights.opentrons.com/hubfs/Products/Flex/Opentrons%20Flex%20Quickstart%20Guide.pdf'
const NEW_OT2_SETUP_SUPPORT_ARTICLE_HREF =
  'https://insights.opentrons.com/hubfs/Products/OT-2/OT-2%20Quick%20Start%20Guide.pdf'

export function NewRobotSetupHelp(): JSX.Element {
  const { t } = useTranslation(['devices_landing', 'shared', 'branded'])
  const [showNewRobotHelpModal, setShowNewRobotHelpModal] = useState(false)

  return (
    <>
      <Link
        css={TYPOGRAPHY.darkLinkLabelSemiBold}
        role="button"
        onClick={() => {
          setShowNewRobotHelpModal(true)
        }}
      >
        {t('see_how_to_setup_new_robot')}
      </Link>
      {showNewRobotHelpModal
        ? createPortal(
            <Modal
              title={t('how_to_setup_a_robot')}
              onClose={() => {
                setShowNewRobotHelpModal(false)
              }}
            >
              <Flex flexDirection={DIRECTION_COLUMN}>
                <LegacyStyledText as="p" marginBottom={SPACING.spacing16}>
                  {t('branded:new_robot_instructions')}
                </LegacyStyledText>
                <ExternalLink
                  href={NEW_FLEX_SETUP_SUPPORT_ARTICLE_HREF}
                  width={FLEX_MAX_CONTENT}
                >
                  {t('branded:opentrons_flex_quickstart_guide')}
                </ExternalLink>
                <ExternalLink
                  href={NEW_OT2_SETUP_SUPPORT_ARTICLE_HREF}
                  width={FLEX_MAX_CONTENT}
                >
                  {t('ot2_quickstart_guide')}
                </ExternalLink>
                <PrimaryButton
                  onClick={() => {
                    setShowNewRobotHelpModal(false)
                  }}
                  alignSelf={ALIGN_FLEX_END}
                  textTransform={TYPOGRAPHY.textTransformCapitalize}
                >
                  {t('shared:close')}
                </PrimaryButton>
              </Flex>
            </Modal>,
            getTopPortalEl()
          )
        : null}
    </>
  )
}
