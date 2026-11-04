import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_FLEX_END,
  FLEX_MAX_CONTENT,
  Link,
  Modal,
  PrimaryButton,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'
import { ExternalLink } from '/app/atoms/Link/ExternalLink'

import styles from './newrobotsetuphelp.module.css'

import type { ReactNode } from 'react'

const NEW_FLEX_SETUP_SUPPORT_ARTICLE_HREF =
  'https://insights.opentrons.com/hubfs/Products/Flex/Opentrons%20Flex%20Quickstart%20Guide.pdf'

export function NewRobotSetupHelp(): ReactNode {
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
              <div className={styles.container}>
                <div className={styles.content}>
                  <StyledText desktopStyle="bodyDefaultRegular">
                    {t('branded:new_robot_instructions')}
                  </StyledText>
                  <ExternalLink
                    href={NEW_FLEX_SETUP_SUPPORT_ARTICLE_HREF}
                    width={FLEX_MAX_CONTENT}
                  >
                    {t('branded:opentrons_flex_quickstart_guide')}
                  </ExternalLink>
                </div>
                <PrimaryButton
                  onClick={() => {
                    setShowNewRobotHelpModal(false)
                  }}
                  alignSelf={ALIGN_FLEX_END}
                  textTransform={TYPOGRAPHY.textTransformCapitalize}
                >
                  {t('shared:close')}
                </PrimaryButton>
              </div>
            </Modal>,
            getTopPortalEl()
          )
        : null}
    </>
  )
}
