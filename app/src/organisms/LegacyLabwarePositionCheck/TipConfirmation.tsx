import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_FLEX_END,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  PrimaryButton,
  SecondaryButton,
  SPACING,
} from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'
import { i18n } from '/app/i18n'
import { NeedHelpLink } from '/app/molecules/OT2CalibrationNeedHelpLink'
import { SimpleWizardBody } from '/app/molecules/SimpleWizardBody'
import { getIsOnDevice } from '/app/redux/config'

import type { ReactNode } from 'react'

const LPC_HELP_LINK_URL =
  'https://support.opentrons.com/s/article/creating-labware-offsets'

interface TipConfirmationProps {
  invalidateTip: () => void
  confirmTip: () => void
}

export function TipConfirmation(props: TipConfirmationProps): ReactNode {
  const { invalidateTip, confirmTip } = props
  const { t } = useTranslation('shared')
  const isOnDevice = useSelector(getIsOnDevice)
  return isOnDevice ? (
    <SimpleWizardBody
      isSuccess={false}
      iconColor={COLORS.yellow50}
      header={t('did_pipette_pick_up_tip')}
    >
      <Flex
        alignItems={ALIGN_CENTER}
        gridGap={SPACING.spacing8}
        justifyContent={JUSTIFY_FLEX_END}
        flex="1"
      >
        <SmallButton
          buttonText={i18n.format(t('try_again'), 'capitalize')}
          buttonType="secondary"
          onClick={invalidateTip}
        />
        <SmallButton
          buttonText={i18n.format(t('yes'), 'capitalize')}
          onClick={confirmTip}
        />
      </Flex>
    </SimpleWizardBody>
  ) : (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={SPACING.spacing32}
      minHeight="29.5rem"
    >
      <LegacyStyledText forwardedAs="h1" marginBottom={SPACING.spacing16}>
        {t('did_pipette_pick_up_tip')}
      </LegacyStyledText>
      <Flex
        width="100%"
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        marginTop={SPACING.spacing16}
      >
        <NeedHelpLink href={LPC_HELP_LINK_URL} />
        <Flex gridGap={SPACING.spacing8}>
          <SecondaryButton onClick={invalidateTip}>
            {i18n.format(t('try_again'), 'capitalize')}
          </SecondaryButton>
          <PrimaryButton onClick={confirmTip}>
            {i18n.format(t('yes'), 'capitalize')}
          </PrimaryButton>
        </Flex>
      </Flex>
    </Flex>
  )
}
