import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'

import {
  BORDERS,
  COLORS,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { getModuleDisplayName } from '@opentrons/shared-data'

import { formatLastCalibrated } from './utils'
import { ModuleCalibrationOverflowMenu } from './ModuleCalibrationOverflowMenu'

import type { AttachedModule } from '@opentrons/api-client'
import type { FormattedPipetteOffsetCalibration } from '..'

interface ModuleCalibrationItemsProps {
  attachedModules: AttachedModule[]
  updateRobotStatus: (isRobotBusy: boolean) => void
  formattedPipetteOffsetCalibrations: FormattedPipetteOffsetCalibration[]
  robotName: string
}

export function ModuleCalibrationItems({
  attachedModules,
  updateRobotStatus,
  formattedPipetteOffsetCalibrations,
  robotName,
}: ModuleCalibrationItemsProps): JSX.Element {
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
        {attachedModules.map(attachedModule => (
          <StyledTableRow key={attachedModule.id}>
            <StyledTableCell>
              <LegacyStyledText as="p">
                {getModuleDisplayName(attachedModule.moduleModel)}
              </LegacyStyledText>
            </StyledTableCell>
            <StyledTableCell>
              <LegacyStyledText as="p">
                {attachedModule.serialNumber}
              </LegacyStyledText>
            </StyledTableCell>
            <StyledTableCell>
              <LegacyStyledText as="p">
                {attachedModule.moduleOffset?.last_modified != null
                  ? formatLastCalibrated(
                      attachedModule.moduleOffset?.last_modified
                    )
                  : t('not_calibrated_short')}
              </LegacyStyledText>
            </StyledTableCell>
            <StyledTableCell>
              <ModuleCalibrationOverflowMenu
                isCalibrated={
                  attachedModule.moduleOffset?.last_modified != null
                }
                attachedModule={attachedModule}
                updateRobotStatus={updateRobotStatus}
                formattedPipetteOffsetCalibrations={
                  formattedPipetteOffsetCalibrations
                }
                robotName={robotName}
              />
            </StyledTableCell>
          </StyledTableRow>
        ))}
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
