import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { getTopPortalEl } from '/app/App/portal'
import { OddModal } from '/app/molecules/OddModal'
import { NOT_CONFIGURED } from '/app/organisms/Desktop/Devices/ProtocolRun/ProtocolRunHeader/hooks'

export interface OpenDoorModalProps {
  moduleDoorLocation: string | null
}
export function OpenDoorAlertModal(props: OpenDoorModalProps): JSX.Element {
  const { t } = useTranslation('run_details')
  let doorHeader = t('door_is_open')
  let doorText = t('close_door_to_resume_run')
  if (props.moduleDoorLocation === NOT_CONFIGURED) {
    doorHeader = t('unconfigured_stacker_door_is_open')
    doorText = t('close_unconfigured_stacker_to_resume_run')
  } else if (props.moduleDoorLocation !== null) {
    doorHeader = t('stacker_door_is_open', {
      module_door_location: props.moduleDoorLocation,
    })
    doorText = t('close_stacker_to_resume_run', {
      module_door_location: props.moduleDoorLocation,
    })
  }

  return createPortal(
    <OddModal>
      <Flex
        backgroundColor={COLORS.grey35}
        borderRadius={BORDERS.borderRadius12}
        flexDirection={DIRECTION_COLUMN}
        padding={SPACING.spacing24}
        alignItems={ALIGN_CENTER}
        gridGap={SPACING.spacing16}
        width="100%"
        justifyContent={JUSTIFY_CENTER}
      >
        <Icon name="ot-alert" size="2.5rem" />
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing4}
          alignItems={ALIGN_CENTER}
          width="100%"
        >
          <LegacyStyledText as="h4" fontWeight={TYPOGRAPHY.fontWeightBold}>
            {doorHeader}
          </LegacyStyledText>
          <LegacyStyledText
            as="p"
            textAlign={TYPOGRAPHY.textAlignCenter}
            color={COLORS.grey60}
          >
            {doorText}
          </LegacyStyledText>
        </Flex>
      </Flex>
    </OddModal>,
    getTopPortalEl()
  )
}
