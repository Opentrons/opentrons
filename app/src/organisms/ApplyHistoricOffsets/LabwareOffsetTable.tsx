import * as React from 'react'
import isEqual from 'lodash/isEqual'
import { useTranslation } from 'react-i18next'
import { getModuleDisplayName, IDENTITY_VECTOR } from '@opentrons/shared-data'
import { useCreateLabwareOffsetMutation } from '@opentrons/react-api-client'
import {
  Flex,
  SPACING,
  TYPOGRAPHY,
  COLORS,
  JUSTIFY_FLEX_END,
} from '@opentrons/components'
import { PrimaryButton, SecondaryButton } from '../../atoms/buttons'
import { Modal } from '../../molecules/Modal'
import { StyledText } from '../../atoms/text'
import { OffsetVector } from '../../molecules/OffsetVector'
import styled from 'styled-components'
import { formatTimestamp } from '../Devices/utils'
import type { OffsetCandidate } from '../ReapplyOffsetsModal/hooks'

const OffsetTable = styled('table')`
  ${TYPOGRAPHY.labelRegular}
  table-layout: auto;
  width: 100%;
  border-spacing: 0 ${SPACING.spacing1};
  margin: ${SPACING.spacing4} 0;
  text-align: left;
`
const OffsetTableHeader = styled('th')`
  text-transform: ${TYPOGRAPHY.textTransformCapitalize};
  padding: ${SPACING.spacing2};
`
const OffsetTableRow = styled('tr')`
  background-color: ${COLORS.fundamentalsBackground};
  padding: ${SPACING.spacing3};
`

const OffsetTableDatum = styled('td')`
  padding: ${SPACING.spacing3};
  white-space: break-spaces;
  text-overflow: wrap;
`


interface LabwareOffsetTableProps {
  offsetCandidates: OffsetCandidate[]
}

export function LabwareOffsetTable(
  props: LabwareOffsetTableProps
): JSX.Element | null {
  const { offsetCandidates } = props
  const { t } = useTranslation('labware_position_check')
  return (
    <OffsetTable>
      <thead>
        <tr>
          <OffsetTableHeader>{t('location')}</OffsetTableHeader>
          <OffsetTableHeader>{t('run')}</OffsetTableHeader>
          <OffsetTableHeader>{t('labware')}</OffsetTableHeader>
          <OffsetTableHeader>{t('labware_offset_data')}</OffsetTableHeader>
        </tr>
      </thead>
      <tbody>
        {offsetCandidates.map(offset => (
          <OffsetTableRow key={offset.id}>
            <OffsetTableDatum>
              {t('slot', { slotName: offset.location.slotName })}
              {offset.location.moduleModel != null
                ? ` - ${getModuleDisplayName(offset.location.moduleModel)}`
                : null}
            </OffsetTableDatum>
            <OffsetTableDatum>
              {formatTimestamp(offset.runCreatedAt)}
            </OffsetTableDatum>
            <OffsetTableDatum>{offset.labwareDisplayName}</OffsetTableDatum>
            <OffsetTableDatum>
              <OffsetVector {...offset.vector} />
            </OffsetTableDatum>
          </OffsetTableRow>
        ))}
      </tbody>
    </OffsetTable>
  )
}