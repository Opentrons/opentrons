import * as React from 'react'
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
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { getTopPortalEl } from '../../App/portal'
<<<<<<< HEAD
=======
import { StyledText } from '../../atoms/text'
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
import { Modal } from '../../molecules/Modal'

export function OpenDoorAlertModal(): JSX.Element {
  const { t } = useTranslation('run_details')
  return createPortal(
    <Modal>
      <Flex
        backgroundColor={COLORS.grey35}
<<<<<<< HEAD
        borderRadius={BORDERS.borderRadius12}
=======
        borderRadius={BORDERS.borderRadiusSize3}
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
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
            color={COLORS.grey60}
          >
            {t('close_door_to_resume')}
          </StyledText>
        </Flex>
      </Flex>
    </Modal>,
    getTopPortalEl()
  )
}
