import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { SmallButton } from '../../atoms/buttons'
import { Modal } from '../../molecules/Modal'

import type { ModalHeaderBaseProps } from '../../molecules/Modal/types'

interface AnalysisFailedModalProps {
  errors: string[]
  protocolId: string
  setShowAnalysisFailedModal: (showAnalysisFailedModal: boolean) => void
}

export function AnalysisFailedModal({
  errors,
  protocolId,
  setShowAnalysisFailedModal,
}: AnalysisFailedModalProps): JSX.Element {
  const { t } = useTranslation('protocol_setup')
  const history = useHistory()
  const modalHeader: ModalHeaderBaseProps = {
    title: t('protocol_analysis_failed'),
    iconName: 'information',
    iconColor: COLORS.black90,
    hasExitIcon: true,
  }

  const handleRestartSetup = (): void => {
    history.push(`/protocols/${protocolId}`)
  }

  return (
    <Modal
      header={modalHeader}
      onOutsideClick={() => setShowAnalysisFailedModal(false)}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing32}
        width="100%"
      >
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
          <StyledText as="p">{t('with_the_chosen_value')}</StyledText>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            borderRadius={BORDERS.borderRadius8}
            backgroundColor={COLORS.grey35}
            padding={`${SPACING.spacing16} ${SPACING.spacing20}`}
            overflowY="auto"
          >
            {errors.map((error, index) => (
              <StyledText key={index} as="p">
                {error}
              </StyledText>
            ))}
          </Flex>
          <StyledText as="p">{t('restart_setup_and_try')}</StyledText>
        </Flex>
        <SmallButton
          onClick={handleRestartSetup}
          buttonText={t('restart_setup')}
          buttonType="alert"
        />
      </Flex>
    </Modal>
  )
}
