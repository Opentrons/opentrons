import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  JUSTIFY_FLEX_END,
} from '@opentrons/components'
import { StyledText } from '../../../atoms/text'
import { PrimaryButton } from '../../../atoms/buttons'

export interface ClearDeckModalProps {
  onContinueClick: () => void
}

export function ClearDeckModal(props: ClearDeckModalProps): JSX.Element {
  const { onContinueClick } = props
  const { t } = useTranslation('change_pipette')

  return (
    <>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        marginBottom="12.25rem"
        paddingX={SPACING.spacing6}
        paddingTop={SPACING.spacing6}
      >
        <Trans
          t={t}
          i18nKey="remove_labware_before_start"
          components={{
            h1: <StyledText as="h1" marginBottom={SPACING.spacing4} />,
            block: <StyledText as="p" />,
          }}
        />
      </Flex>
      <Flex justifyContent={JUSTIFY_FLEX_END} marginBottom={SPACING.spacing6}>
        <PrimaryButton marginX={SPACING.spacing6} onClick={onContinueClick}>
          {t('get_started')}
        </PrimaryButton>
      </Flex>
    </>
  )
}
