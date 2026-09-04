import { useTranslation } from 'react-i18next'
import find from 'lodash/find'

import {
  ALIGN_CENTER,
  Box,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  Link,
  PrimaryButton,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { LEFT, RIGHT } from '@opentrons/shared-data'

import {
  isFileSaveCanceledError,
  saveFileWithPicker,
} from '/app/local-resources/files/saveFileWithPicker'
import { CHECK_STATUS_OUTSIDE_THRESHOLD } from '/app/redux/sessions'

import { CalibrationHealthCheckResults } from './CalibrationHealthCheckResults'
import { CalibrationResult } from './CalibrationResult'
import { RenderMountInformation } from './RenderMountInformation'

import type { Mount } from '@opentrons/api-client'
import type { CalibrationPanelProps } from '/app/organisms/Desktop/CalibrationPanels/types'
import type {
  CalibrationCheckComparisonsPerCalibration,
  CalibrationCheckInstrument,
} from '/app/redux/sessions/types'

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
    void saveFileWithPicker('Robot Calibration Check Report.json', data).catch(
      (error: unknown) => {
        if (!isFileSaveCanceledError(error)) {
          throw error
        }
      }
    )
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
          ? (comparisonsByPipette?.[leftPipette.rank] ?? null)
          : null,
    },
    right: {
      pipette: rightPipette,
      calibration:
        rightPipette != null
          ? (comparisonsByPipette?.[rightPipette.rank] ?? null)
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
  const isCalibrationRecommended = (): boolean => {
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
      padding={SPACING.spacing32}
      minHeight="25rem"
    >
      <Box marginBottom="1.5rem">
        <CalibrationHealthCheckResults
          isCalibrationRecommended={isCalibrationRecommended()}
        />
      </Box>
      <Box marginBottom={SPACING.spacing16}>
        <CalibrationResult calType="deck" isBadCal={isDeckResultBad} />
      </Box>
      <RenderMountInformation mount={LEFT} pipette={leftPipette} />
      <Flex flexDirection={DIRECTION_COLUMN} marginBottom={SPACING.spacing16}>
        {leftPipette != null && (
          <>
            <CalibrationResult
              calType="pipetteOffset"
              isBadCal={
                pipetteResultsBad(calibrationsByMount.left.calibration)
                  .offsetBad
              }
            />
            <CalibrationResult
              calType="tipLength"
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
            <CalibrationResult
              calType="pipetteOffset"
              isBadCal={
                pipetteResultsBad(calibrationsByMount.right.calibration)
                  .offsetBad
              }
            />
            <CalibrationResult
              calType="tipLength"
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
