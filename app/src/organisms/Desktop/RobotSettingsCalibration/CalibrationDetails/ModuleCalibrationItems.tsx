import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'

import {
  BORDERS,
  COLORS,
  LegacyStyledText,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  ABSORBANCE_READER_TYPE,
  getModuleDisplayName,
} from '@opentrons/shared-data'

import { ModuleCalibrationOverflowMenu } from './ModuleCalibrationOverflowMenu'
import { formatLastCalibrated } from './utils'

import type { ReactNode } from 'react'
import type { AttachedModule } from '@opentrons/api-client'
import type { FormattedPipetteOffsetCalibration } from '..'

interface ModuleCalibrationItemsProps {
  attachedModules: AttachedModule[]
  formattedPipetteOffsetCalibrations: FormattedPipetteOffsetCalibration[]
  robotName: string
  isRobotBusy: boolean
}

export function ModuleCalibrationItems({
  attachedModules,
  formattedPipetteOffsetCalibrations,
  robotName,
  isRobotBusy,
}: ModuleCalibrationItemsProps): ReactNode {
  const { t } = useTranslation('device_settings')

  return (
    <StyledTable>
      <thead>
        <tr>
          <StyledTableHeader>{t('module')}</StyledTableHeader>
          <StyledTableHeader>{t('serial')}</StyledTableHeader>
          <StyledTableHeader>{t('last_calibrated_label')}</StyledTableHeader>
        </tr>
      </thead>
      <tbody css={BODY_STYLE}>
        {attachedModules.map(attachedModule => {
          const noCalibrationCopy =
            attachedModule.moduleType === ABSORBANCE_READER_TYPE
              ? t('no_calibration_required')
              : t('not_calibrated_short')

          return (
            <StyledTableRow key={attachedModule.id}>
              <StyledTableCell>
                <LegacyStyledText forwardedAs="p">
                  {getModuleDisplayName(attachedModule.moduleModel)}
                </LegacyStyledText>
              </StyledTableCell>
              <StyledTableCell>
                <LegacyStyledText forwardedAs="p">
                  {attachedModule.serialNumber}
                </LegacyStyledText>
              </StyledTableCell>
              <StyledTableCell>
                <LegacyStyledText forwardedAs="p">
                  {attachedModule.moduleOffset?.last_modified != null
                    ? formatLastCalibrated(
                        attachedModule.moduleOffset?.last_modified
                      )
                    : noCalibrationCopy}
                </LegacyStyledText>
              </StyledTableCell>
              <StyledTableCell>
                {attachedModule.moduleType !== ABSORBANCE_READER_TYPE ? (
                  <ModuleCalibrationOverflowMenu
                    isCalibrated={
                      attachedModule.moduleOffset?.last_modified != null
                    }
                    attachedModule={attachedModule}
                    formattedPipetteOffsetCalibrations={
                      formattedPipetteOffsetCalibrations
                    }
                    robotName={robotName}
                    isRobotBusy={isRobotBusy}
                  />
                ) : null}
              </StyledTableCell>
            </StyledTableRow>
          )
        })}
      </tbody>
    </StyledTable>
  )
}

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
