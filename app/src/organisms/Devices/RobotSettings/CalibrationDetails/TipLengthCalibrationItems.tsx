import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import styled, { css } from 'styled-components'

import {
  SPACING,
  TYPOGRAPHY,
  Mount,
  BORDERS,
  COLORS,
} from '@opentrons/components'

import { StyledText } from '../../../../atoms/text'
import { OverflowMenu } from './OverflowMenu'
import { formatLastCalibrated } from './utils'
import { getDisplayNameForTipRack } from '../utils'
import { getCustomLabwareDefinitions } from '../../../../redux/custom-labware'
import { useAttachedPipettes } from '../../hooks'

import type {
  FormattedPipetteOffsetCalibration,
  FormattedTipLengthCalibration,
} from '../RobotSettingsCalibration'
import type { State } from '../../../../redux/types'

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;
`
const StyledTableHeader = styled.th`
  ${TYPOGRAPHY.labelSemiBold}
  padding: ${SPACING.spacing3};
`
const StyledTableRow = styled.tr`
  padding: ${SPACING.spacing3};
  border-bottom: ${BORDERS.lineBorder};
`
const StyledTableCell = styled.td`
  padding: ${SPACING.spacing3};
  text-overflow: wrap;
`

const BODY_STYLE = css`
  box-shadow: 0 0 0 1px ${COLORS.medGrey};
  border-radius: 3px;
`
interface TipLengthCalibrationItemsProps {
  robotName: string
  formattedPipetteOffsetCalibrations: FormattedPipetteOffsetCalibration[]
  formattedTipLengthCalibrations: FormattedTipLengthCalibration[]
  isRobotBusy: boolean
}

export function TipLengthCalibrationItems({
  robotName,
  formattedPipetteOffsetCalibrations,
  formattedTipLengthCalibrations,
  isRobotBusy,
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
        tiprack: tipLength.uri,
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
          <StyledTableHeader>{t('table_header_tiprack')}</StyledTableHeader>
          <StyledTableHeader>
            {t('table_header_model_and_serial')}
          </StyledTableHeader>
          <StyledTableHeader>
            {t('table_header_last_calibrated')}
          </StyledTableHeader>
        </tr>
      </thead>
      <tbody css={BODY_STYLE}>
        {tipLengthCalibrations.map((calibration, index) => (
          <StyledTableRow key={index}>
            <StyledTableCell>
              <StyledText as="p">
                {calibration.tiprack &&
                  getDisplayNameForTipRack(
                    calibration.tiprack,
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
                {formatLastCalibrated(calibration.lastCalibrated)}
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
                isRobotBusy={isRobotBusy}
              />
            </StyledTableCell>
          </StyledTableRow>
        ))}
      </tbody>
    </StyledTable>
  )
}
