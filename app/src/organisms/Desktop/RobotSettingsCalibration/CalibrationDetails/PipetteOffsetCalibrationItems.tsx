import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  Flex,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { OverflowMenu } from './OverflowMenu'
import { formatLastCalibrated, getDisplayNameForTipRack } from './utils'
import { getCustomLabwareDefinitions } from '/app/redux/custom-labware'
import { LEFT } from '/app/redux/pipettes'
import {
  useAttachedPipettes,
  useAttachedPipettesFromInstrumentsQuery,
} from '/app/resources/instruments'
import { useIsFlex } from '/app/redux-resources/robots'

import type { State } from '/app/redux/types'
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
  const attachedPipettesFromPipetteQuery = useAttachedPipettes()
  const attachedPipetteFromInstrumentQuery = useAttachedPipettesFromInstrumentsQuery()
  const isFlex = useIsFlex(robotName)
  const attachedPipettes = isFlex
    ? attachedPipetteFromInstrumentQuery
    : attachedPipettesFromPipetteQuery

  const is96Attached =
    // @ts-expect-error isFlex is a type narrower but not recognized as one
    isFlex && attachedPipettes?.[LEFT]?.instrumentName === 'p1000_96'
  return (
    <StyledTable>
      <thead>
        <tr>
          <StyledTableHeader>{t('model_and_serial')}</StyledTableHeader>
          <StyledTableHeader>{t('mount')}</StyledTableHeader>
          {/* omit tip rack column for Flex */}
          {isFlex ? null : (
            <StyledTableHeader>{t('tiprack')}</StyledTableHeader>
          )}
          <StyledTableHeader>{t('last_calibrated_label')}</StyledTableHeader>
        </tr>
      </thead>
      <tbody css={BODY_STYLE}>
        {formattedPipetteOffsetCalibrations.map(
          (calibration, index) =>
            attachedPipettes?.[calibration.mount] != null && (
              <StyledTableRow key={index}>
                <StyledTableCell>
                  <LegacyStyledText as="p">
                    {calibration.modelName}
                  </LegacyStyledText>
                  <LegacyStyledText as="p">
                    {calibration.serialNumber}
                  </LegacyStyledText>
                </StyledTableCell>
                <StyledTableCell>
                  <LegacyStyledText
                    as="p"
                    textTransform={TYPOGRAPHY.textTransformCapitalize}
                  >
                    {is96Attached ? t('both') : calibration.mount}
                  </LegacyStyledText>
                </StyledTableCell>
                {isFlex ? null : (
                  <StyledTableCell>
                    <LegacyStyledText as="p">
                      {calibration.tiprack != null &&
                        getDisplayNameForTipRack(
                          calibration.tiprack,
                          customLabwareDefs
                        )}
                    </LegacyStyledText>
                  </StyledTableCell>
                )}
                <StyledTableCell>
                  <Flex alignItems={ALIGN_CENTER}>
                    {calibration.lastCalibrated != null &&
                    !(calibration.markedBad ?? false) ? (
                      <>
                        <LegacyStyledText as="p">
                          {formatLastCalibrated(calibration.lastCalibrated)}
                        </LegacyStyledText>
                      </>
                    ) : (
                      <LegacyStyledText as="p">
                        {calibration.lastCalibrated != null &&
                        calibration.markedBad === true ? (
                          <>
                            {formatLastCalibrated(calibration.lastCalibrated)}
                          </>
                        ) : (
                          <>{t('not_calibrated_short')}</>
                        )}
                      </LegacyStyledText>
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
                    pipetteName={
                      isFlex
                        ? attachedPipetteFromInstrumentQuery[calibration.mount]
                            ?.instrumentName ?? null
                        : attachedPipettesFromPipetteQuery[calibration.mount]
                            ?.name ?? null
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
