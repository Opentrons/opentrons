import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  BORDERS,
  LEGACY_COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { Portal } from '../../App/portal'
import { StyledText } from '../../atoms/text'
import { Modal } from '../../molecules/Modal'

export function OpenDoorAlertModal(): JSX.Element {
  const { t } = useTranslation('run_details')
  return (
    <Portal level="top">
      <Modal>
        <Flex
          backgroundColor={LEGACY_COLORS.darkBlack20}
          borderRadius={BORDERS.borderRadiusSize3}
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
            <StyledText as="h4" fontWeight={TYPOGRAPHY.fontWeightBold}>
              {t('door_is_open')}
            </StyledText>
            <StyledText
              as="p"
              textAlign={TYPOGRAPHY.textAlignCenter}
              color={LEGACY_COLORS.darkBlack90}
            >
              {t('close_door_to_resume')}
            </StyledText>
          </Flex>
        </Flex>
      </Modal>
    </Portal>
  )
}
