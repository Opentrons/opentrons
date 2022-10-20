import * as React from 'react'
import styled, { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import { PrimaryButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import {
  CompletedProtocolAnalysis,
  getLabwareDefURI,
  getLabwareDisplayName,
  getModuleDisplayName,
  getModuleType,
  getVectorDifference,
  getVectorSum,
  IDENTITY_VECTOR,
  LabwareDefinition2,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { NeedHelpLink } from '../CalibrationPanels'
import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_CENTER,
  TYPOGRAPHY,
  COLORS,
  JUSTIFY_FLEX_END,
} from '@opentrons/components'
import { getCurrentOffsetForLabwareInLocation } from '../Devices/ProtocolRun/utils/getCurrentOffsetForLabwareInLocation'
import { getLabwareDefinitionsFromCommands } from './utils/labware'

import type { ResultsSummaryStep, WorkingOffset } from './types'
import type { LabwareOffset, LabwareOffsetCreateData } from '@opentrons/api-client'
import { getDisplayLocation } from './utils/getDisplayLocation'

const LPC_HELP_LINK_URL =
  'https://support.opentrons.com/s/article/How-Labware-Offsets-work-on-the-OT-2'

interface ResultsSummaryProps extends ResultsSummaryStep {
  protocolData: CompletedProtocolAnalysis
  workingOffsets: WorkingOffset[]
  existingOffsets: LabwareOffset[]
  handleApplyOffsets: (offsets: LabwareOffsetCreateData[]) => void
}
export const ResultsSummary = (
  props: ResultsSummaryProps
): JSX.Element | null => {
  const { t } = useTranslation('labware_position_check')
  const {
    protocolData,
    workingOffsets,
    handleApplyOffsets,
    existingOffsets,
  } = props
  const labwareDefinitions = getLabwareDefinitionsFromCommands(
    protocolData.commands
  )

  const offsetsToApply = React.useMemo(() => {
    return workingOffsets.map<LabwareOffsetCreateData>(
      ({ initialPosition, finalPosition, labwareId, location }) => {
        const definitionUri =
          protocolData.labware.find(l => l.id === labwareId)?.definitionUri ??
          null
        if (
          finalPosition == null ||
          initialPosition == null ||
          definitionUri == null
        ) {
          throw new Error(
            `cannot create offset for labware with id ${labwareId}, in location ${JSON.stringify(
              location
            )}, with initial position ${initialPosition}, and final position ${finalPosition}`
          )
        }

        const existingOffset =
          getCurrentOffsetForLabwareInLocation(
            existingOffsets,
            definitionUri,
            location
          )?.vector ?? IDENTITY_VECTOR
        const vector = getVectorSum(
          existingOffset,
          getVectorDifference(finalPosition, initialPosition)
        )
        return { definitionUri, location, vector }
      }
    )
  }, [workingOffsets])

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={SPACING.spacing6}
      minHeight="25rem"
    >
      <StyledText as="h1">{t('new_labware_offset_data')}</StyledText>
      <OffsetTable
        offsets={offsetsToApply}
        labwareDefinitions={labwareDefinitions}
      />
      <Flex
        width="100%"
        marginTop={SPACING.spacing6}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
      >
        <NeedHelpLink href={LPC_HELP_LINK_URL} />
        <PrimaryButton onClick={() => handleApplyOffsets(offsetsToApply)}>
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
  border-spacing: 0 ${SPACING.spacing2};
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
          <TableHeader>
            {t('labware_offset_data')}
          </TableHeader>
        </tr>
      </thead>

      <tbody>
        {offsets.map(({ location, definitionUri, vector }, index) => {
          const labwareDef = labwareDefinitions.find(
            def => getLabwareDefURI(def) === definitionUri
          )
          const labwareDisplayName =
            labwareDef != null ? getLabwareDisplayName(labwareDef) : ''
          return (
            <TableRow key={index}>
              <TableDatum>
                <StyledText as="p" textTransform={TYPOGRAPHY.textTransformCapitalize}>
                  {getDisplayLocation(location, t)}
                </StyledText>
              </TableDatum>
              <TableDatum>
                <StyledText as="p">{labwareDisplayName}</StyledText>
              </TableDatum>
              <TableDatum>
                {vector.x === 0 && vector.y === 0 && vector.z === 0 ? (
                  <StyledText>{t('no_labware_offsets')}</StyledText>
                ) : (
                  <Flex justifyContent={JUSTIFY_FLEX_END}>
                    {[vector.x, vector.y, vector.z].map((axis, index) => (
                      <React.Fragment key={index}>
                        <StyledText
                          as="p"
                          marginLeft={SPACING.spacing3}
                          marginRight={SPACING.spacing2}
                          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                        >
                          {['X', 'Y', 'Z'][index]}
                        </StyledText>
                        <StyledText as="p">{axis.toFixed(1)}</StyledText>
                      </React.Fragment>
                    ))}
                  </Flex>
                )}
              </TableDatum>
            </TableRow>
          )
        })}
      </tbody>
    </Table>
  )
}

