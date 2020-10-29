// @flo
import * as React from 'react'
import cx from 'classnames'
import { css } from 'styled-components'
import {
  Icon,
  Box,
  Flex,
  PrimaryButton,
  Text,
  SPACING_2,
  SPACING_3,
  ALIGN_CENTER,
  C_BLUE,
  FONT_HEADER_DARK,
  FONT_SIZE_BODY_2,
  FONT_WEIGHT_LIGHT,
  FONT_WEIGHT_SEMIBOLD,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  TEXT_TRANSFORM_CAPITALIZE,
  SPACING_5,
  SPACING_4,
  DIRECTION_COLUMN,
} from '@opentrons/components'
import { getPipetteModelSpecs } from '@opentrons/shared-data'

import find from 'lodash/find'
import * as Sessions from '../../sessions'
import { PIPETTE_MOUNTS, LEFT, RIGHT } from '../../pipettes'
import styles from './styles.css'
import { PipetteComparisons } from './PipetteComparisons'
import { saveAs } from 'file-saver'
import { NeedHelpLink } from '../CalibrationPanels/NeedHelpLink'

import type { CalibrationPanelProps } from '../CalibrationPanels/types'
import type { CalibrationHealthCheckInstrument, CalibrationHealthCheckComparisonsPerCalibration } from '../../sessions/types'

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

  const calibrationsByMount = {
    left: {
      headerText: `${LEFT} ${PIPETTE}`,
      pipette: leftPipette,
      calibration: comparisonsByPipette[leftPipette.rank],
    },
    right: {
      headerText: `${RIGHT} ${PIPETTE}`,
      pipette: rightPipette,
      calibration: comparisonsByPipette[rightPipette.rank],
    },
  }

  const deckCalibrationResult = comparisonsByPipette.first.deck.status

  return (
    <>
      <Flex width="100%" justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <Text
          css={FONT_HEADER_DARK}
          marginTop={SPACING_2}
          marginBottom={SPACING_5}
          textTransform={TEXT_TRANSFORM_CAPITALIZE}
        >
          {ROBOT_CALIBRATION_CHECK_SUMMARY_HEADER}
        </Text>
        <NeedHelpLink maxHeight="1rem" />
      </Flex>
      <Box paddingX="5%">
        <Flex marginBottom={SPACING_4}>
          <Box>
            <Text marginBottom={SPACING_2}>{DECK_CALIBRATION_HEADER}</Text>
            <RenderResult status={deckCalibrationResult} />
          </Box>
        </Flex>
        <Flex marginBottom={SPACING_5} justifyContent={JUSTIFY_SPACE_BETWEEN}>
          {PIPETTE_MOUNTS.map(m => {
            return (
              <Box key={m} width="48%">
                <Text
                  textTransform={TEXT_TRANSFORM_CAPITALIZE}
                  marginBottom={SPACING_3}
                >
                  {calibrationsByMount[m].headerText}
                </Text>
                <PipetteResult
                  pipetteInfo={calibrationsByMount[m].pipette}
                  pipetteCalibration={calibrationsByMount[m].calibration}
                />
              </Box>
            )
          })}
        </Flex>
      </Box>
      <Flex
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
        marginBottom={SPACING_5}
        flexDirection={DIRECTION_COLUMN}
        fontWeight={FONT_WEIGHT_LIGHT}
        fontSize={FONT_SIZE_BODY_2}
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
      <Flex margin={SPACING_4}>
        <PrimaryButton
          className={styles.summary_exit_button}
          onClick={cleanUpAndExit}
        >
          {HOME_AND_EXIT}
        </PrimaryButton>
      </Flex>
    </>
  )
}

type RenderResultProps = {|
  status: string,
|}

function RenderResult(props: RenderResultProps): React.Node {
  const isGoodCal = props.status === 'IN_THRESHOLD'
  return (
    <Flex>
      <Icon
        name={isGoodCal ? 'check-circle' : 'alert-circle'}
        className={cx(styles.summary_icon, {
          [styles.success_status_icon]: isGoodCal,
          [styles.error_status_icon]: !isGoodCal,
        })}
      />
      <Text fontSize={FONT_SIZE_BODY_2}>
        {isGoodCal ? GOOD_CALIBRATION : BAD_CALIBRATION}
      </Text>
    </Flex>
  )
}

type PipetteResultProps = {|
  pipetteInfo: CalibrationHealthCheckInstrument,
  pipetteCalibration: CalibrationHealthCheckComparisonsPerCalibration,
|}

function PipetteResult(props: PipetteResultProps): React.Node {
  const { pipetteInfo, pipetteCalibration } = props

  const { displayName } = getPipetteModelSpecs(pipetteInfo.model) || {}
  const tipRackdisplayName = pipetteInfo.tipRack
  return (
    <>
      <Box marginBottom={SPACING_4}>
        <Text
          fontSize={FONT_SIZE_BODY_2}
          fontWeight={FONT_WEIGHT_SEMIBOLD}
          marginBottom={SPACING_2}
        >
          {displayName}
        </Text>
        <RenderResult status={pipetteCalibration.pipetteOffset.status} />
      </Box>
      <Box>
        <Text
          fontSize={FONT_SIZE_BODY_2}
          fontWeight={FONT_WEIGHT_SEMIBOLD}
          marginBottom={SPACING_2}
        >
          {tipRackdisplayName}
        </Text>
        <RenderResult status={pipetteCalibration.tipLength.status} />
      </Box>
    </>
  )
}
