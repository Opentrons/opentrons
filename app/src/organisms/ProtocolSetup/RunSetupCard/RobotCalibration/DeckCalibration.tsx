import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  Text,
  Flex,
  Link,
  Box,
  SPACING_2,
  SPACING_3,
  C_BLUE,
  FONT_HEADER_THIN,
  DIRECTION_ROW,
  FONT_SIZE_BODY_1,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
} from '@opentrons/components'
import * as Calibration from '../../../../redux/calibration'
import { CalibrationItem } from './CalibrationItem'

import type { State } from '../../../../redux/types'
import type { DeckCalibrationData } from '../../../../redux/calibration/types'
import { DeckCalibrationModal } from './DeckCalibrationModal'

interface Props {
  robotName: string
}

export function DeckCalibration(props: Props): JSX.Element | null {
  const { robotName } = props
  const { t } = useTranslation(['protocol_setup', 'shared'])
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
    <Box>
      <React.Fragment>
        {helpModalIsOpen && (
          <DeckCalibrationModal
            onCloseClick={() => setHelpModalIsOpen(false)}
          />
        )}
        <Flex
          marginTop={SPACING_3}
          flexDirection={DIRECTION_ROW}
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
        >
          <Text
            as={'h2'}
            css={FONT_HEADER_THIN}
            paddingBottom={SPACING_2}
            id={'DeckCalibration_deckCalibrationTitle'}
          >
            {t('deck_calibration_title')}
          </Text>
          <Link
            role={'link'}
            onClick={() => setHelpModalIsOpen(true)}
            color={C_BLUE}
            fontSize={FONT_SIZE_BODY_1}
            id={'DeckCalibration_robotCalibrationHelpLink'}
          >
            {t('robot_cal_help_title')}
          </Link>
        </Flex>
        <CalibrationItem index={0} calibratedDate={deckCalData.lastModified} />
      </React.Fragment>
    </Box>
  )
}
