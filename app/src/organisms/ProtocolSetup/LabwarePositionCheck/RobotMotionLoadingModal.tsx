import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  Modal,
  Text,
  SPACING_2,
  SPACING_3,
  SPACING_5,
  TEXT_TRANSFORM_UPPERCASE,
  FONT_WEIGHT_SEMIBOLD,
  FONT_WEIGHT_REGULAR,
  JUSTIFY_CENTER,
  C_NEAR_WHITE,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  SPACING_4,
  FONT_SIZE_DEFAULT,
} from '@opentrons/components'
import styles from '../styles.css'

interface RobotMotionLoadingModalProps {
  title?: string
}

export const RobotMotionLoadingModal = (
  props: RobotMotionLoadingModalProps
): JSX.Element => {
  const { t } = useTranslation('labware_position_check')

  return (
    <Modal className={styles.modal} contentsClassName={styles.modal_contents}>
      <Flex flexDirection={'column'}>
        <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Text
            as={'h3'}
            marginBottom={SPACING_3}
            textTransform={TEXT_TRANSFORM_UPPERCASE}
            fontWeight={FONT_WEIGHT_SEMIBOLD}
            marginLeft={SPACING_3}
          >
            {props.title != null ? props.title : null}
          </Text>
        </Flex>
      </Flex>
      <Flex
        padding={'0.75rem'}
        justifyContent={JUSTIFY_CENTER}
        marginTop={SPACING_2}
        marginBottom={SPACING_4}
        boxShadow="1px 1px 1px rgba(0, 0, 0, 0.25)"
        borderRadius="4px"
        backgroundColor={C_NEAR_WHITE}
        flexDirection={DIRECTION_COLUMN}
        width="100%"
      >
        <Flex justifyContent={ALIGN_CENTER}>
          <Icon name="ot-spinner" className={styles.spinner_modal_icon} spin />
        </Flex>
        <Flex justifyContent={ALIGN_CENTER}>
          <Text
            as={'h3'}
            marginBottom={SPACING_5}
            fontWeight={FONT_WEIGHT_REGULAR}
            fontSize={FONT_SIZE_DEFAULT}
            marginLeft={SPACING_3}
          >
            {t('robot_in_motion')}
          </Text>
        </Flex>
      </Flex>
    </Modal>
  )
}
