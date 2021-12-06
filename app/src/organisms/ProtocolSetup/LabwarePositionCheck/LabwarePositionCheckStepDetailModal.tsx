import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Btn,
  C_LIGHT_GRAY,
  C_MED_DARK_GRAY,
  C_NEAR_WHITE,
  DIRECTION_ROW,
  Flex,
  FONT_WEIGHT_SEMIBOLD,
  Icon,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  Modal,
  AppPrimaryBtn,
  SIZE_2,
  SIZE_4,
  SPACING_1,
  SPACING_2,
  SPACING_3,
  SPACING_4,
  SPACING_5,
  Text,
  TEXT_TRANSFORM_UPPERCASE,
} from '@opentrons/components'
import { Portal } from '../../../App/portal'
import labwarePositionCheckModalImage1 from '../../../assets/images/labware_position_check_modal_nozzle_image_1.svg'
import labwarePositionCheckModalImage2 from '../../../assets/images/labware_position_check_modal_nozzle_image2.svg'
import labwarePositionCheckModalImage3 from '../../../assets/images/labware_position_check_modal_nozzle_or_tip_image1.svg'
import labwarePositionCheckModalImage4 from '../../../assets/images/labware_position_check_modal_nozzle_or_tip_image2.svg'
import labwarePositionCheckModalImage5 from '../../../assets/images/labware_position_check_modal_nozzle_or_tip_image3.svg'
import styles from '../styles.css'

interface LabwarePositionCheckStepDetailModalProps {
  onCloseClick: () => unknown
}
export const LabwarePositionCheckStepDetailModal = (
  props: LabwarePositionCheckStepDetailModalProps
): JSX.Element => {
  const { t } = useTranslation(['labware_position_check', 'shared'])
  return (
    <Portal level="top">
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
            marginLeft={SPACING_3}
          >
            {t('labware_step_detail_modal_nozzle')}
          </Text>
          <Flex
            justifyContent={JUSTIFY_CENTER}
            marginLeft={SPACING_3}
            marginRight={SPACING_3}
          >
            <Box
              style={{
                backgroundImage: `url(${labwarePositionCheckModalImage1})`,
              }}
              marginRight={SPACING_1}
            >
              <Text
                color={C_NEAR_WHITE}
                as={'h5'}
                fontWeight={FONT_WEIGHT_SEMIBOLD}
                marginTop={SPACING_2}
                marginLeft={SPACING_3}
                marginRight={SPACING_4}
              >
                {t('labware_step_detail_modal_nozzle_image_1_text')}
              </Text>
            </Box>
            <Box
              style={{
                backgroundImage: `url(${labwarePositionCheckModalImage2})`,
              }}
              marginLeft={SPACING_1}
            >
              <Box height="18rem">
                <Text
                  color={C_NEAR_WHITE}
                  as={'h5'}
                  fontWeight={FONT_WEIGHT_SEMIBOLD}
                  marginTop={SPACING_2}
                  marginLeft={SPACING_3}
                  marginRight={SPACING_4}
                >
                  {t('labware_step_detail_modal_nozzle_image_2_text')}
                </Text>
                <Text
                  color={'#ff5b5b'}
                  as={'h5'}
                  fontWeight={FONT_WEIGHT_SEMIBOLD}
                  marginTop={'4.5rem'}
                  marginLeft={'8.5rem'}
                >
                  {t('labware_step_detail_modal_nozzle_image_2_nozzle_text')}
                </Text>
              </Box>
            </Box>
          </Flex>
          <Text
            as={'h4'}
            fontWeight={FONT_WEIGHT_SEMIBOLD}
            marginBottom={SPACING_3}
            marginLeft={SPACING_3}
          >
            {t('labware_step_detail_modal_nozzle_or_tip')}
          </Text>
          <Flex justifyContent={JUSTIFY_CENTER}>
            <Box
              style={{
                backgroundImage: `url(${labwarePositionCheckModalImage3})`,
              }}
              height="15.5rem"
              width="15rem"
              marginRight={SPACING_1}
            >
              <Text
                color={C_NEAR_WHITE}
                as={'h5'}
                fontWeight={FONT_WEIGHT_SEMIBOLD}
                marginTop={SPACING_2}
                marginLeft={SPACING_3}
                marginRight={SPACING_4}
              >
                {t('labware_step_detail_modal_nozzle_or_tip_image_1_text')}
              </Text>
            </Box>
            <Box
              style={{
                backgroundImage: `url(${labwarePositionCheckModalImage4})`,
                backgroundRepeat: 'no-repeat',
              }}
              height="15.5rem"
              width="15rem"
              marginRight={SPACING_1}
              marginLeft={SPACING_1}
            >
              <Text
                color={C_NEAR_WHITE}
                as={'h5'}
                fontWeight={FONT_WEIGHT_SEMIBOLD}
                marginTop={SPACING_2}
                marginLeft={SPACING_3}
              >
                {t('labware_step_detail_modal_nozzle_or_tip_image_2_text')}
              </Text>
              <Text
                color={'#ff5b5b'}
                as={'h5'}
                fontWeight={FONT_WEIGHT_SEMIBOLD}
                marginTop={'1.7rem'}
                marginLeft={'6.7rem'}
              >
                {t(
                  'labware_step_detail_modal_nozzle_or_tip_image_2_nozzle_text'
                )}
              </Text>
            </Box>
            <Flex
              flext-direction={DIRECTION_ROW}
              justifyContent={JUSTIFY_CENTER}
            >
              <Box
                style={{
                  backgroundImage: `url(${labwarePositionCheckModalImage5})`,
                  backgroundRepeat: 'no-repeat',
                }}
                height="15.5rem"
                marginLeft={SPACING_1}
              >
                <Box
                  backgroundColor={C_LIGHT_GRAY}
                  width="14rem"
                  height="4.4rem"
                >
                  <Text
                    as={'h6'}
                    fontWeight={FONT_WEIGHT_SEMIBOLD}
                    color={'#4a4a4a'}
                    paddingTop={SPACING_1}
                    paddingLeft={SPACING_1}
                    marginTop={'11.18rem'}
                    marginLeft={SPACING_2}
                  >
                    {t('labware_step_detail_modal_nozzle_or_tip_image_3_text')}
                  </Text>
                </Box>
              </Box>
            </Flex>
          </Flex>
          <Flex justifyContent={JUSTIFY_CENTER} marginTop={SPACING_5}>
            <AppPrimaryBtn onClick={props.onCloseClick} width={SIZE_4}>
              {t('shared:close')}
            </AppPrimaryBtn>
          </Flex>
        </Flex>
      </Modal>
    </Portal>
  )
}
