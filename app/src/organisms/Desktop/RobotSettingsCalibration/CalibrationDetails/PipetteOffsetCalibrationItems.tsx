import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  Flex,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { LEFT } from '@opentrons/shared-data'

import { useAttachedPipettesFromInstrumentsQuery } from '/app/resources/instruments'

import { OverflowMenu } from './OverflowMenu'
import { formatLastCalibrated } from './utils'

import type { ReactNode } from 'react'
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
  box-shadow: 0 0 0 1px ${COLORS.grey30};
  border-radius: 3px;
`
interface PipetteOffsetCalibrationItemsProps {
  robotName: string
  isRobotBusy: boolean
  formattedPipetteOffsetCalibrations: FormattedPipetteOffsetCalibration[]
}

export function PipetteOffsetCalibrationItems({
  robotName,
  isRobotBusy,
  formattedPipetteOffsetCalibrations,
}: PipetteOffsetCalibrationItemsProps): ReactNode {
  const { t } = useTranslation('device_settings')

  const attachedPipettesFromInstrumentQuery =
    useAttachedPipettesFromInstrumentsQuery()

  const is96Attached =
    attachedPipettesFromInstrumentQuery?.[LEFT]?.instrumentName === 'p1000_96'
  return (
    <StyledTable>
      <thead>
        <tr>
          <StyledTableHeader>{t('model_and_serial')}</StyledTableHeader>
          <StyledTableHeader>{t('mount')}</StyledTableHeader>
          <StyledTableHeader>{t('last_calibrated_label')}</StyledTableHeader>
        </tr>
      </thead>
      <tbody css={BODY_STYLE}>
        {formattedPipetteOffsetCalibrations.map(
          (calibration, index) =>
            attachedPipettesFromInstrumentQuery?.[calibration.mount] !=
              null && (
              <StyledTableRow key={index}>
                <StyledTableCell>
                  <StyledText forwardedAs="p">
                    {calibration.modelName}
                  </StyledText>
                  <StyledText forwardedAs="p">
                    {calibration.serialNumber}
                  </StyledText>
                </StyledTableCell>
                <StyledTableCell>
                  <StyledText
                    forwardedAs="p"
                    textTransform={TYPOGRAPHY.textTransformCapitalize}
                  >
                    {is96Attached ? t('both') : calibration.mount}
                  </StyledText>
                </StyledTableCell>
                <StyledTableCell>
                  <Flex alignItems={ALIGN_CENTER}>
                    {calibration.lastCalibrated != null &&
                    !(calibration.markedBad ?? false) ? (
                      <>
                        <StyledText forwardedAs="p">
                          {formatLastCalibrated(calibration.lastCalibrated)}
                        </StyledText>
                      </>
                    ) : (
                      <StyledText forwardedAs="p">
                        {calibration.lastCalibrated != null &&
                        calibration.markedBad === true ? (
                          <>
                            {formatLastCalibrated(calibration.lastCalibrated)}
                          </>
                        ) : (
                          <>{t('not_calibrated_short')}</>
                        )}
                      </StyledText>
                    )}
                  </Flex>
                </StyledTableCell>
                <StyledTableCell>
                  <OverflowMenu
                    calType="pipetteOffset"
                    robotName={robotName}
                    isRobotBusy={isRobotBusy}
                    mount={calibration.mount}
                    serialNumber={calibration.serialNumber ?? null}
                    pipetteName={
                      attachedPipettesFromInstrumentQuery[calibration.mount]
                        ?.instrumentName ?? null
                    }
                  />
                </StyledTableCell>
              </StyledTableRow>
            )
        )}
      </tbody>
    </StyledTable>
  )
}
