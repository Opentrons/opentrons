import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import styled, { css } from 'styled-components'

import { BORDERS, COLORS, SPACING, TYPOGRAPHY } from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import { useAttachedPipettes } from '../../../organisms/Devices/hooks'
import { getCustomLabwareDefinitions } from '../../../redux/custom-labware'
import { OverflowMenu } from './OverflowMenu'
import { formatLastCalibrated, getDisplayNameForTipRack } from './utils'

import type { Mount } from '@opentrons/components'
import type { State } from '../../../redux/types'
import type { FormattedTipLengthCalibration } from '../RobotSettingsTipLengthCalibration'
import type { FormattedPipetteOffsetCalibration } from '..'

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;
`
const StyledTableHeader = styled.th`
  ${TYPOGRAPHY.labelSemiBold}
  padding: ${SPACING.spacing8};
`
const StyledTableRow = styled.tr`
  padding: ${SPACING.spacing8};
  border-bottom: ${BORDERS.lineBorder};
`
const StyledTableCell = styled.td`
  padding: ${SPACING.spacing8};
  text-overflow: wrap;
`

const BODY_STYLE = css`
  box-shadow: 0 0 0 1px ${COLORS.medGreyEnabled};
  border-radius: 3px;
`
interface TipLengthCalibrationItemsProps {
  robotName: string
  formattedPipetteOffsetCalibrations: FormattedPipetteOffsetCalibration[]
  formattedTipLengthCalibrations: FormattedTipLengthCalibration[]
  updateRobotStatus: (isRobotBusy: boolean) => void
}

export function TipLengthCalibrationItems({
  robotName,
  formattedPipetteOffsetCalibrations,
  formattedTipLengthCalibrations,
  updateRobotStatus,
}: TipLengthCalibrationItemsProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const customLabwareDefs = useSelector((state: State) => {
    return getCustomLabwareDefinitions(state)
  })
  const attachedPipettes = useAttachedPipettes()
  const tipLengthCalibrations = formattedTipLengthCalibrations.map(
    tipLength => {
      return {
        modelName: formattedPipetteOffsetCalibrations.find(
          p => p.serialNumber === tipLength.pipette
        )?.modelName,
        serialNumber: tipLength.pipette,
        mount: formattedPipetteOffsetCalibrations.find(
          p => p.serialNumber === tipLength.pipette
        )?.mount,
        tiprackDefURI: tipLength.uri,
        lastCalibrated: tipLength.lastCalibrated,
      }
    }
  )

  const checkMountWithAttachedPipettes = (serialNumber: string): Mount => {
    return ['left', 'right'].find((mount, index) => {
      const pipette = Object.values(
        attachedPipettes != null && attachedPipettes
      )[index]
      return pipette?.id === serialNumber
    }) as Mount
  }

  return (
    <StyledTable>
      <thead>
        <tr>
          <StyledTableHeader>{t('tiprack')}</StyledTableHeader>
          <StyledTableHeader>{t('model_and_serial')}</StyledTableHeader>
          <StyledTableHeader>{t('last_calibrated_label')}</StyledTableHeader>
        </tr>
      </thead>
      <tbody css={BODY_STYLE}>
        {tipLengthCalibrations.map((calibration, index) => (
          <StyledTableRow key={index}>
            <StyledTableCell>
              <StyledText as="p">
                {calibration.tiprackDefURI &&
                  getDisplayNameForTipRack(
                    calibration.tiprackDefURI,
                    customLabwareDefs
                  )}
              </StyledText>
            </StyledTableCell>
            <StyledTableCell>
              <StyledText as="p">{calibration.modelName}</StyledText>
              <StyledText as="p">{calibration.serialNumber}</StyledText>
            </StyledTableCell>
            <StyledTableCell>
              <StyledText as="p">
                {calibration.lastCalibrated !== undefined
                  ? formatLastCalibrated(calibration.lastCalibrated)
                  : 'Not calibrated'}
              </StyledText>
            </StyledTableCell>
            <StyledTableCell>
              <OverflowMenu
                calType="tipLength"
                robotName={robotName}
                serialNumber={calibration.serialNumber}
                mount={
                  calibration.mount != null
                    ? calibration.mount
                    : checkMountWithAttachedPipettes(calibration.serialNumber)
                }
                updateRobotStatus={updateRobotStatus}
                tiprackDefURI={calibration.tiprackDefURI}
              />
            </StyledTableCell>
          </StyledTableRow>
        ))}
      </tbody>
    </StyledTable>
  )
}
