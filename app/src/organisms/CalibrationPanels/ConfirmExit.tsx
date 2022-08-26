import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Icon,
  Flex,
  SIZE_4,
  SPACING,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_BETWEEN,
  TYPOGRAPHY,
  COLORS,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { PrimaryButton, SecondaryButton } from '../../atoms/buttons'

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
      padding={SPACING.spacing6}
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
          color={COLORS.warningEnabled}
          marginBottom={SPACING.spacing5}
        />
        {heading != null ? (
          <StyledText as="h1" marginBottom={SPACING.spacing3}>
            {heading}
          </StyledText>
        ) : null}
        {body != null ? <StyledText as="p">{body}</StyledText> : null}
      </Flex>
      <Flex
        flex="0"
        width="100%"
        marginTop={SPACING.spacing4}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <NeedHelpLink />
        <Flex gridGap={SPACING.spacing3}>
          <SecondaryButton onClick={back}>{t('go_back')}</SecondaryButton>
          <PrimaryButton
            onClick={exit}
            textTransform={TYPOGRAPHY.textTransformCapitalize}
          >
            {t('exit')}
          </PrimaryButton>
        </Flex>
      </Flex>
    </Flex>
  )
}
