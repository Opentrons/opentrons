import * as React from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'

import { BORDERS, LEGACY_COLORS, SPACING, TYPOGRAPHY } from '@opentrons/components'
import { getModuleDisplayName } from '@opentrons/shared-data/js/modules'

import { StyledText } from '../../../atoms/text'
import { formatLastCalibrated } from './utils'
import { ModuleCalibrationOverflowMenu } from './ModuleCalibrationOverflowMenu'

import type { AttachedModule } from '@opentrons/api-client'
import type { FormattedPipetteOffsetCalibration } from '..'

interface ModuleCalibrationItemsProps {
  attachedModules: AttachedModule[]
  updateRobotStatus: (isRobotBusy: boolean) => void
  formattedPipetteOffsetCalibrations: FormattedPipetteOffsetCalibration[]
}

export function ModuleCalibrationItems({
  attachedModules,
  updateRobotStatus,
  formattedPipetteOffsetCalibrations,
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
              <StyledText as="p">
                {getModuleDisplayName(attachedModule.moduleModel)}
              </StyledText>
            </StyledTableCell>
            <StyledTableCell>
              <StyledText as="p">{attachedModule.serialNumber}</StyledText>
            </StyledTableCell>
            <StyledTableCell>
              <StyledText as="p">
                {attachedModule.moduleOffset?.last_modified != null
                  ? formatLastCalibrated(
                      attachedModule.moduleOffset?.last_modified
                    )
                  : t('not_calibrated_short')}
              </StyledText>
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
