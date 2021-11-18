import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  Modal,
  Text,
  PrimaryBtn,
  SecondaryBtn,
  SPACING_2,
  SPACING_3,
  SPACING_4,
  C_BLUE,
  TEXT_TRANSFORM_UPPERCASE,
  FONT_WEIGHT_SEMIBOLD,
  JUSTIFY_SPACE_EVENLY,
} from '@opentrons/components'
import styles from '../styles.css'

interface ExitPreventionModalProps {
  onGoBack: () => void
  onConfirmExit: () => void
}

export const ExitPreventionModal = (
  props: ExitPreventionModalProps
): JSX.Element => {
  const { t } = useTranslation('labware_position_check')

  return (
    <Modal className={styles.modal} contentsClassName={styles.modal_contents}>
      <Text
        as={'h3'}
        marginBottom={SPACING_3}
        textTransform={TEXT_TRANSFORM_UPPERCASE}
        fontWeight={FONT_WEIGHT_SEMIBOLD}
        marginLeft={SPACING_3}
      >
        {t('exit_screen_title')}
      </Text>
      <Text marginBottom={SPACING_4} marginLeft={SPACING_3}>
        {t('exit_screen_subtitle')}
      </Text>
      <Flex padding={SPACING_2} justifyContent={JUSTIFY_SPACE_EVENLY}>
        <SecondaryBtn onClick={props.onGoBack} color={C_BLUE}>
          {t('exit_screen_go_back')}
        </SecondaryBtn>
        <PrimaryBtn onClick={props.onConfirmExit} backgroundColor={C_BLUE}>
          {t('exit_screen_confirm_exit')}
        </PrimaryBtn>
      </Flex>
    </Modal>
  )
}
