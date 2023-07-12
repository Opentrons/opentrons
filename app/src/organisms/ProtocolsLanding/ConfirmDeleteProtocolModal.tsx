import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  COLORS,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
  SPACING,
  JUSTIFY_FLEX_END,
  AlertPrimaryButton,
  Link,
  ALIGN_CENTER,
} from '@opentrons/components'
import { LegacyModal } from '../../molecules/LegacyModal'
import { StyledText } from '../../atoms/text'

interface ConfirmDeleteProtocolModalProps {
  cancelDeleteProtocol: React.MouseEventHandler<HTMLAnchorElement> | undefined
  handleClickDelete: React.MouseEventHandler<HTMLButtonElement>
}

export function ConfirmDeleteProtocolModal(
  props: ConfirmDeleteProtocolModalProps
): JSX.Element {
  const { t } = useTranslation(['protocol_list', 'shared'])
  return (
    <LegacyModal
      type="warning"
      onClose={props.cancelDeleteProtocol}
      title={t('should_delete_this_protocol')}
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <StyledText as="p" marginBottom={SPACING.spacing24}>
          {t('this_protocol_will_be_trashed')}
        </StyledText>
        <Flex justifyContent={JUSTIFY_FLEX_END} alignItems={ALIGN_CENTER}>
          <Link
            role="button"
            onClick={props.cancelDeleteProtocol}
            textTransform={TYPOGRAPHY.textTransformCapitalize}
            marginRight={SPACING.spacing24}
            css={TYPOGRAPHY.linkPSemiBold}
          >
            {t('shared:cancel')}
          </Link>
          <AlertPrimaryButton
            backgroundColor={COLORS.errorEnabled}
            onClick={props.handleClickDelete}
          >
            {t('yes_delete_this_protocol')}
          </AlertPrimaryButton>
        </Flex>
      </Flex>
    </LegacyModal>
  )
}
