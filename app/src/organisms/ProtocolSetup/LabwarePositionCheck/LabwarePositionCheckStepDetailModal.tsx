import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Btn,
  C_LIGHT_GRAY,
  C_MED_DARK_GRAY,
  C_NEAR_WHITE,
  Flex,
  FONT_WEIGHT_SEMIBOLD,
  Icon,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  Modal,
  NewPrimaryBtn,
  SIZE_2,
  SIZE_4,
  SPACING_1,
  SPACING_2,
  SPACING_3,
  SPACING_4,
  SPACING_5,
  Text,
  TEXT_TRANSFORM_UPPERCASE,
  POSITION_RELATIVE,
  POSITION_ABSOLUTE,
  C_DARK_GRAY,
} from '@opentrons/components'
import { Portal } from '../../../App/portal'
import styles from '../styles.css'

interface LabwarePositionCheckStepDetailModalProps {
  onCloseClick: () => unknown
}

const POSITION_IMGS = {
  modalNozzle1: require('../../../assets/images/lpc_modal_nozzle_1.jpg'),
  modalNozzle2: require('../../../assets/images/lpc_modal_nozzle_not_centered_1.jpg'),
  modalNozzle3: require('../../../assets/images/lpc_modal_nozzle_2.jpg'),
  modalNozzle4: require('../../../assets/images/lpc_modal_nozzle_not_centered_2.jpg'),
  modalNozzle5: require('../../../assets/images/lpc_modal_nozzle_paper.jpg'),
}

export const LabwarePositionCheckStepDetailModal = (
  props: LabwarePositionCheckStepDetailModalProps
): JSX.Element => {
  const { t } = useTranslation(['labware_position_check', 'shared'])
  return (
    <Portal level="top">
      <Modal className={styles.modal} contentsClassName={styles.modal_contents}>
        <Flex flexDirection={'column'} margin={`${SPACING_1} ${SPACING_3}`}>
          <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
            <Text
              as={'h3'}
              marginBottom={SPACING_3}
              textTransform={TEXT_TRANSFORM_UPPERCASE}
              fontWeight={FONT_WEIGHT_SEMIBOLD}
            >
              {t('labware_step_detail_modal_heading')}
            </Text>
            <Btn size={SIZE_2} onClick={props.onCloseClick}>
              <Icon name={'close'} color={C_MED_DARK_GRAY}></Icon>
            </Btn>
          </Flex>
          <Text
            as={'h4'}
            fontWeight={FONT_WEIGHT_SEMIBOLD}
            marginBottom={SPACING_3}
          >
            {t('labware_step_detail_modal_nozzle')}
          </Text>
          <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
            <Box
              position={POSITION_RELATIVE}
              width="50%"
              marginRight={SPACING_1}
            >
              <img src={POSITION_IMGS.modalNozzle1} width="100%" />
              <Text
                as={'h5'}
                position={POSITION_ABSOLUTE}
                top={SPACING_2}
                marginLeft={SPACING_3}
                marginRight={SPACING_4}
                color={C_NEAR_WHITE}
                fontWeight={FONT_WEIGHT_SEMIBOLD}
              >
                {t('labware_step_detail_modal_nozzle_image_1_text')}
              </Text>
            </Box>
            <Box
              position={POSITION_RELATIVE}
              width="50%"
              marginLeft={SPACING_1}
            >
              <img src={POSITION_IMGS.modalNozzle2} width="100%" />

              <Text
                position={POSITION_ABSOLUTE}
                top={SPACING_2}
                marginLeft={SPACING_3}
                color={C_NEAR_WHITE}
                as={'h5'}
                fontWeight={FONT_WEIGHT_SEMIBOLD}
              >
                {t('labware_step_detail_modal_nozzle_image_2_text')}
              </Text>
              <Text
                as={'h5'}
                position={POSITION_ABSOLUTE}
                top="35%"
                left="40%"
                color={'#ff5b5b'}
                fontWeight={FONT_WEIGHT_SEMIBOLD}
              >
                {t('labware_step_detail_modal_nozzle_image_2_nozzle_text')}
              </Text>
            </Box>
          </Flex>
          <Text
            as={'h4'}
            marginTop={SPACING_3}
            marginBottom={SPACING_3}
            fontWeight={FONT_WEIGHT_SEMIBOLD}
          >
            {t('labware_step_detail_modal_nozzle_or_tip')}
          </Text>
          <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
            <Box
              position={POSITION_RELATIVE}
              flex="1 1 31%"
              marginRight={SPACING_1}
            >
              <img src={POSITION_IMGS.modalNozzle3} width="100%" />
              <Text
                as={'h5'}
                position={POSITION_ABSOLUTE}
                top={SPACING_2}
                marginLeft={SPACING_3}
                fontWeight={FONT_WEIGHT_SEMIBOLD}
                color={C_NEAR_WHITE}
              >
                {t('labware_step_detail_modal_nozzle_or_tip_image_1_text')}
              </Text>
            </Box>
            <Box
              position={POSITION_RELATIVE}
              flex="1 1 31%"
              marginRight={SPACING_1}
              marginLeft={SPACING_1}
            >
              <img src={POSITION_IMGS.modalNozzle4} width="100%" />
              <Text
                as={'h5'}
                position={POSITION_ABSOLUTE}
                top={SPACING_2}
                marginLeft={SPACING_3}
                color={C_NEAR_WHITE}
                fontWeight={FONT_WEIGHT_SEMIBOLD}
              >
                {t('labware_step_detail_modal_nozzle_or_tip_image_2_text')}
              </Text>
              <Text
                as={'h5'}
                position={POSITION_ABSOLUTE}
                top="25%"
                marginLeft={'6.7rem'}
                color={'#ff5b5b'}
                fontWeight={FONT_WEIGHT_SEMIBOLD}
              >
                {t(
                  'labware_step_detail_modal_nozzle_or_tip_image_2_nozzle_text'
                )}
              </Text>
            </Box>

            <Box
              position={POSITION_RELATIVE}
              flex="1 1 31%"
              marginLeft={SPACING_1}
            >
              <img src={POSITION_IMGS.modalNozzle5} width="100%" />
              <Box
                position={POSITION_ABSOLUTE}
                bottom="0.3rem"
                backgroundColor={C_LIGHT_GRAY}
              >
                <Text
                  as={'h6'}
                  margin={SPACING_2}
                  padding={SPACING_1}
                  fontWeight={FONT_WEIGHT_SEMIBOLD}
                  color={C_DARK_GRAY}
                >
                  {t('labware_step_detail_modal_nozzle_or_tip_image_3_text')}
                </Text>
              </Box>
            </Box>
          </Flex>
          <Flex justifyContent={JUSTIFY_CENTER} marginTop={SPACING_5}>
            <NewPrimaryBtn onClick={props.onCloseClick} width={SIZE_4}>
              {t('shared:close')}
            </NewPrimaryBtn>
          </Flex>
        </Flex>
      </Modal>
    </Portal>
  )
}
