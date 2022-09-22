import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { saveAs } from 'file-saver'

import {
  Box,
  Flex,
  Link,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
  SPACING,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
} from '@opentrons/components'

import find from 'lodash/find'
import { LEFT, RIGHT } from '../../../redux/pipettes'
import { CHECK_STATUS_OUTSIDE_THRESHOLD } from '../../../redux/sessions'
import { PrimaryButton } from '../../../atoms/buttons'
import { CalibrationHealthCheckResults } from './CalibrationHealthCheckResults'
import { DeckCalibrationResult } from './DeckCalibrationResult'
import { RenderMountInformation } from './RenderMountInformation'
import { PipetteCalibrationResult } from './PipetteCalibrationResult'
import { TipLengthCalibrationResult } from './TipLengthCalibrationResult'

import type { Mount } from '../../../redux/pipettes/types'
import type { CalibrationPanelProps } from '../../../organisms/CalibrationPanels/types'
import type {
  CalibrationCheckInstrument,
  CalibrationCheckComparisonsPerCalibration,
} from '../../../redux/sessions/types'

export function ResultsSummary(
  props: CalibrationPanelProps
): JSX.Element | null {
  const {
    comparisonsByPipette,
    instruments,
    checkBothPipettes,
    cleanUpAndExit,
  } = props
  const { t } = useTranslation('robot_calibration')
  if (comparisonsByPipette == null || instruments == null) {
    return null
  }

  console.log('comparisonsByPipette', comparisonsByPipette)
  console.log('instruments', instruments)
  console.log('checkBothPipettes', checkBothPipettes)

  const handleDownloadButtonClick = (): void => {
    const now = new Date()
    const report = {
      comparisonsByPipette,
      instruments,
      savedAt: now.toISOString(),
    }
    const data = new Blob([JSON.stringify(report, null, 4)], {
      type: 'application/json',
    })
    saveAs(data, 'Robot Calibration Check Report.json')
  }

  const leftPipette = find(
    instruments,
    (p: CalibrationCheckInstrument) => p.mount.toLowerCase() === LEFT
  )
  const rightPipette = find(
    instruments,
    (p: CalibrationCheckInstrument) => p.mount.toLowerCase() === RIGHT
  )
  type CalibrationByMount = {
    [m in Mount]: {
      pipette: CalibrationCheckInstrument | undefined
      calibration: CalibrationCheckComparisonsPerCalibration | null
    }
  }

  const calibrationsByMount: CalibrationByMount = {
    left: {
      pipette: leftPipette,
      calibration:
        leftPipette != null
          ? comparisonsByPipette?.[leftPipette.rank] ?? null
          : null,
    },
    right: {
      pipette: rightPipette,
      calibration:
        rightPipette != null
          ? comparisonsByPipette?.[rightPipette.rank] ?? null
          : null,
    },
  }

  const getDeckCalibration = checkBothPipettes
    ? comparisonsByPipette.second.deck?.status
    : comparisonsByPipette.first.deck?.status
  const deckCalibrationResult = getDeckCalibration ?? null

  const pipetteResultsBad = (
    perPipette: CalibrationCheckComparisonsPerCalibration | null
  ): { offsetBad: boolean; tipLengthBad: boolean } => ({
    offsetBad: perPipette?.pipetteOffset?.status
      ? perPipette.pipetteOffset.status === CHECK_STATUS_OUTSIDE_THRESHOLD
      : false,
    tipLengthBad: perPipette?.tipLength?.status
      ? perPipette.tipLength.status === CHECK_STATUS_OUTSIDE_THRESHOLD
      : false,
  })

  const isDeckResultBad =
    deckCalibrationResult != null
      ? deckCalibrationResult === CHECK_STATUS_OUTSIDE_THRESHOLD
      : false

  // check all calibration status
  // if all of them are good, this returns true. otherwise return false
  const isCalibrationCompleted = (): boolean => {
    const isOffsetsBad =
      pipetteResultsBad(calibrationsByMount.left.calibration).offsetBad &&
      pipetteResultsBad(calibrationsByMount.right.calibration).offsetBad
    const isTipLensBad =
      pipetteResultsBad(calibrationsByMount.left.calibration).tipLengthBad &&
      pipetteResultsBad(calibrationsByMount.right.calibration).tipLengthBad
    return isDeckResultBad && isOffsetsBad && isTipLensBad
  }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={SPACING.spacing6}
      minHeight="25rem"
    >
      <Box marginBottom="1.5rem">
        <CalibrationHealthCheckResults
          isCalibrationCompleted={isCalibrationCompleted()}
        />
      </Box>
      <Box marginBottom={SPACING.spacing4}>
        <DeckCalibrationResult isBadCal={isDeckResultBad} />
      </Box>
      <RenderMountInformation mount={LEFT} pipette={leftPipette} />
      <Flex flexDirection={DIRECTION_COLUMN} marginBottom={SPACING.spacing4}>
        {leftPipette != null && (
          <>
            <PipetteCalibrationResult
              isBadCal={
                pipetteResultsBad(calibrationsByMount.left.calibration)
                  .offsetBad
              }
            />
            <TipLengthCalibrationResult
              isBadCal={
                pipetteResultsBad(calibrationsByMount.right.calibration)
                  .tipLengthBad
              }
            />
          </>
        )}
      </Flex>
      <RenderMountInformation mount={RIGHT} pipette={rightPipette} />
      <Flex flexDirection={DIRECTION_COLUMN} marginBottom="3.75rem">
        {rightPipette != null && (
          <>
            <PipetteCalibrationResult
              isBadCal={
                pipetteResultsBad(calibrationsByMount.right.calibration)
                  .offsetBad
              }
            />
            <TipLengthCalibrationResult
              isBadCal={
                pipetteResultsBad(calibrationsByMount.right.calibration)
                  .tipLengthBad
              }
            />
          </>
        )}
      </Flex>
      <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
      >
        <Link
          role="button"
          onClick={handleDownloadButtonClick}
          css={TYPOGRAPHY.linkPSemiBold}
          data-testid="ResultsSummary_Download_Button"
        >
          {t('download_details')}
        </Link>
        <PrimaryButton onClick={cleanUpAndExit}>{t('finish')}</PrimaryButton>
      </Flex>
    </Flex>
  )
}
