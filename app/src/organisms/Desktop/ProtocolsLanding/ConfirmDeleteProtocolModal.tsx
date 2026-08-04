import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_FLEX_END,
  LegacyStyledText,
  Link,
  Modal,
  PrimaryButton,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import type { MouseEventHandler } from 'react'

interface ConfirmDeleteProtocolModalProps {
  cancelDeleteProtocol: MouseEventHandler<HTMLAnchorElement> | undefined
  handleClickDelete: MouseEventHandler<HTMLButtonElement>
}

export function ConfirmDeleteProtocolModal(
  props: ConfirmDeleteProtocolModalProps
): JSX.Element {
  const { t } = useTranslation(['protocol_list', 'shared'])
  return (
    <Modal
      type="warning"
      onClose={props.cancelDeleteProtocol}
      title={t('delete_this_protocol')}
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <LegacyStyledText forwardedAs="p" marginBottom={SPACING.spacing24}>
          {t('this_protocol_will_be_trashed')}
        </LegacyStyledText>
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
          <PrimaryButton variant="warning" onClick={props.handleClickDelete}>
            {t('yes_delete_this_protocol')}
          </PrimaryButton>
        </Flex>
      </Flex>
    </Modal>
  )
}
