import * as React from 'react'
import styled, { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import {
  Icon,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  PrimaryButton,
  SPACING,
  JUSTIFY_SPACE_BETWEEN,
  BORDERS,
  TYPOGRAPHY,
  TEXT_ALIGN_CENTER,
  ALIGN_CENTER,
  ALIGN_FLEX_END,
  TEXT_TRANSFORM_CAPITALIZE,
} from '@opentrons/components'
import { Portal } from '../../App/portal'
import { ModalShell } from '../../molecules/Modal'
import { WizardHeader } from '../../molecules/WizardHeader'
import { StyledText } from '../../atoms/text'

const SUPPORT_EMAIL = 'support@opentrons.com'

const ErrorTextArea = styled.textarea`
  min-height: 6rem;
  width: 30rem;
  background-color: #f8f8f8;
  border: ${BORDERS.lineBorder};
  border-radius: ${BORDERS.radiusSoftCorners};
  padding: ${SPACING.spacing3};
  margin: ${SPACING.spacing4} 0;
  font-size: ${TYPOGRAPHY.fontSizeCaption};
  font-family: monospace;
  resize: none;
`
const CAPITALIZE_FIRST_LETTER_STYLE = css`
  &:first-letter {
    text-transform: uppercase;
  }
`
interface FatalErrorModalProps {
  errorMessage: string
  onClose: () => void
}
export function FatalErrorModal(props: FatalErrorModalProps): JSX.Element {
  const { t } = useTranslation(['labware_position_check', 'shared'])
  return (
    <Portal level="top">
      <ModalShell
        width="47rem"
        header={
          <WizardHeader
            title={t('labware_position_check_title')}
            onExit={props.onClose}
          />
        }
      >
        <Flex
          padding={SPACING.spacing6}
          flexDirection={DIRECTION_COLUMN}
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          gridGap={SPACING.spacing4}
        >
          <Icon
            name="ot-alert"
            size="2.5rem"
            color={COLORS.errorEnabled}
            aria-label="alert"
          />
          <StyledText
            as="h1"
            textAlign={TEXT_ALIGN_CENTER}
            css={CAPITALIZE_FIRST_LETTER_STYLE}
          >
            {t('shared:something_went_wrong')}
          </StyledText>
          <StyledText as="p" textAlign={TEXT_ALIGN_CENTER}>
            {t('shared:help_us_improve_send_error_report', {
              support_email: SUPPORT_EMAIL,
            })}
          </StyledText>
          <ErrorTextArea
            readOnly
            value={props.errorMessage ?? ''}
            spellCheck={false}
          />
          <PrimaryButton
            textTransform={TEXT_TRANSFORM_CAPITALIZE}
            alignSelf={ALIGN_FLEX_END}
            onClick={props.onClose}
          >
            {t('shared:exit')}
          </PrimaryButton>
        </Flex>
      </ModalShell>
    </Portal>
  )
}
