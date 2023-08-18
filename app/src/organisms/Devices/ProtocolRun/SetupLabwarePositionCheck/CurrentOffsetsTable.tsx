import * as React from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import pick from 'lodash/pick'

import {
  getLabwareDisplayName,
  getLoadedLabwareDefinitionsByUri,
} from '@opentrons/shared-data'
import {
  Flex,
  DIRECTION_COLUMN,
  SPACING,
  TYPOGRAPHY,
  COLORS,
  JUSTIFY_SPACE_BETWEEN,
} from '@opentrons/components'

import { getIsLabwareOffsetCodeSnippetsOn } from '../../../../redux/config'
import { StyledText } from '../../../../atoms/text'
import { LabwareOffsetTabs } from '../../../LabwareOffsetTabs'
import { OffsetVector } from '../../../../molecules/OffsetVector'
import { PythonLabwareOffsetSnippet } from '../../../../molecules/PythonLabwareOffsetSnippet'
import { getLatestCurrentOffsets } from './utils'
import type { LabwareOffset } from '@opentrons/api-client'
import type {
  RunTimeCommand,
  LoadedLabware,
  LoadedModule,
} from '@opentrons/shared-data'
import { getDisplayLocation } from '../../../LabwarePositionCheck/utils/getDisplayLocation'
import { getLabwareDefinitionsFromCommands } from '../../../LabwarePositionCheck/utils/labware'

const OffsetTable = styled('table')`
  ${TYPOGRAPHY.labelRegular}
  table-layout: auto;
  width: 100%;
  border-spacing: 0 ${SPACING.spacing2};
  margin: ${SPACING.spacing16} 0;
  text-align: left;
`
const OffsetTableHeader = styled('th')`
  text-transform: ${TYPOGRAPHY.textTransformCapitalize};
  font-weight: ${TYPOGRAPHY.fontWeightRegular};
  padding: ${SPACING.spacing4};
`
const OffsetTableRow = styled('tr')`
  background-color: ${COLORS.fundamentalsBackground};
  padding: ${SPACING.spacing8};
`

const OffsetTableDatum = styled('td')`
  padding: ${SPACING.spacing8};
  white-space: break-spaces;
  text-overflow: wrap;
`

interface CurrentOffsetsTableProps {
  currentOffsets: LabwareOffset[]
  commands: RunTimeCommand[]
  labware: LoadedLabware[]
  modules: LoadedModule[]
}
export function CurrentOffsetsTable(
  props: CurrentOffsetsTableProps
): JSX.Element {
  const { currentOffsets, commands, labware, modules } = props
  const { t } = useTranslation(['labware_position_check', 'shared'])
  const defsByURI = getLoadedLabwareDefinitionsByUri(commands)
  const isLabwareOffsetCodeSnippetsOn = useSelector(
    getIsLabwareOffsetCodeSnippetsOn
  )
  const latestCurrentOffsets = getLatestCurrentOffsets(currentOffsets)

  const TableComponent = (
    <OffsetTable>
      <thead>
        <tr>
          <OffsetTableHeader>{t('location')}</OffsetTableHeader>
          <OffsetTableHeader>{t('labware')}</OffsetTableHeader>
          <OffsetTableHeader>{t('labware_offset_data')}</OffsetTableHeader>
        </tr>
      </thead>
      <tbody>
        {latestCurrentOffsets.map(offset => {
          const labwareDisplayName =
            offset.definitionUri in defsByURI
              ? getLabwareDisplayName(defsByURI[offset.definitionUri])
              : offset.definitionUri
          return (
            <OffsetTableRow key={offset.id}>
              <OffsetTableDatum>
                {getDisplayLocation(
                  offset.location,
                  getLabwareDefinitionsFromCommands(commands),
                  t,
                  true // capitalize Slot
                )}
              </OffsetTableDatum>
              <OffsetTableDatum>{labwareDisplayName}</OffsetTableDatum>
              <OffsetTableDatum>
                <OffsetVector {...offset.vector} />
              </OffsetTableDatum>
            </OffsetTableRow>
          )
        })}
      </tbody>
    </OffsetTable>
  )

  const JupyterSnippet = (
    <PythonLabwareOffsetSnippet
      mode="jupyter"
      labwareOffsets={latestCurrentOffsets.map(o =>
        pick(o, ['definitionUri', 'location', 'vector'])
      )}
      commands={commands ?? []}
      labware={labware ?? []}
      modules={modules ?? []}
    />
  )
  const CommandLineSnippet = (
    <PythonLabwareOffsetSnippet
      mode="cli"
      labwareOffsets={latestCurrentOffsets.map(o =>
        pick(o, ['definitionUri', 'location', 'vector'])
      )}
      commands={commands ?? []}
      labware={labware ?? []}
      modules={modules ?? []}
    />
  )
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={SPACING.spacing16}
    >
      <StyledText as="h6">{t('applied_offset_data')}</StyledText>
      {isLabwareOffsetCodeSnippetsOn ? (
        <LabwareOffsetTabs
          TableComponent={TableComponent}
          JupyterComponent={JupyterSnippet}
          CommandLineComponent={CommandLineSnippet}
        />
      ) : (
        TableComponent
      )}
    </Flex>
  )
}
