import * as React from 'react'
import styled, { css } from 'styled-components'
import { useSelector } from 'react-redux'
import isEqual from 'lodash/isEqual'
import { useTranslation } from 'react-i18next'
import {
  getLabwareDefURI,
  getLabwareDisplayName,
  getModuleType,
  getVectorDifference,
  getVectorSum,
  IDENTITY_VECTOR,
} from '@opentrons/shared-data'
import { NeedHelpLink } from '../CalibrationPanels'
import {
  ALIGN_CENTER,
  ALIGN_FLEX_END,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  LocationIcon,
  MODULE_ICON_NAME_BY_TYPE,
  OVERFLOW_AUTO,
  PrimaryButton,
  RESPONSIVENESS,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { PythonLabwareOffsetSnippet } from '../../molecules/PythonLabwareOffsetSnippet'
import {
  getIsLabwareOffsetCodeSnippetsOn,
  getIsOnDevice,
} from '../../redux/config'
import { SmallButton } from '../../atoms/buttons'
import { LabwareOffsetTabs } from '../LabwareOffsetTabs'
import { getCurrentOffsetForLabwareInLocation } from '../Devices/ProtocolRun/utils/getCurrentOffsetForLabwareInLocation'
import { getLabwareDefinitionsFromCommands } from '../../molecules/Command/utils/getLabwareDefinitionsFromCommands'
import { getDisplayLocation } from './utils/getDisplayLocation'

import type {
  CompletedProtocolAnalysis,
  LabwareDefinition2,
} from '@opentrons/shared-data'
import type {
  LabwareOffset,
  LabwareOffsetCreateData,
} from '@opentrons/api-client'
import type { ResultsSummaryStep, WorkingOffset } from './types'

const LPC_HELP_LINK_URL =
  'https://support.opentrons.com/s/article/How-Labware-Offsets-work-on-the-OT-2'

interface ResultsSummaryProps extends ResultsSummaryStep {
  protocolData: CompletedProtocolAnalysis
  workingOffsets: WorkingOffset[]
  existingOffsets: LabwareOffset[]
  handleApplyOffsets: (offsets: LabwareOffsetCreateData[]) => void
  isApplyingOffsets: boolean
  isDeletingMaintenanceRun: boolean
}
export const ResultsSummary = (
  props: ResultsSummaryProps
): JSX.Element | null => {
  const { i18n, t } = useTranslation('labware_position_check')
  const {
    protocolData,
    workingOffsets,
    handleApplyOffsets,
    existingOffsets,
    isApplyingOffsets,
    isDeletingMaintenanceRun,
  } = props
  const labwareDefinitions = getLabwareDefinitionsFromCommands(
    protocolData.commands
  )
  const isSubmittingAndClosing = isApplyingOffsets || isDeletingMaintenanceRun
  const isLabwareOffsetCodeSnippetsOn = useSelector(
    getIsLabwareOffsetCodeSnippetsOn
  )
  const isOnDevice = useSelector(getIsOnDevice)

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

  const TableComponent = isOnDevice ? (
    <TerseOffsetTable
      offsets={offsetsToApply}
      labwareDefinitions={labwareDefinitions}
    />
  ) : (
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
      minHeight="29.5rem"
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        maxHeight="20rem"
        css={css`
          overflow-y: ${OVERFLOW_AUTO};
          &::-webkit-scrollbar {
            width: 0.75rem;
            background-color: transparent;
          }
          &::-webkit-scrollbar-thumb {
            background: ${COLORS.grey50};
            border-radius: 11px;
          }
        `}
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
          TableComponent
        )}
      </Flex>
      {isOnDevice ? (
        <SmallButton
          alignSelf={ALIGN_FLEX_END}
          onClick={() => {
            handleApplyOffsets(offsetsToApply)
          }}
          buttonText={i18n.format(t('apply_offsets'), 'capitalize')}
          iconName={isSubmittingAndClosing ? 'ot-spinner' : null}
          iconPlacement={isSubmittingAndClosing ? 'startIcon' : null}
          disabled={isSubmittingAndClosing}
        />
      ) : (
        <Flex
          width="100%"
          marginTop={SPACING.spacing32}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          alignItems={ALIGN_CENTER}
        >
          <NeedHelpLink href={LPC_HELP_LINK_URL} />
          <PrimaryButton
            onClick={() => {
              handleApplyOffsets(offsetsToApply)
            }}
            disabled={isSubmittingAndClosing}
          >
            <Flex>
              {isSubmittingAndClosing ? (
                <Icon
                  size="1rem"
                  spin
                  name="ot-spinner"
                  marginRight={SPACING.spacing8}
                />
              ) : null}
              <StyledText>
                {i18n.format(t('apply_offsets'), 'capitalize')}
              </StyledText>
            </Flex>
          </PrimaryButton>
        </Flex>
      )}
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
  color: ${COLORS.black90};
  font-weight: ${TYPOGRAPHY.fontWeightRegular};
  font-size: ${TYPOGRAPHY.fontSizeCaption};
  padding: ${SPACING.spacing4};
`
const TableRow = styled('tr')`
  background-color: ${COLORS.grey20};
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
  const { t, i18n } = useTranslation('labware_position_check')
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
              <TableDatum
                css={`
                  border-radius: ${BORDERS.borderRadius4} 0 0
                    ${BORDERS.borderRadius4};
                `}
              >
                <StyledText
                  as="p"
                  textTransform={TYPOGRAPHY.textTransformCapitalize}
                >
                  {getDisplayLocation(location, labwareDefinitions, t, i18n)}
                </StyledText>
              </TableDatum>
              <TableDatum>
                <StyledText as="p">{labwareDisplayName}</StyledText>
              </TableDatum>
              <TableDatum
                css={`
                  border-radius: 0 ${BORDERS.borderRadius4}
                    ${BORDERS.borderRadius4} 0;
                `}
              >
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

// Very similar to the OffsetTable, but abbreviates certain things to be optimized
// for smaller screens
export const TerseOffsetTable = (props: OffsetTableProps): JSX.Element => {
  const { offsets, labwareDefinitions } = props
  const { i18n, t } = useTranslation('labware_position_check')
  return (
    <TerseTable>
      <thead>
        <tr>
          <TerseHeader>
            {i18n.format(t('slot_location'), 'capitalize')}
          </TerseHeader>
          <TerseHeader>{i18n.format(t('labware'), 'capitalize')}</TerseHeader>
          <TerseHeader>{i18n.format(t('offsets'), 'capitalize')}</TerseHeader>
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
            <TerseTableRow key={index}>
              <TerseTableDatum>
                <LocationIcon slotName={location.slotName} />
                {location.moduleModel != null ? (
                  <LocationIcon
                    iconName={
                      MODULE_ICON_NAME_BY_TYPE[
                        getModuleType(location.moduleModel)
                      ]
                    }
                  />
                ) : null}
              </TerseTableDatum>
              <TerseTableDatum>
                <StyledText
                  fontSize={TYPOGRAPHY.fontSize20}
                  lineHeight={TYPOGRAPHY.lineHeight24}
                >
                  {labwareDisplayName}
                </StyledText>
              </TerseTableDatum>
              <TerseTableDatum>
                {isEqual(vector, IDENTITY_VECTOR) ? (
                  <StyledText>{t('no_labware_offsets')}</StyledText>
                ) : (
                  <Flex>
                    {[vector.x, vector.y, vector.z].map((axis, index) => (
                      <React.Fragment key={index}>
                        <StyledText
                          fontSize={TYPOGRAPHY.fontSize20}
                          lineHeight={TYPOGRAPHY.lineHeight24}
                          marginLeft={index > 0 ? SPACING.spacing8 : 0}
                          marginRight={SPACING.spacing4}
                          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                        >
                          {['X', 'Y', 'Z'][index]}
                        </StyledText>
                        <StyledText
                          fontSize={TYPOGRAPHY.fontSize20}
                          lineHeight={TYPOGRAPHY.lineHeight24}
                        >
                          {axis.toFixed(1)}
                        </StyledText>
                      </React.Fragment>
                    ))}
                  </Flex>
                )}
              </TerseTableDatum>
            </TerseTableRow>
          )
        })}
      </tbody>
    </TerseTable>
  )
}

const TerseTable = styled('table')`
  table-layout: auto;
  width: 100%;
  border-spacing: 0 ${SPACING.spacing4};
  margin: ${SPACING.spacing16} 0;
  text-align: left;
  tr td:first-child {
    border-top-left-radius: ${BORDERS.borderRadius8};
    border-bottom-left-radius: ${BORDERS.borderRadius8};
    padding-left: ${SPACING.spacing12};
  }
  tr td:last-child {
    border-top-right-radius: ${BORDERS.borderRadius8};
    border-bottom-right-radius: ${BORDERS.borderRadius8};
    padding-right: ${SPACING.spacing12};
  }
`
const TerseHeader = styled('th')`
  font-size: ${TYPOGRAPHY.fontSize20};
  line-height: ${TYPOGRAPHY.lineHeight24};
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
`
const TerseTableRow = styled('tr')`
  background-color: ${COLORS.grey35};
`

const TerseTableDatum = styled('td')`
  padding: ${SPACING.spacing12} 0;
  white-space: break-spaces;
  text-overflow: wrap;
`
