import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Link,
  Modal,
  PrimaryBtn,
  Text,
  C_BLUE,
  FONT_SIZE_BODY_2,
  FONT_WEIGHT_REGULAR,
  FONT_WEIGHT_SEMIBOLD,
  SIZE_4,
  SPACING_3,
  SPACING_4,
  SPACING_5,
} from '@opentrons/components'
import { Portal } from '../../../App/portal'
import labwareHelpImage from '../../../assets/images/labware_help_example.svg'

import styles from './styles.css'

const LABWARE_AND_PROTOCOL_BEST_PRACTICES_LINK = '#' // TODO IMMEDIATELY: get the actual link
const LABWARE_CREATOR_HREF = 'https://labware.opentrons.com/create'

interface LabwareSetupModalProps {
  onCloseClick: () => unknown
}

export const LabwareSetupModal = (
  props: LabwareSetupModalProps
): JSX.Element => {
  const { t } = useTranslation(['protocol_setup', 'shared'])
  return (
    <Portal>
      <Modal className={styles.modal} contentsClassName={styles.modal_contents}>
        <Box>
          <Text as={'h3'} marginBottom={SPACING_3}>
            {t('labware_help_modal_title')}
          </Text>
          <Text
            fontSize={FONT_SIZE_BODY_2}
            fontWeight={FONT_WEIGHT_REGULAR}
            marginBottom={SPACING_3}
          >
            {t('labware_help_modal_text_1')}
          </Text>
          <Text
            fontSize={FONT_SIZE_BODY_2}
            fontWeight={FONT_WEIGHT_REGULAR}
            marginBottom={SPACING_3}
          >
            <span>{`${t('labware_help_modal_text_2')} `}</span>
            <Link
              fontSize={FONT_SIZE_BODY_2}
              color={C_BLUE}
              href={LABWARE_AND_PROTOCOL_BEST_PRACTICES_LINK}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('learn_more_about_labware_text')}
            </Link>
          </Text>
          <Text
            fontSize={FONT_SIZE_BODY_2}
            fontWeight={FONT_WEIGHT_REGULAR}
            marginBottom={SPACING_3}
          >
            <span>{`${t('labware_help_modal_text_3')} `}</span>
            <Link
              fontSize={FONT_SIZE_BODY_2}
              color={C_BLUE}
              href={LABWARE_CREATOR_HREF}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('opentrons_labware_creator')}
            </Link>
          </Text>
          <Box margin={`${SPACING_4} ${SPACING_5}`}>
            <Text
              as={'h4'}
              fontWeight={FONT_WEIGHT_SEMIBOLD}
              marginBottom={SPACING_3}
            >
              {t('example')}
            </Text>
            <Text fontSize={FONT_SIZE_BODY_2} fontWeight={FONT_WEIGHT_REGULAR}>
              {t('example_text')}
            </Text>
            <Box margin={`${SPACING_3} ${SPACING_5}`}>
              <img src={labwareHelpImage} />
            </Box>
          </Box>

          <Box className={styles.close_button_wrapper}>
            <PrimaryBtn onClick={props.onCloseClick} width={SIZE_4}>
              {t('shared:close')}
            </PrimaryBtn>
          </Box>
        </Box>
      </Modal>
    </Portal>
  )
}
