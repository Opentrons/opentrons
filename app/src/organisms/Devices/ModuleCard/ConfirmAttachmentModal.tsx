import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  CheckboxField,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_FLEX_END,
  Text,
  TEXT_ALIGN_CENTER,
  SPACING,
  TYPOGRAPHY,
  TEXT_TRANSFORM_CAPITALIZE,
} from '@opentrons/components'
import { SecondaryButton, PrimaryButton } from '../../../atoms/Buttons'
import { Modal } from '../../../atoms/Modal'
import { useHeaterShakerSlotNumber } from './useHeaterShakerSlotNumber'

interface ConfirmAttachmentModalProps {
  onCloseClick: () => void
}
export const ConfirmAttachmentModal = (
  props: ConfirmAttachmentModalProps
): JSX.Element | null => {
  const { t } = useTranslation(['heater_shaker', 'shared'])
  const [preference, setPreference] = React.useState<boolean>(false)
  const { slotNumber } = useHeaterShakerSlotNumber()
  const isSlotDefined = slotNumber ? true : false

  return (
    <>
      <Modal
        title={t('confirm_heater_shaker_modal_attachment')}
        onClose={props.onCloseClick}
      >
        <Trans
          t={t}
          i18nKey={t(
            isSlotDefined
              ? 'module_anchors_extended'
              : 'module_should_have_anchors',
            { slot: slotNumber }
          )}
          components={{
            block: (
              <Text
                fontSize={TYPOGRAPHY.fontSizeP}
                paddingBottom={SPACING.spacing2}
              />
            ),
          }}
        />
        <Flex
          flexDirection={DIRECTION_ROW}
          textAlign={TEXT_ALIGN_CENTER}
          paddingTop={SPACING.spacing4}
          data-testid={`confirmAttachmentModal_checkbox_field_${
            isSlotDefined ? `on_protocol` : `on_set_shake`
          }`}
        >
          <CheckboxField
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPreference(e.currentTarget.checked)
            }
            value={preference}
          />
          <Text
            paddingTop={SPACING.spacingXXS}
            paddingLeft={SPACING.spacing3}
            fontSize={TYPOGRAPHY.fontSizeP}
          >
            {t('dont_show_me_again', { ns: 'shared' })}
          </Text>
        </Flex>
        <Flex
          flexDirection={DIRECTION_ROW}
          paddingTop={SPACING.spacingXL}
          justifyContent={JUSTIFY_FLEX_END}
        >
          <Flex paddingRight={SPACING.spacing2}>
            <SecondaryButton
              onClick={props.onCloseClick}
              textTransform={TEXT_TRANSFORM_CAPITALIZE}
            >
              {t('cancel', { ns: 'shared' })}
            </SecondaryButton>
          </Flex>

          <Flex>
            <PrimaryButton onClick={() => console.log('proceed to run')}>
              {t('proceed_to_run')}
            </PrimaryButton>
          </Flex>
        </Flex>
      </Modal>
    </>
  )
}
