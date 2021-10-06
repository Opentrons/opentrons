import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  Link,
  Icon,
  Btn,
  Modal,
  PrimaryBtn,
  Text,
  C_BLUE,
  C_MED_DARK_GRAY,
  FONT_SIZE_BODY_1,
  JUSTIFY_SPACE_BETWEEN,
  FONT_WEIGHT_REGULAR,
  FONT_WEIGHT_SEMIBOLD,
  JUSTIFY_CENTER,
  SIZE_4,
  SIZE_2,
  SPACING_3,
  DIRECTION_COLUMN,
  SPACING_1,
  SPACING_4,
} from '@opentrons/components'
import { Portal } from '../../../../App/portal'
import multipleModuleHelp from '../../../../assets/images/MoaM_modal_Image.svg'
import styles from '../../styles.css'

const HOW_TO_MULTIPLE_MODULES_HREF =
  'https://support.opentrons.com/en/articles/5167312-using-modules-of-the-same-type-on-the-ot-2'

interface MultipleModulesModalProps {
  onCloseClick: () => unknown
}

export const MultipleModulesModal = (
  props: MultipleModulesModalProps
): JSX.Element => {
  const { t } = useTranslation(['protocol_setup', 'shared'])
  return (
    <Portal level="top">
      <Modal className={styles.modal} contentsClassName={styles.modal_contents}>
        <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Text as={'h3'} marginBottom={SPACING_3}>
            {t('multiple_modules_modal_title')}
          </Text>
          <Btn size={SIZE_2} onClick={props.onCloseClick}>
            <Icon name={'close'} color={C_MED_DARK_GRAY}></Icon>
          </Btn>
        </Flex>
        <Flex flexDirection={DIRECTION_COLUMN} paddingLeft={SPACING_3}>
          <Flex flexDirection={DIRECTION_COLUMN}>
            <Text
              fontSize={FONT_SIZE_BODY_1}
              fontWeight={FONT_WEIGHT_REGULAR}
              marginBottom={SPACING_3}
            >
              {t('multiple_modules_explanation')}
            </Text>
            <Link
              fontSize={FONT_SIZE_BODY_1}
              color={C_BLUE}
              href={HOW_TO_MULTIPLE_MODULES_HREF}
              target="_blank"
              rel="noopener noreferrer"
              marginBottom={SPACING_3}
            >
              {t('multiple_modules_link')}
              <Icon name={'open-in-new'} marginLeft={SPACING_1} size="10px" />
            </Link>
            <Text
              as={'h4'}
              fontWeight={FONT_WEIGHT_SEMIBOLD}
              marginBottom={SPACING_3}
            >
              {t('example')}
            </Text>

            <Text
              fontSize={FONT_SIZE_BODY_1}
              fontWeight={FONT_WEIGHT_REGULAR}
              title={t('multiple_modules_example')}
              marginBottom={SPACING_4}
            >
              {t('multiple_modules_example')}
            </Text>
          </Flex>
          <img src={multipleModuleHelp} />
        </Flex>
        <Flex justifyContent={JUSTIFY_CENTER}>
          <PrimaryBtn
            onClick={props.onCloseClick}
            width={SIZE_4}
            backgroundColor={C_BLUE}
            marginTop={SPACING_3}
          >
            {t('shared:close')}
          </PrimaryBtn>
        </Flex>
      </Modal>
    </Portal>
  )
}
