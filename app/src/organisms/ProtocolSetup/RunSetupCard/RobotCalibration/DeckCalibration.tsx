import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation, Trans } from 'react-i18next'
import {
  Text,
  Flex,
  Link,
  Box,
  Icon,
  BaseModal,
  PrimaryBtn,
  SPACING_3,
  SIZE_4,
  C_BLUE,
  FONT_HEADER_DARK,
  FONT_BODY_1_DARK,
  FONT_HEADER_THIN,
  DIRECTION_ROW,
  FONT_WEIGHT_SEMIBOLD,
  FONT_SIZE_BODY_1,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
} from '@opentrons/components'
import { Portal } from '../../../../App/portal'
import * as Calibration from '../../../../redux/calibration'
import { CalibrationItem } from './CalibrationItem'

import type { State } from '../../../../redux/types'
import type { DeckCalibrationData } from '../../../../redux/calibration/types'

interface Props {
  robotName: string
}

export function DeckCalibration(props: Props): JSX.Element | null {
  const { robotName } = props
  const { t } = useTranslation(['protocol_setup'])
  const [helpModalIsOpen, setHelpModalIsOpen] = React.useState(false)

  const deckCalData: DeckCalibrationData | null = useSelector(
    (state: State) => {
      return Calibration.getDeckCalibrationData(state, robotName)
    }
  )

  // this component's parent should never be rendered if there is no deckCalData
  if (
    deckCalData == null ||
    !('lastModified' in deckCalData) ||
    typeof deckCalData.lastModified !== 'string'
  ) {
    return null
  }

  return (
    <div>
      <Flex
        marginTop={SPACING_3}
        flexDirection={DIRECTION_ROW}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <Text css={FONT_HEADER_THIN}>{`${t('deck_calibration_title')}`}</Text>
        <Text onClick={() => setHelpModalIsOpen(true)} color={C_BLUE}>
          {t('robot_cal_help_title')}
        </Text>
      </Flex>
      <CalibrationItem
        index={0}
        calibratedDate={deckCalData.lastModified}
        calibrated={true}
      />
      {helpModalIsOpen && (
        <Portal level={'top'}>
          <BaseModal>
            <Box width="800">
              <Flex
                flexDirection={DIRECTION_ROW}
                alignItems={ALIGN_CENTER}
                justifyContent={JUSTIFY_SPACE_BETWEEN}
              >
                <Text css={FONT_HEADER_DARK}>{t('robot_cal_help_title')}</Text>
                <div onClick={() => setHelpModalIsOpen(false)}>
                  <Icon name={'close'} size={'1.5rem'} />
                </div>
              </Flex>
              <Text css={FONT_BODY_1_DARK} marginTop={'1.5rem'}>
                <Trans
                  t={t}
                  i18nKey="robot_cal_description"
                  components={{
                    a_help_article: (
                      <Link
                        color={C_BLUE}
                        onClick={() => null}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    ),
                  }}
                />
              </Text>
              <Box textAlign="center" marginTop={'1.5rem'}>
                <img
                  src={'../../../../assets/images/robot_calibration_help.png'}
                  width="700"
                  height="275"
                />
              </Box>
              <Text
                fontWeight={FONT_WEIGHT_SEMIBOLD}
                fontSize={FONT_SIZE_BODY_1}
                marginTop={'1rem'}
              >
                {t('deck_calibration_title')}
              </Text>
              <Text fontSize={FONT_SIZE_BODY_1} marginTop={'.75rem'}>
                {t('robot_cal_description')}
              </Text>
              <Text
                fontWeight={FONT_WEIGHT_SEMIBOLD}
                fontSize={FONT_SIZE_BODY_1}
                marginTop={'1rem'}
              >
                {t('tip_length_cal_title')}
              </Text>
              <Text fontSize={FONT_SIZE_BODY_1} marginTop={'.75rem'}>
                {t('tip_length_cal_description')}
              </Text>
              <Text
                fontWeight={FONT_WEIGHT_SEMIBOLD}
                fontSize={FONT_SIZE_BODY_1}
                marginTop={'1rem'}
              >
                {t('pipette_offset_cal')}
              </Text>
              <Text fontSize={FONT_SIZE_BODY_1} marginTop={'.75rem'}>
                <Trans t={t} i18nKey="pipette_offset_cal_description" />
              </Text>
              <Box textAlign="center" marginTop={'1.5rem'}>
                <PrimaryBtn
                  onClick={() => setHelpModalIsOpen(false)}
                  width={SIZE_4}
                  backgroundColor={C_BLUE}
                >
                  {t('shared:close')}
                </PrimaryBtn>
              </Box>
            </Box>
          </BaseModal>
        </Portal>
      )}
    </div>
  )
}
