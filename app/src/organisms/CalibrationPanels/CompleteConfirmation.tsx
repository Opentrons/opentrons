import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  Icon,
  ALIGN_CENTER,
  JUSTIFY_FLEX_END,
  DIRECTION_COLUMN,
  SPACING,
  SIZE_3,
  JUSTIFY_CENTER,
  LEGACY_COLORS,
  ALIGN_STRETCH,
  PrimaryButton,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'

interface CompleteConfirmationProps {
  proceed: React.MouseEventHandler
  flowName?: string
  body?: string
  visualAid?: React.ReactNode
}

export function CompleteConfirmation(
  props: CompleteConfirmationProps
): JSX.Element {
  const { t } = useTranslation('shared')
  const { proceed, flowName, body, visualAid } = props
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      padding={SPACING.spacing32}
      minHeight="32rem"
    >
      <Flex
        flex="1"
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
      >
        {visualAid != null ? (
          visualAid
        ) : (
          <Icon name="ot-check" size={SIZE_3} color={LEGACY_COLORS.successEnabled} />
        )}
        <StyledText as="h1" marginTop={SPACING.spacing24}>
          {t('flow_complete', { flowName })}
        </StyledText>
        {body != null ? (
          <StyledText as="p" marginTop={SPACING.spacing8}>
            {body}
          </StyledText>
        ) : null}
      </Flex>
      <Flex
        flex="0"
        alignSelf={ALIGN_STRETCH}
        marginTop={SPACING.spacing32}
        justifyContent={JUSTIFY_FLEX_END}
      >
        <PrimaryButton
          onClick={proceed}
          textTransform={TYPOGRAPHY.textTransformCapitalize}
        >
          {t('exit')}
        </PrimaryButton>
      </Flex>
    </Flex>
  )
}
