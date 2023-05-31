import * as React from 'react'
import styled, { css } from 'styled-components'
import { useSelector } from 'react-redux'
import isEqual from 'lodash/isEqual'
import { useTranslation } from 'react-i18next'
import { StyledText } from '../../atoms/text'
import {
  CompletedProtocolAnalysis,
  getLabwareDefURI,
  getLabwareDisplayName,
  getVectorDifference,
  getVectorSum,
  IDENTITY_VECTOR,
  LabwareDefinition2,
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
  PrimaryButton,
  RESPONSIVENESS,
} from '@opentrons/components'
import { getCurrentOffsetForLabwareInLocation } from '../Devices/ProtocolRun/utils/getCurrentOffsetForLabwareInLocation'
import { getLabwareDefinitionsFromCommands } from './utils/labware'
import { PythonLabwareOffsetSnippet } from '../../molecules/PythonLabwareOffsetSnippet'
import { getIsLabwareOffsetCodeSnippetsOn } from '../../redux/config'

import type { ResultsSummaryStep, WorkingOffset } from './types'
import type {
  LabwareOffset,
  LabwareOffsetCreateData,
} from '@opentrons/api-client'
import { getDisplayLocation } from './utils/getDisplayLocation'
import { LabwareOffsetTabs } from '../LabwareOffsetTabs'

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
  const isLabwareOffsetCodeSnippetsOn = useSelector(
    getIsLabwareOffsetCodeSnippetsOn
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
            )}, with initial position ${String(
              initialPosition
            )}, and final position ${String(finalPosition)}`
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

  const TableComponent = (
    <OffsetTable
      offsets={offsetsToApply}
      labwareDefinitions={labwareDefinitions}
    />
  )
  const JupyterSnippet = (
    <PythonLabwareOffsetSnippet
      mode="jupyter"
      labwareOffsets={offsetsToApply}
      commands={protocolData?.commands ?? []}
      labware={protocolData?.labware ?? []}
      modules={protocolData?.modules ?? []}
    />
  )
  const CommandLineSnippet = (
    <PythonLabwareOffsetSnippet
      mode="cli"
      labwareOffsets={offsetsToApply}
      commands={protocolData?.commands ?? []}
      labware={protocolData?.labware ?? []}
      modules={protocolData?.modules ?? []}
    />
  )

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={SPACING.spacing32}
      minHeight="25rem"
    >
      <Header>{t('new_labware_offset_data')}</Header>
      {isLabwareOffsetCodeSnippetsOn ? (
        <LabwareOffsetTabs
          TableComponent={TableComponent}
          JupyterComponent={JupyterSnippet}
          CommandLineComponent={CommandLineSnippet}
          marginTop={SPACING.spacing16}
        />
      ) : (
        <OffsetTable
          offsets={offsetsToApply}
          labwareDefinitions={labwareDefinitions}
        />
      )}
      <Flex
        width="100%"
        marginTop={SPACING.spacing32}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
        css={css`
          @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
            margin-top: 0;
          }
        `}
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
  border-spacing: 0 ${SPACING.spacing4};
  margin: ${SPACING.spacing16} 0;
  text-align: left;
`
const TableHeader = styled('th')`
  text-transform: ${TYPOGRAPHY.textTransformUppercase};
  color: ${COLORS.darkBlackEnabled};
  font-weight: ${TYPOGRAPHY.fontWeightRegular};
  font-size: ${TYPOGRAPHY.fontSizeCaption};
  padding: ${SPACING.spacing4};
`
const TableRow = styled('tr')`
  background-color: ${COLORS.fundamentalsBackground};
`

const TableDatum = styled('td')`
  padding: ${SPACING.spacing4};
  white-space: break-spaces;
  text-overflow: wrap;
`

const Header = styled.h1`
  ${TYPOGRAPHY.h1Default}

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    ${TYPOGRAPHY.level4HeaderSemiBold}
  }
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
          <TableHeader>{t('labware_offset_data')}</TableHeader>
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
                <StyledText
                  as="p"
                  textTransform={TYPOGRAPHY.textTransformCapitalize}
                >
                  {getDisplayLocation(location, t)}
                </StyledText>
              </TableDatum>
              <TableDatum>
                <StyledText as="p">{labwareDisplayName}</StyledText>
              </TableDatum>
              <TableDatum>
                {isEqual(vector, IDENTITY_VECTOR) ? (
                  <StyledText>{t('no_labware_offsets')}</StyledText>
                ) : (
                  <Flex>
                    {[vector.x, vector.y, vector.z].map((axis, index) => (
                      <React.Fragment key={index}>
                        <StyledText
                          as="p"
                          marginLeft={index > 0 ? SPACING.spacing8 : 0}
                          marginRight={SPACING.spacing4}
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
