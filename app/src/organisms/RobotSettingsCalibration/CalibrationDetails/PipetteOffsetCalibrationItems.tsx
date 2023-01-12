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

import { StyledText } from '../../../atoms/text'
import { OverflowMenu } from './OverflowMenu'
import { formatLastCalibrated, getDisplayNameForTipRack } from './utils'
import { getCustomLabwareDefinitions } from '../../../redux/custom-labware'
import { useAttachedPipettes, useIsOT3 } from '../../../organisms/Devices/hooks'

import * as Config from '../../../redux/config'
import type { State } from '../../../redux/types'
import type { FormattedPipetteOffsetCalibration } from '..'

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
  box-shadow: 0 0 0 1px ${COLORS.medGreyEnabled};
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
  const isOT3 = useIsOT3(robotName)

  const enableCalibrationWizards = Config.useFeatureFlag(
    'enableCalibrationWizards'
  )

  return (
    <StyledTable>
      <thead>
        <tr>
          <StyledTableHeader>{t('model_and_serial')}</StyledTableHeader>
          <StyledTableHeader>{t('mount')}</StyledTableHeader>
          {/* omit tip rack column for OT-3 */}
          {isOT3 ? null : <StyledTableHeader>{t('tiprack')}</StyledTableHeader>}
          <StyledTableHeader>{t('last_calibrated_label')}</StyledTableHeader>
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
                {isOT3 ? null : (
                  <StyledTableCell>
                    <StyledText as="p">
                      {calibration.tiprack != null &&
                        getDisplayNameForTipRack(
                          calibration.tiprack,
                          customLabwareDefs
                        )}
                    </StyledText>
                  </StyledTableCell>
                )}
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
                        {enableCalibrationWizards ? (
                          <StyledText as="p">
                            {t('not_calibrated_short')}
                          </StyledText>
                        ) : (
                          <>
                            {calibration.markedBad ?? false ? (
                              <>
                                <Icon
                                  name="alert-circle"
                                  backgroundColor={
                                    COLORS.warningBackgroundLight
                                  }
                                  color={COLORS.warningEnabled}
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
                                  backgroundColor={COLORS.errorBackgroundLight}
                                  color={COLORS.errorEnabled}
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
                    pipetteName={
                      attachedPipettes[calibration.mount]?.name ?? null
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
