import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  Box,
  Flex,
  Link,
  Modal,
  PrimaryBtn,
  Text,
  C_BLUE,
  FONT_SIZE_BODY_2,
  FONT_WEIGHT_REGULAR,
  FONT_WEIGHT_SEMIBOLD,
  JUSTIFY_CENTER,
  SIZE_4,
  SPACING_3,
  SPACING_4,
  SPACING_5,
} from '@opentrons/components'
import { Portal } from '../../../App/portal'
import labwareHelpImage from '../../../assets/images/labware_help_example.svg'

import styles from './styles.css'

const HOW_TO_MULTIPLE_MODULES_HREF = '#' // TODO IMMEDIATELY: get the actual link

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
        <Box>
          <Text as={'h3'} marginBottom={SPACING_3}>
            {t('multiple_modules_modal_title')}
          </Text>
          <Trans
            t={t}
            i18nKey="multiple_modules_explanation"
            components={{
              block: (
                <Text
                  fontSize={FONT_SIZE_BODY_2}
                  fontWeight={FONT_WEIGHT_REGULAR}
                  marginBottom={SPACING_3}
                />
              ),
              a_how_to_multiple_modules: (
                <Link
                  fontSize={FONT_SIZE_BODY_2}
                  color={C_BLUE}
                  href={HOW_TO_MULTIPLE_MODULES_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              ),
            }}
          />
          <Box margin={`${SPACING_4} ${SPACING_5}`}>
            <Text
              as={'h4'}
              fontWeight={FONT_WEIGHT_SEMIBOLD}
              marginBottom={SPACING_3}
            >
              {t('example')}
            </Text>
            <Trans
              t={t}
              i18nKey="multiple_modules_example"
              components={{
                block: (
                  <Text
                    fontSize={FONT_SIZE_BODY_2}
                    fontWeight={FONT_WEIGHT_REGULAR}
                  />
                ),
              }}
            />
            <Box marginY={SPACING_3} marginX={SPACING_5}>
              <img src={labwareHelpImage} />
            </Box>
          </Box>

          <Flex justifyContent={JUSTIFY_CENTER}>
            <PrimaryBtn
              onClick={props.onCloseClick}
              width={SIZE_4}
              backgroundColor={C_BLUE}
            >
              {t('shared:close')}
            </PrimaryBtn>
          </Flex>
        </Box>
      </Modal>
    </Portal>
  )
}
