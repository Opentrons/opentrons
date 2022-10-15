import * as React from 'react'
import { css } from 'styled-components'
import {
  Flex,
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
} from '@opentrons/components'
import { useTranslation } from 'react-i18next'

import { NeedHelpLink } from '../CalibrationPanels'
import { PrimaryButton, SecondaryButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'

const LPC_HELP_LINK_URL =
  'https://support.opentrons.com/s/article/How-Labware-Offsets-work-on-the-OT-2'

const CAPITALIZE_FIRST_LETTER_STYLE = css`
  &:first-letter {
    text-transform: uppercase;
  }
`
interface TipConfirmationProps {
  invalidateTip: () => void
  confirmTip: () => void
}

export function TipConfirmation(props: TipConfirmationProps): JSX.Element {
  const { invalidateTip, confirmTip } = props
  const { t } = useTranslation('shared')
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={SPACING.spacing6}
      minHeight="25rem"
    >
      <StyledText as="h1" marginBottom={SPACING.spacing4}>
        {t('did_pipette_pick_up_tip')}
      </StyledText>

      <Flex
        width="100%"
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        marginTop={SPACING.spacing4}
      >
        <NeedHelpLink href={LPC_HELP_LINK_URL} />
        <Flex gridGap={SPACING.spacing3}>
          <SecondaryButton
            onClick={invalidateTip}
            css={CAPITALIZE_FIRST_LETTER_STYLE}
          >
            {t('try_again')}
          </SecondaryButton>
          <PrimaryButton
            onClick={confirmTip}
            css={CAPITALIZE_FIRST_LETTER_STYLE}
          >
            {t('yes')}
          </PrimaryButton>
        </Flex>
      </Flex>
    </Flex>
  )
}
