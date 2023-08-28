import * as React from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  ALIGN_FLEX_END,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_FLEX_END,
  JUSTIFY_SPACE_BETWEEN,
  RESPONSIVENESS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { SmallButton } from '../../atoms/buttons'

interface WizardPaneProps {
  proceed: () => void
  proceedButtonText: string
  children: React.ReactNode
  goBack?: () => void
}
export function WizardPane(props: WizardPaneProps): JSX.Element {
  const { proceed, proceedButtonText, goBack, children } = props
  const { t } = useTranslation('shared')
  return (
    <Flex
      flex="1"
      padding={SPACING.spacing32}
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
    >
      {children}
      <Flex
        justifyContent={
          goBack != null ? JUSTIFY_SPACE_BETWEEN : JUSTIFY_FLEX_END
        }
        alignItems={ALIGN_CENTER}
      >
        {goBack != null ? (
          <GoBackButton onClick={goBack}>{t('shared:go_back')}</GoBackButton>
        ) : null}
        <SmallButton
          buttonType="primary"
          onClick={proceed}
          alignSelf={ALIGN_FLEX_END}
          buttonText={proceedButtonText}
        />
      </Flex>
    </Flex>
  )
}

const GoBackButton = styled.button`
  appearance: none;
  padding: 0;
  border-width: 0;
  border-style: solid;
  background-color: transparent;
  cursor: pointer;

  &:disabled,
  &.disabled {
    cursor: default;
  }
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  font-size: ${TYPOGRAPHY.fontSize22};
  line-height: ${TYPOGRAPHY.lineHeight20};
  color: ${COLORS.darkGreyEnabled};
`
