import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'

import {
  Flex,
  ALIGN_CENTER,
  SPACING,
  Icon,
  COLORS,
  TYPOGRAPHY,
  BORDERS,
} from '@opentrons/components'

import { StyledText } from '../../../../atoms/text'
import { OverflowMenu } from './OverflowMenu'
import { formatLastCalibrated } from './utils'
import { getDisplayNameForTipRack } from '../utils'
import { getCustomLabwareDefinitions } from '../../../../redux/custom-labware'
import { useAttachedPipettes } from '../../hooks'

import type { State } from '../../../../redux/types'
import type { FormattedPipetteOffsetCalibration } from '../RobotSettingsCalibration'

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
interface PipetteOffsetCalibrationItemsProps {
  robotName: string
  formattedPipetteOffsetCalibrations: FormattedPipetteOffsetCalibration[]
  updateRobotStatus: (isRobotBusy: boolean) => void
}

export function PipetteOffsetCalibrationItems({
  robotName,
  formattedPipetteOffsetCalibrations,
  updateRobotStatus,
}: PipetteOffsetCalibrationItemsProps): JSX.Element {
  const { t } = useTranslation('device_settings')

  const customLabwareDefs = useSelector((state: State) => {
    return getCustomLabwareDefinitions(state)
  })
  const attachedPipettes = useAttachedPipettes()

  return (
    <StyledTable>
      <thead>
        <tr>
          <StyledTableHeader>
            {t('table_header_model_and_serial')}
          </StyledTableHeader>
          <StyledTableHeader>{t('table_header_mount')}</StyledTableHeader>
          <StyledTableHeader>{t('table_header_tiprack')}</StyledTableHeader>
          <StyledTableHeader>
            {t('table_header_last_calibrated')}
          </StyledTableHeader>
        </tr>
      </thead>
      <tbody css={BODY_STYLE}>
        {formattedPipetteOffsetCalibrations.map(
          (calibration, index) =>
            attachedPipettes?.[calibration.mount] != null && (
              <StyledTableRow key={index}>
                <StyledTableCell>
                  <StyledText as="p">{calibration.modelName}</StyledText>
                  <StyledText as="p">{calibration.serialNumber}</StyledText>
                </StyledTableCell>
                <StyledTableCell>
                  <StyledText
                    as="p"
                    textTransform={TYPOGRAPHY.textTransformCapitalize}
                  >
                    {calibration.mount}
                  </StyledText>
                </StyledTableCell>
                <StyledTableCell>
                  <StyledText as="p">
                    {calibration.tiprack != null &&
                      getDisplayNameForTipRack(
                        calibration.tiprack,
                        customLabwareDefs
                      )}
                  </StyledText>
                </StyledTableCell>
                <StyledTableCell>
                  <Flex alignItems={ALIGN_CENTER}>
                    {calibration.lastCalibrated != null &&
                    !(calibration.markedBad ?? false) ? (
                      <>
                        <StyledText as="p">
                          {formatLastCalibrated(calibration.lastCalibrated)}
                        </StyledText>
                      </>
                    ) : (
                      <>
                        {calibration.markedBad ?? false ? (
                          <>
                            <Icon
                              name="alert-circle"
                              backgroundColor={COLORS.warningBg}
                              color={COLORS.warning}
                              size={SPACING.spacing4}
                            />
                            <StyledText
                              as="p"
                              marginLeft={SPACING.spacing2}
                              width="100%"
                              color={COLORS.warningText}
                            >
                              {t('recalibration_recommended')}
                            </StyledText>
                          </>
                        ) : (
                          <>
                            <Icon
                              name="alert-circle"
                              backgroundColor={COLORS.errorBg}
                              color={COLORS.error}
                              size={SPACING.spacing4}
                            />
                            <StyledText
                              as="p"
                              marginLeft={SPACING.spacing2}
                              width="100%"
                              color={COLORS.errorText}
                            >
                              {t('missing_calibration')}
                            </StyledText>
                          </>
                        )}
                      </>
                    )}
                  </Flex>
                </StyledTableCell>
                <StyledTableCell>
                  <OverflowMenu
                    calType="pipetteOffset"
                    robotName={robotName}
                    mount={calibration.mount}
                    serialNumber={calibration.serialNumber ?? null}
                    updateRobotStatus={updateRobotStatus}
                  />
                </StyledTableCell>
              </StyledTableRow>
            )
        )}
      </tbody>
    </StyledTable>
  )
}
