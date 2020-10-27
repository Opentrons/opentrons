// @flo
import * as React from 'react'
import cx from 'classnames'
import { css } from 'styled-components'
import {
  Icon,
  Box,
  Flex,
  Link,
  PrimaryButton,
  OutlineButton,
  Text,
  SPACING_2,
  SPACING_3,
  ALIGN_CENTER,
  C_BLUE,
  FONT_HEADER_DARK,
  FONT_SIZE_BODY_2,
  FONT_WEIGHT_BOLD,
  FONT_WEIGHT_LIGHT,
  FONT_WEIGHT_SEMIBOLD,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  TEXT_TRANSFORM_CAPITALIZE,
  SPACING_5,
  SPACING_4,
  DIRECTION_ROW,
  DIRECTION_COLUMN,
  SPACING_6,
} from '@opentrons/components'
import { getPipetteModelSpecs } from '@opentrons/shared-data'

import find from 'lodash/find'
import * as Sessions from '../../sessions'
import { LEFT, RIGHT } from '../../pipettes'
import styles from './styles.css'
import { PipetteComparisons } from './PipetteComparisons'
import { saveAs } from 'file-saver'
import { NeedHelpLink } from '../CalibrationPanels/NeedHelpLink'

import type { CalibrationPanelProps } from '../CalibrationPanels/types'
import type { CalibrationHealthCheckInstrument } from '../../sessions/types'

const GOOD_CALIBRATION = 'Good calibration'
const BAD_CALIBRATION = 'Bad calibration'

const ROBOT_CALIBRATION_CHECK_SUMMARY_HEADER = 'health check results:'
const DECK_CALIBRATION_HEADER = 'Robot Deck'
const PIPETTE = 'pipette'
const HOME_AND_EXIT = 'Home robot and exit'
const LOOKING_FOR_DATA = 'Looking for your detailed calibration data?'
const DOWNLOAD_SUMMARY = 'Download JSON summary'

export function ResultsSummary(props: CalibrationPanelProps): React.Node {
  const { comparisonsByPipette, instruments, cleanUpAndExit } = props

  const handleDownloadButtonClick = () => {
    const now = new Date()
    const report = {
      comparisonsByPipette,
      instruments,
      savedAt: now.toISOString(),
    }
    const data = new Blob([JSON.stringify(report)], {
      type: 'application/json',
    })
    saveAs(data, 'OT-2 Robot Calibration Check Report.json')
  }

  const leftPipette = find(
    instruments,
    (p: CalibrationHealthCheckInstrument) => p.mount.toLowerCase() === LEFT
  )
  const rightPipette = find(
    instruments,
    (p: CalibrationHealthCheckInstrument) => p.mount.toLowerCase() === RIGHT
  )

  return (
    <>
      <Flex width="100%" justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <Text
          css={FONT_HEADER_DARK}
          marginBottom={SPACING_4}
          textTransform={TEXT_TRANSFORM_CAPITALIZE}
        >
          {ROBOT_CALIBRATION_CHECK_SUMMARY_HEADER}
        </Text>
        <NeedHelpLink maxHeight="1rem" />
      </Flex>
      <Box marginX="5%">
        <Flex marginBottom={SPACING_4}>
          <Text>{DECK_CALIBRATION_HEADER}</Text>
        </Flex>
        <Flex marginBottom={SPACING_5}>
          {leftPipette && (
            <Box width="50%">
              <Text
                textTransform={TEXT_TRANSFORM_CAPITALIZE}
                marginBottom={SPACING_3}
              >{`${LEFT} ${PIPETTE}`}</Text>
              <PipetteResult pipette={leftPipette} />
            </Box>
          )}
          {rightPipette && (
            <Box>
              <Text
                textTransform={TEXT_TRANSFORM_CAPITALIZE}
                marginBottom={SPACING_3}
              >{`${RIGHT} ${PIPETTE}`}</Text>
              <PipetteResult pipette={rightPipette} />
            </Box>
          )}
        </Flex>
      </Box>
      <Flex
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
        marginBottom={SPACING_6}
        flexDirection={DIRECTION_COLUMN}
        fontWeight={FONT_WEIGHT_LIGHT}
      >
        <Text>{LOOKING_FOR_DATA}</Text>
        <Text
          as="a"
          color={C_BLUE}
          onClick={handleDownloadButtonClick}
          css={css`
            cursor: pointer;
          `}
        >
          {DOWNLOAD_SUMMARY}
        </Text>
      </Flex>
      <PrimaryButton
        className={styles.summary_exit_button}
        onClick={cleanUpAndExit}
      >
        {HOME_AND_EXIT}
      </PrimaryButton>
    </>
  )
}

type PipetteResultProps = {|
  pipette: CalibrationHealthCheckInstrument,
|}

function PipetteResult(props: PipetteResultProps): React.Node {
  const { pipette } = props

  const { displayName } = getPipetteModelSpecs(pipette.model) || {}
  const markedBad = false
  return (
    <>
      <Box marginBottom={SPACING_3}>
        <Text fontWeight={FONT_WEIGHT_SEMIBOLD} marginBottom={SPACING_2}>
          {displayName}
        </Text>
        <Flex>
          <Icon
            name={markedBad ? 'alert-circle' : 'check-circle'}
            className={cx(styles.summary_icon, {
              [styles.success_status_icon]: !markedBad,
              [styles.error_status_icon]: markedBad,
            })}
          />
          <Text fontSize={FONT_SIZE_BODY_2}>
            {markedBad ? BAD_CALIBRATION : GOOD_CALIBRATION}
          </Text>
        </Flex>
      </Box>
    </>
  )
}
