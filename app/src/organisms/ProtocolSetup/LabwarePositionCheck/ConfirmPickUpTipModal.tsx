import * as React from 'react'
import {
  BaseModal,
  BORDER_RADIUS_1,
  C_BLUE,
  C_WHITE,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  FONT_WEIGHT_SEMIBOLD,
  JUSTIFY_FLEX_END,
  NewPrimaryBtn,
  NewSecondaryBtn,
  OVERLAY_BLACK_90,
  SPACING_1,
  SPACING_3,
  SPACING_5,
  Text,
  TEXT_TRANSFORM_UPPERCASE,
} from '@opentrons/components'
import { useTranslation } from 'react-i18next'
interface Props {
  onConfirm: () => void
  onDeny: () => void
  confirmText: string
}

export const ConfirmPickUpTipModal = (props: Props): JSX.Element => {
  const { t } = useTranslation(['labware_position_check'])

  return (
    <BaseModal borderRadius={BORDER_RADIUS_1} overlayColor={OVERLAY_BLACK_90}>
      <Flex flexDirection={DIRECTION_COLUMN}>
        <Text
          as={'h4'}
          textTransform={TEXT_TRANSFORM_UPPERCASE}
          fontWeight={FONT_WEIGHT_SEMIBOLD}
          marginBottom={SPACING_3}
          marginLeft={SPACING_1}
        >
          {t('confirm_pick_up_tip_modal_title')}
        </Text>
        <Flex
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_FLEX_END}
          paddingTop={SPACING_5}
        >
          <Flex paddingRight={SPACING_3}>
            <NewSecondaryBtn
              onClick={props.onDeny}
              width={'auto'}
              backgroundColor={C_WHITE}
              color={C_BLUE}
              id={'ConfirmPickUpTipModal_Deny'}
            >
              {t('confirm_pick_up_tip_modal_try_again_text')}
            </NewSecondaryBtn>
          </Flex>
          <NewPrimaryBtn
            onClick={props.onConfirm}
            width={'auto'}
            backgroundColor={C_BLUE}
            color={C_WHITE}
            id={'ConfirmPickUpTipModal_Deny'}
          >
            {props.confirmText}
          </NewPrimaryBtn>
        </Flex>
      </Flex>
    </BaseModal>
  )
}
