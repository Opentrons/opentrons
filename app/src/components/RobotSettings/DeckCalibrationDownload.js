// @flow
import * as React from 'react'
import {
  Flex,
  Text,
  SPACING_1,
  SPACING_4,
  DIRECTION_COLUMN,
} from '@opentrons/components'
import { IconCta } from '../IconCta'
import { saveAs } from 'file-saver'

import type { StyleProps } from '@opentrons/components'
import type {
  DeckCalibrationData,
  DeckCalibrationStatus,
} from '../../calibration/types'

const LAST_CALIBRATED = 'Last calibrated:'
const DOWNLOAD = 'Download deck calibration data'

export const DOWNLOAD_NAME = 'download-deck-calibration'

export type DeckCalibrationDownloadProps = {|
  deckCalibrationStatus: DeckCalibrationStatus | null,
  deckCalibrationData: DeckCalibrationData | null,
  robotName: string,
  ...StyleProps,
|}

export function DeckCalibrationDownload({
  deckCalibrationData: deckCalData,
  deckCalibrationStatus: deckCalStatus,
  robotName: name,
  ...styleProps
}: DeckCalibrationDownloadProps): React.Node {
  if (deckCalStatus === null) {
    return null
  }
  const deckCalType = deckCalData?.type ?? 'affine'
  const deckCalMatrix = deckCalData?.matrix ?? deckCalData
  const isAttitude = deckCalType === 'attitude'
  const timestamp = deckCalData?.lastModified
    ? new Date(deckCalData.lastModified).toLocaleString()
    : null

  const handleDownloadButtonClick = () => {
    const report = isAttitude
      ? deckCalData
      : {
          type: deckCalType,
          matrix: deckCalMatrix,
        }
    const data = new Blob([JSON.stringify(report)], {
      type: 'application/json',
    })
    saveAs(data, `${name}-deck-calibration.json`)
  }

  return (
    <>
      <Flex flexDirection={DIRECTION_COLUMN} {...styleProps}>
        {isAttitude && (
          <Flex marginBottom={SPACING_1}>
            <Text marginRight={SPACING_4}>{LAST_CALIBRATED}</Text>
            <Text>{timestamp}</Text>
          </Flex>
        )}
        <Flex>
          <Text>{}</Text>
          <IconCta
            iconName="download"
            text={DOWNLOAD}
            name={DOWNLOAD_NAME}
            onClick={handleDownloadButtonClick}
          />
        </Flex>
      </Flex>
    </>
  )
}
