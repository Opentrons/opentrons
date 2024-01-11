import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Icon,
  Flex,
  SPACING,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_BETWEEN,
  TYPOGRAPHY,
  LEGACY_COLORS,
  AlertPrimaryButton,
  SecondaryButton,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'

import { NeedHelpLink } from './NeedHelpLink'

interface ConfirmExitProps {
  back: () => void
  exit: () => void
  heading?: string
  body?: string
}

export function ConfirmExit(props: ConfirmExitProps): JSX.Element {
  const { t } = useTranslation('shared')
  const { back, exit, heading, body } = props
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={SPACING.spacing32}
      minHeight="27rem"
    >
      <Flex
        flex="1"
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
      >
        <Icon
          name="ot-alert"
          size="2.5rem"
          color={COLORS.yellow50}
          marginBottom={SPACING.spacing24}
        />
        {heading != null ? (
          <StyledText as="h1" marginBottom={SPACING.spacing8}>
            {heading}
          </StyledText>
        ) : null}
        {body != null ? <StyledText as="p">{body}</StyledText> : null}
      </Flex>
      <Flex
        flex="0"
        width="100%"
        marginTop={SPACING.spacing16}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <NeedHelpLink />
        <Flex gridGap={SPACING.spacing8}>
          <SecondaryButton onClick={back}>{t('go_back')}</SecondaryButton>
          <AlertPrimaryButton
            onClick={exit}
            textTransform={TYPOGRAPHY.textTransformCapitalize}
          >
            {t('exit')}
          </AlertPrimaryButton>
        </Flex>
      </Flex>
    </Flex>
  )
}
