import * as React from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  ALIGN_FLEX_END,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  PrimaryButton,
  RESPONSIVENESS,
  SPACING,
  LegacyStyledText,
  ModalShell,
  TEXT_ALIGN_CENTER,
  TEXT_TRANSFORM_CAPITALIZE,
  TYPOGRAPHY,
} from '@opentrons/components'
import { getTopPortalEl } from '../../App/portal'
import { WizardHeader } from '../../molecules/WizardHeader'
import { i18n } from '../../i18n'

const SUPPORT_EMAIL = 'support@opentrons.com'

interface FatalErrorModalProps {
  errorMessage: string
  shouldUseMetalProbe: boolean
  onClose: () => void
}
export function FatalErrorModal(props: FatalErrorModalProps): JSX.Element {
  const { errorMessage, shouldUseMetalProbe, onClose } = props
  const { t } = useTranslation(['labware_position_check', 'shared', 'branded'])
  return createPortal(
    <ModalShell
      width="47rem"
      header={
        <WizardHeader
          title={t('labware_position_check_title')}
          onExit={onClose}
        />
      }
    >
      <Flex
        padding={SPACING.spacing32}
        flexDirection={DIRECTION_COLUMN}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        gridGap={SPACING.spacing16}
      >
        <Icon
          name="ot-alert"
          size="2.5rem"
          color={COLORS.red50}
          aria-label="alert"
        />
        <ErrorHeader>
          {i18n.format(t('shared:something_went_wrong'), 'sentenceCase')}
        </ErrorHeader>
        {shouldUseMetalProbe ? (
          <LegacyStyledText
            as="p"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            textAlign={TEXT_ALIGN_CENTER}
          >
            {t('remove_probe_before_exit')}
          </LegacyStyledText>
        ) : null}
        <LegacyStyledText as="p" textAlign={TEXT_ALIGN_CENTER}>
          {t('branded:help_us_improve_send_error_report', {
            support_email: SUPPORT_EMAIL,
          })}
        </LegacyStyledText>
        <ErrorTextArea readOnly value={errorMessage ?? ''} spellCheck={false} />
        <PrimaryButton
          textTransform={TEXT_TRANSFORM_CAPITALIZE}
          alignSelf={ALIGN_FLEX_END}
          onClick={onClose}
        >
          {t('shared:exit')}
        </PrimaryButton>
      </Flex>
    </ModalShell>,
    getTopPortalEl()
  )
}

const ErrorHeader = styled.h1`
  text-align: ${TEXT_ALIGN_CENTER};
  ${TYPOGRAPHY.h1Default}

  .${RESPONSIVENESS.TOUCH_ODD_CLASS} {
    ${TYPOGRAPHY.level4HeaderSemiBold}
  }
`

const ErrorTextArea = styled.textarea`
  min-height: 6rem;
  width: 30rem;
  background-color: #f8f8f8;
  border: ${BORDERS.lineBorder};
  border-radius: ${BORDERS.borderRadius4};
  padding: ${SPACING.spacing8};
  margin: ${SPACING.spacing16} 0;
  font-size: ${TYPOGRAPHY.fontSizeCaption};
  font-family: monospace;
  resize: none;
`
