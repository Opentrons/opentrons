import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { css } from 'styled-components'

import {
  Box,
  Link,
  Icon,
  Flex,
  SPACING,
  COLORS,
  TYPOGRAPHY,
  BORDERS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_CENTER,
  SIZE_1,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { Slideout } from '../../atoms/Slideout'
import { getWellLabel } from './helpers/labels'
import { getUniqueWellProperties } from './helpers/labwareInference'
import { WellCount } from './WellCount'
import { WellProperties } from './WellProperties'
import { Dimensions } from './Dimensions'
import { WellDimensions } from './WellDimensions'
import { WellSpacing } from './WellSpacing'
import { ManufacturerDetails } from './ManufacturerDetails'
import { InsertDetails } from './InsertDetails'
import { Gallery } from './Gallery'
import { CustomLabwareOverflowMenu } from '../LabwareCard/CustomLabwareOverflowMenu'
import type { LabwareDefAndDate } from '../../pages/Labware/hooks'

const CLOSE_ICON_STYLE = css`
  border-radius: 50%;

  &:hover {
    background: #16212d26;
  }
  &:active {
    background: #16212d40;
  }
`
export interface LabwareDetailsProps {
  onClose: () => void
  labware: LabwareDefAndDate
}

export function LabwareDetails(props: LabwareDetailsProps): JSX.Element {
  const { t } = useTranslation('labware_landing')
  const { definition, modified, filename } = props.labware
  const { metadata, parameters, brand, wells, ordering } = definition
  const apiName = definition.parameters.loadName
  const { displayVolumeUnits } = metadata
  const wellGroups = getUniqueWellProperties(definition)
  const wellLabel = getWellLabel(definition)
  const hasInserts = wellGroups.some(g => g.metadata.displayCategory)
  const insert = wellGroups.find(g => g.metadata.displayCategory)
  const insertCategory = insert?.metadata.displayCategory
  const irregular = wellGroups.length > 1
  const isMultiRow = ordering.some(row => row.length > 1)
  const isCustomDefinition = definition.namespace !== 'opentrons'

  const slideoutHeader = (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing2}
      paddingX={SPACING.spacing4}
      marginBottom={SPACING.spacing4}
    >
      <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <StyledText css={TYPOGRAPHY.h2SemiBold}>
          {props.labware.definition.metadata.displayName}
        </StyledText>
        <Link onClick={props.onClose} role="button">
          <Icon name="close" height={SPACING.spacing5} css={CLOSE_ICON_STYLE} />
        </Link>
      </Flex>
      {!isCustomDefinition && (
        <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
          <Icon color={COLORS.blue} name="check-decagram" height=".7rem" />{' '}
          <StyledText
            as="label"
            id="LabwareDetails_opentronsDef"
            marginLeft={SPACING.spacing2}
          >
            {t('opentrons_def')}
          </StyledText>
        </Flex>
      )}
      {modified != null && filename != null && (
        <Flex
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          paddingRight={SPACING.spacing1}
          alignItems={ALIGN_CENTER}
        >
          <StyledText
            as="label"
            color={COLORS.darkGreyEnabled}
            id="LabwareDetails_dateAdded"
          >
            {t('last_updated')} {format(new Date(modified), 'MM/dd/yyyy')}
          </StyledText>
          <CustomLabwareOverflowMenu
            filename={filename}
            onDelete={props.onClose}
          />
        </Flex>
      )}
    </Flex>
  )

  return (
    <Slideout onCloseClick={props.onClose} title={slideoutHeader} isExpanded>
      <Gallery definition={definition} />
      <Box
        backgroundColor={COLORS.lightGrey}
        padding={SPACING.spacing4}
        marginBottom={SPACING.spacing5}
        css={{ 'overflow-wrap': 'break-word' }}
      >
        <StyledText as="h6">{t('api_name')}</StyledText>
        <Link
          css={TYPOGRAPHY.pRegular}
          onClick={() => navigator.clipboard.writeText(apiName)}
          role="button"
        >
          <Flex alignItems={ALIGN_CENTER} css={{ 'overflow-wrap': 'anywhere' }}>
            {apiName} <Icon height={SIZE_1} name="copy-text" />
          </Flex>
        </Link>
      </Box>
      <Box border={BORDERS.lineBorder}>
        <Box padding={SPACING.spacing4}>
          <WellCount
            wellLabel={getWellLabel(definition)}
            count={Object.keys(wells).length}
          />
          {!hasInserts && !irregular && (
            <WellProperties
              wellProperties={wellGroups[0]}
              wellLabel={wellLabel}
              displayVolumeUnits={displayVolumeUnits}
            />
          )}
          <Dimensions
            definition={definition}
            irregular={irregular}
            insertCategory={insertCategory}
          />
          {wellGroups.map((wellProps, index) => {
            const { metadata: groupMetadata } = wellProps
            const wellLabel = getWellLabel(wellProps, definition)
            const groupDisplaySuffix =
              groupMetadata.displayName != null
                ? ` - ${groupMetadata.displayName}`
                : ''

            return (
              <React.Fragment key={index}>
                {groupMetadata.displayCategory == null && irregular && (
                  <>
                    <WellCount
                      count={wellProps.wellCount}
                      wellLabel={wellLabel}
                    />
                    <WellProperties
                      wellProperties={wellProps}
                      wellLabel={wellLabel}
                      displayVolumeUnits={displayVolumeUnits}
                    />
                  </>
                )}
                {groupMetadata.displayCategory == null && (
                  <WellDimensions
                    labwareParams={parameters}
                    category={definition.metadata.displayCategory}
                    wellProperties={wellProps}
                    wellLabel={wellLabel}
                    labelSuffix={groupDisplaySuffix}
                  />
                )}
                <WellSpacing
                  category={definition.metadata.displayCategory}
                  wellProperties={wellProps}
                  isMultiRow={isMultiRow}
                  labelSuffix={groupDisplaySuffix}
                />
              </React.Fragment>
            )
          })}
        </Box>
        <ManufacturerDetails brand={brand} />
      </Box>
      {hasInserts && <InsertDetails definition={definition} />}
    </Slideout>
  )
}
