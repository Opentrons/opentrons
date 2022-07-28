import * as React from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import {
  ALIGN_CENTER,
  C_DARK_GRAY,
  C_MED_GRAY,
  C_NEAR_WHITE,
  DIRECTION_COLUMN,
  Flex,
  FONT_SIZE_BODY_2,
  FONT_WEIGHT_SEMIBOLD,
  Icon,
  JUSTIFY_CENTER,
  SPACING,
  TYPOGRAPHY,
  COLORS,
  Text,
  SIZE_3,
} from '@opentrons/components'
import { OffsetVector } from '../../molecules/OffsetVector'
import { StyledText } from '../../atoms/text'
import type { LabwareOffsets } from './hooks/useLabwareOffsets'

const OffsetTable = styled('table')`
  ${TYPOGRAPHY.labelRegular}
  table-layout: auto;
  width: 100%;
  border-spacing: 0 ${SPACING.spacing1};
  margin: ${SPACING.spacing4} 0;
  text-align: left;
`
const OffsetTableHeader = styled('th')`
  text-transform: ${TYPOGRAPHY.textTransformUppercase};
  color: ${COLORS.disabled};
  font-weight: ${TYPOGRAPHY.fontWeightRegular};
  font-size: ${TYPOGRAPHY.fontSizeCaption};
  padding: ${SPACING.spacing2};
`
const OffsetTableRow = styled('tr')`
  background-color: ${COLORS.background};
`

const OffsetTableDatum = styled('td')`
  padding: ${SPACING.spacing2};
  white-space: break-spaces;
  text-overflow: wrap;
`
interface LabwareOffsetSummary {
  offsetData: LabwareOffsets
}

const OffsetDataLoader = (): JSX.Element | null => {
  const { t } = useTranslation('protocol_setup')
  return (
    <Flex
      justifyContent={JUSTIFY_CENTER}
      flexDirection={DIRECTION_COLUMN}
      alignItems={ALIGN_CENTER}
    >
      <Text
        as="h3"
        color={C_DARK_GRAY}
        marginTop={SPACING.spacing6}
        fontWeight={FONT_WEIGHT_SEMIBOLD}
        fontSize={FONT_SIZE_BODY_2}
        textTransform={TYPOGRAPHY.textTransformUppercase}
      >
        {t('loading_labware_offsets')}
      </Text>
      <Icon
        name="ot-spinner"
        id={`LabwareOffsetsSummary_loadingSpinner`}
        width={SIZE_3}
        marginTop={SPACING.spacing6}
        marginBottom={SPACING.spacing6}
        color={C_MED_GRAY}
        spin
      />
    </Flex>
  )
}

const SummaryData = (props: LabwareOffsetSummary): JSX.Element => {
  const { offsetData } = props
  const { t } = useTranslation('labware_position_check')
  return (
    <OffsetTable>
      <thead>
        <tr>
          <OffsetTableHeader>
            {t('labware_offsets_summary_location')}
          </OffsetTableHeader>
          <OffsetTableHeader>
            {t('labware_offsets_summary_labware')}
          </OffsetTableHeader>
          <OffsetTableHeader>
            {t('labware_offsets_summary_offset')}
          </OffsetTableHeader>
        </tr>
      </thead>

      <tbody>
        {offsetData.map(
          ({ displayLocation, displayName, labwareId, vector }) => (
            <OffsetTableRow key={labwareId}>
              <OffsetTableDatum>{displayLocation}</OffsetTableDatum>
              <OffsetTableDatum>{displayName}</OffsetTableDatum>
              <OffsetTableDatum>
                {vector.x === 0 && vector.y === 0 && vector.z === 0 ? (
                  <StyledText>{t('no_labware_offsets')}</StyledText>
                ) : (
                  <OffsetVector {...vector} />
                )}
              </OffsetTableDatum>
            </OffsetTableRow>
          )
        )}
      </tbody>
    </OffsetTable>
  )
}

export const LabwareOffsetsSummary = (
  props: LabwareOffsetSummary
): JSX.Element | null => {
  const { offsetData } = props
  const { t } = useTranslation('labware_position_check')
  return (
    <Flex
      flex="auto"
      padding={SPACING.spacing4}
      boxShadow="1px 1px 1px rgba(0, 0, 0, 0.25)"
      borderRadius="4px"
      backgroundColor={C_NEAR_WHITE}
      flexDirection={DIRECTION_COLUMN}
    >
      <StyledText as="h5" marginBottom={SPACING.spacing3}>
        {t('labware_offsets_summary_title')}
      </StyledText>
      {offsetData.length === 0 ? (
        <OffsetDataLoader />
      ) : (
        <SummaryData offsetData={offsetData} />
      )}
    </Flex>
  )
}
