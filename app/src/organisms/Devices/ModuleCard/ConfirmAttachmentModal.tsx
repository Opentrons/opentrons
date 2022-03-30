import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'
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
  DIRECTION_COLUMN,
} from '@opentrons/components'
import { SecondaryButton, PrimaryButton } from '../../../atoms/Buttons'
import { Modal } from '../../../atoms/Modal'
import { ProtocolRunDetails } from '../../../pages/Devices/ProtocolRunDetails'
import { useTrackEvent } from '../../../redux/analytics'
import { useHeaterShakerFromProtocol } from './hooks'

import type { HeaterShakerModule } from '../../../redux/modules/types'
import type { HeaterShakerSetTargetShakeSpeedCreateCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/module'

interface ConfirmAttachmentModalProps {
  onCloseClick: () => void
  onCloseSlideoutClick?: () => unknown
  isProceedToRunModal: boolean
  shakerValue: string | null
  moduleId?: HeaterShakerModule['id']
}
export const ConfirmAttachmentModal = (
  props: ConfirmAttachmentModalProps
): JSX.Element | null => {
  const {
    isProceedToRunModal,
    onCloseClick,
    onCloseSlideoutClick,
    shakerValue,
    moduleId,
  } = props
  const { t } = useTranslation(['heater_shaker', 'shared'])
  const [isDismissed, setIsDismissed] = React.useState<boolean>(false)
  const { createLiveCommand } = useCreateLiveCommandMutation()
  const heaterShaker = useHeaterShakerFromProtocol()
  const slotNumber = heaterShaker != null ? heaterShaker.slotName : null
  const trackEvent = useTrackEvent()
  const [
    showProtocolRunDetails,
    setShowProtocolRunDetails,
  ] = React.useState<boolean>(false)

  const handleProceedToRunClick = (): void => {
    trackEvent({ name: 'proceedToRun', properties: {} })
    setShowProtocolRunDetails(true) //  this doesn't work yet when testing in the environment since its hidden behind a feature flag
  }

  const handleSetShakeClick = (): void => {
    if (shakerValue != null && moduleId != null) {
      const saveShakeCommand: HeaterShakerSetTargetShakeSpeedCreateCommand = {
        commandType: 'heaterShakerModule/setTargetShakeSpeed',
        params: {
          moduleId: moduleId,
          rpm: parseInt(shakerValue),
        },
      }
      createLiveCommand({
        command: saveShakeCommand,
      }).catch((e: Error) => {
        console.error(
          `error setting module status with command type ${saveShakeCommand.commandType}: ${e.message}`
        )
      })
    }
    onCloseSlideoutClick != null && onCloseSlideoutClick()
  }

  return (
    <>
      <Modal
        title={t('confirm_heater_shaker_modal_attachment')}
        onClose={onCloseClick}
      >
        {showProtocolRunDetails && <ProtocolRunDetails />}
        <Flex
          data-testid={`confirmAttachmentModal_body_text_${
            isProceedToRunModal ? `on_start_protocol` : `on_set_shake`
          }`}
          flexDirection={DIRECTION_COLUMN}
        >
          <Trans
            t={t}
            i18nKey={t(
              isProceedToRunModal
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
        </Flex>
        <Flex
          flexDirection={DIRECTION_ROW}
          textAlign={TEXT_ALIGN_CENTER}
          paddingTop={SPACING.spacing4}
          data-testid={`confirmAttachmentModal_checkbox_field_${
            isProceedToRunModal ? `on_start_protocol` : `on_set_shake`
          }`}
        >
          {/* TODO(jr, 3/29/22): wire up checkbox field, pending usage of Alerts */}
          <CheckboxField
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setIsDismissed(e.currentTarget.checked)
            }
            value={isDismissed}
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
          <Flex
            paddingRight={SPACING.spacing2}
            data-testid={`confirmAttachmentModal_secondary_btn_${
              isProceedToRunModal ? `on_start_protocol` : `on_set_shake`
            }`}
          >
            <SecondaryButton
              onClick={onCloseClick}
              textTransform={TEXT_TRANSFORM_CAPITALIZE}
            >
              {t('cancel', { ns: 'shared' })}
            </SecondaryButton>
          </Flex>

          <Flex
            data-testid={`confirmAttachmentModal_primary_btn_${
              isProceedToRunModal ? `on_start_protocol` : `on_set_shake`
            }`}
          >
            <PrimaryButton
              onClick={
                isProceedToRunModal
                  ? handleProceedToRunClick
                  : handleSetShakeClick
              }
            >
              {isProceedToRunModal
                ? t('proceed_to_run')
                : t('confirm_attachment')}
            </PrimaryButton>
          </Flex>
        </Flex>
      </Modal>
    </>
  )
}
