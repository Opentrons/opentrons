// @flow
import * as React from 'react'
import { css } from 'styled-components'
import {
  Icon,
  Box,
  Flex,
  PrimaryBtn,
  Text,
  SPACING_2,
  SPACING_3,
  ALIGN_CENTER,
  C_BLUE,
  COLOR_SUCCESS,
  COLOR_WARNING,
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
import { PIPETTE_MOUNTS, LEFT, RIGHT } from '../../pipettes'
import { saveAs } from 'file-saver'
import { NeedHelpLink } from '../CalibrationPanels/NeedHelpLink'

import type { CalibrationPanelProps } from '../CalibrationPanels/types'
import type {
  CalibrationCheckInstrument,
  CalibrationCheckComparisonsPerCalibration,
} from '../../sessions/types'

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

  if (!comparisonsByPipette || !instruments) {
    return null
  }

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
    (p: CalibrationCheckInstrument) => p.mount.toLowerCase() === LEFT
  )
  const rightPipette = find(
    instruments,
    (p: CalibrationCheckInstrument) => p.mount.toLowerCase() === RIGHT
  )

  const calibrationsByMount = {
    left: {
      headerText: `${LEFT} ${PIPETTE}`,
      pipette: leftPipette,
      calibration: leftPipette
        ? comparisonsByPipette?.[leftPipette.rank]
        : null,
    },
    right: {
      headerText: `${RIGHT} ${PIPETTE}`,
      pipette: rightPipette,
      calibration: rightPipette
        ? comparisonsByPipette?.[rightPipette.rank]
        : null,
    },
  }

  const deckCalibrationResult = comparisonsByPipette.first.deck?.status ?? null

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
            if (
              calibrationsByMount[m].pipette &&
              calibrationsByMount[m].calibration
            ) {
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
            }
          })}
        </Flex>
      </Box>
      <Box>
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
          <PrimaryBtn width="100%" onClick={cleanUpAndExit}>
            {HOME_AND_EXIT}
          </PrimaryBtn>
        </Flex>
      </Box>
    </>
  )
}

type RenderResultProps = {|
  status: string | null,
|}

function RenderResult(props: RenderResultProps): React.Node {
  const { status } = props
  if (!status) {
    return null
  } else {
    const isGoodCal = status === 'IN_THRESHOLD'
    return (
      <Flex>
        <Icon
          name={isGoodCal ? 'check-circle' : 'alert-circle'}
          height="1.25rem"
          width="1.25rem"
          color={isGoodCal ? COLOR_SUCCESS : COLOR_WARNING}
          marginRight="0.75rem"
        />
        <Text fontSize={FONT_SIZE_BODY_2}>
          {isGoodCal ? GOOD_CALIBRATION : BAD_CALIBRATION}
        </Text>
      </Flex>
    )
  }
}

type PipetteResultProps = {|
  pipetteInfo: CalibrationCheckInstrument,
  pipetteCalibration: CalibrationCheckComparisonsPerCalibration,
|}

function PipetteResult(props: PipetteResultProps): React.Node {
  const { pipetteInfo, pipetteCalibration } = props

  const displayName =
    getPipetteModelSpecs(pipetteInfo.model)?.displayName || pipetteInfo.model

  const tipRackdisplayName = pipetteInfo.tipRackDisplay
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
        <RenderResult
          status={pipetteCalibration.pipetteOffset?.status ?? null}
        />
      </Box>
      <Box>
        <Text
          fontSize={FONT_SIZE_BODY_2}
          fontWeight={FONT_WEIGHT_SEMIBOLD}
          marginBottom={SPACING_2}
        >
          {tipRackdisplayName}
        </Text>
        <RenderResult status={pipetteCalibration.tipLength?.status ?? null} />
      </Box>
    </>
  )
}
