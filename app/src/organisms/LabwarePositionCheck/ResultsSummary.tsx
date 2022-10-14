import * as React from 'react'
import styled, { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import { PrimaryButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import { CompletedProtocolAnalysis, getLabwareDefURI, getLabwareDisplayName, getModuleDisplayName, getModuleType, getVectorDifference, LabwareDefinition2, THERMOCYCLER_MODULE_TYPE } from '@opentrons/shared-data'
import { NeedHelpLink } from '../CalibrationPanels'
import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_CENTER,
  TYPOGRAPHY,
  COLORS,
  ALIGN_FLEX_END,
  JUSTIFY_FLEX_END,
} from '@opentrons/components'
import { OffsetVector } from '../../molecules/OffsetVector'

import type { ResultsSummaryStep, WorkingOffset } from './types'
import type { LabwareOffsetCreateData, LabwareOffsetLocation } from '@opentrons/api-client'
import { getLabwareDefinitionsFromCommands } from './utils/labware'
import { useCreateLabwareOffsetMutation } from '@opentrons/react-api-client'

const LPC_HELP_LINK_URL =
  'https://support.opentrons.com/s/article/How-Labware-Offsets-work-on-the-OT-2'

interface ResultsSummaryProps extends ResultsSummaryStep {
  protocolData: CompletedProtocolAnalysis
  workingOffsets: WorkingOffset[]
  handleApplyOffsets: (offsets: LabwareOffsetCreateData[]) => void
}
export const ResultsSummary = (props: ResultsSummaryProps): JSX.Element | null => {
  const { t } = useTranslation('labware_position_check')
  const { protocolData, workingOffsets, handleApplyOffsets } = props
  const labwareDefinitions = getLabwareDefinitionsFromCommands(protocolData.commands)

  const offsetsToApply = React.useMemo(() => {
    if (protocolData == null) return []
    return workingOffsets.map<LabwareOffsetCreateData>(({ initialPosition, finalPosition, labwareId, location }) => {
      const { definitionUri } = protocolData.labware.find(l => l.id === labwareId) ?? {}
      if (finalPosition == null || initialPosition == null || definitionUri == null) {
        throw new Error(`cannot create offset for labware with id ${labwareId}, in location ${JSON.stringify(location)}, with initial position ${initialPosition}, and final position ${finalPosition}`)
      }
      const vector = getVectorDifference(finalPosition, initialPosition)
      return { definitionUri, location, vector }
    })
  }, [workingOffsets])

  

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={SPACING.spacing6}
      minHeight="25rem"
    >
      <StyledText as="h1">{t('new_labware_offset_data')}</StyledText>
      <OffsetTable offsets={offsetsToApply} labwareDefinitions={labwareDefinitions} />
      <Flex
        width="100%"
        marginTop={SPACING.spacing6}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
      >
        <NeedHelpLink href={LPC_HELP_LINK_URL} />
        <PrimaryButton onClick={handleApplyOffsets}>
          {t('apply_offsets')}
        </PrimaryButton>
      </Flex>
    </Flex>
  )
}

const Table = styled('table')`
  ${TYPOGRAPHY.labelRegular}
  table-layout: auto;
  width: 100%;
  border-spacing: 0 ${SPACING.spacing1};
  margin: ${SPACING.spacing4} 0;
  text-align: left;
`
const TableHeader = styled('th')`
  text-transform: ${TYPOGRAPHY.textTransformUppercase};
  color: ${COLORS.darkBlackEnabled};
  font-weight: ${TYPOGRAPHY.fontWeightRegular};
  font-size: ${TYPOGRAPHY.fontSizeCaption};
  padding: ${SPACING.spacing2};
`
const TableRow = styled('tr')`
  background-color: ${COLORS.fundamentalsBackground};
`

const TableDatum = styled('td')`
  padding: ${SPACING.spacing2};
  white-space: break-spaces;
  text-overflow: wrap;
`

interface OffsetTableProps {
  offsets: LabwareOffsetCreateData[]
  labwareDefinitions: LabwareDefinition2[]
}

const OffsetTable = (props: OffsetTableProps): JSX.Element => {
  const { offsets, labwareDefinitions } = props
  const { t } = useTranslation('labware_position_check')
  return (
    <Table>
      <thead>
        <tr>
          <TableHeader>{t('location')}</TableHeader>
          <TableHeader>{t('labware')}</TableHeader>
          <TableHeader css={css`text-align: right;`}>{t('labware_offset_data')}</TableHeader>
        </tr>
      </thead>

      <tbody>
        {offsets.map(
          ({ location, definitionUri, vector }, index) => {

            const labwareDef = labwareDefinitions.find(
              def => getLabwareDefURI(def) === definitionUri
            )
            const labwareDisplayName = labwareDef != null ? getLabwareDisplayName(labwareDef) : ''
            return (
              <TableRow key={index}>
                <TableDatum>
                  <DisplayLocation location={location} />
                </TableDatum>
                <TableDatum>{labwareDisplayName}</TableDatum>
                <TableDatum css={css`text-align: right;`}>
                  {vector.x === 0 && vector.y === 0 && vector.z === 0 ? (
                    <StyledText>{t('no_labware_offsets')}</StyledText>
                  ) : (
                    <OffsetVector {...vector} justifyContent={JUSTIFY_FLEX_END}/>
                  )}
                </TableDatum>
              </TableRow>
            )
          }
        )}
      </tbody>
    </Table>
  )
}

const DisplayLocation = ({ location }: { location: LabwareOffsetLocation }): JSX.Element => {
  const { t } = useTranslation('labware_position_check')
  const { slotName, moduleModel } = location

  let displayLocation = t('slot_name', { slotName })
  if (moduleModel != null) {
    if (
      getModuleType(moduleModel) === THERMOCYCLER_MODULE_TYPE
    ) {
      displayLocation = getModuleDisplayName(moduleModel)
    } else {
      displayLocation = `${t('slot_name', { slotName })}, ${getModuleDisplayName(moduleModel)}`
    }
  }
  return <StyledText as="p" textTransform={TYPOGRAPHY.textTransformCapitalize}>{displayLocation}</StyledText>
}


