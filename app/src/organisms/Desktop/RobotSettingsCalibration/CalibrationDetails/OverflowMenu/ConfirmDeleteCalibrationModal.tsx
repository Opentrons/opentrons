import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_END,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  ModalHeader,
  ModalShell,
  PrimaryButton,
  SPACING,
} from '@opentrons/components'

import { getModalPortalEl } from '/app/App/portal'
import { TextOnlyButton } from '/app/atoms/buttons'

import type { ReactNode } from 'react'
import type { IconProps } from '@opentrons/components'

export interface ConfirmDeleteCalibrationModalProps {
  onDelete: () => void
  toggleModal: () => void
}

export function ConfirmDeleteCalibrationModal({
  onDelete,
  toggleModal,
}: ConfirmDeleteCalibrationModalProps): ReactNode {
  const { t } = useTranslation('robot_calibration')

  const buildIcon = (): IconProps => {
    return {
      name: 'information',
      color: COLORS.yellow50,
      size: SPACING.spacing20,
    }
  }

  const buildHeader = (): JSX.Element => {
    return (
      <ModalHeader
        title={t('delete_calibration_data_q')}
        icon={buildIcon()}
        color={COLORS.black90}
        backgroundColor={COLORS.white}
      />
    )
  }

  return createPortal(
    <ModalShell header={buildHeader()} css={MODAL_STYLE}>
      <Flex
        padding={SPACING.spacing24}
        gridGap={SPACING.spacing24}
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <LegacyStyledText forwardedAs="p">
          {t('delete_calibration_modal_description')}
        </LegacyStyledText>
        <Flex gridGap={SPACING.spacing24} justifyContent={JUSTIFY_END}>
          <TextOnlyButton onClick={toggleModal} buttonText={t('cancel')} />
          <PrimaryButton variant="warning" onClick={onDelete}>
            {t('delete_calibration_data')}
          </PrimaryButton>
        </Flex>
      </Flex>
    </ModalShell>,
    getModalPortalEl()
  )
}

const MODAL_STYLE = css`
  width: 31.25rem;
`
