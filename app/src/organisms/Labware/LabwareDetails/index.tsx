import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Link,
  SPACING,
  COLORS,
  TYPOGRAPHY,
  Icon,
  BORDERS,
} from '@opentrons/components'
import { StyledText } from '../../../atoms/text'
import { Slideout } from '../../../atoms/Slideout'
import { getWellLabel } from '../helpers/labels'
import { getUniqueWellProperties } from '../helpers/labwareInference'
import { WellCount } from './WellCount'
import { WellProperties } from './WellProperties'
import { Dimensions } from './Dimensions'
import { WellDimensions } from './WellDimensions'
import { WellSpacing } from './WellSpacing'
import { ManufacturerDetails } from './ManufacturerDetails'
import { InsertDetails } from './InsertDetails'
import type { LabwareDefAndDate } from '../hooks'

export interface LabwareDetailsProps {
  onClose: () => void
  labware: LabwareDefAndDate
}

export function LabwareDetails(props: LabwareDetailsProps): JSX.Element {
  const { t } = useTranslation('labware_landing')
  const labwareDef = props.labware.definition
  const { metadata, parameters, brand, wells, ordering } = labwareDef
  const apiName = labwareDef.parameters.loadName
  const { displayVolumeUnits } = metadata
  const wellGroups = getUniqueWellProperties(labwareDef)
  const wellLabel = getWellLabel(labwareDef)
  const hasInserts = wellGroups.some(g => g.metadata.displayCategory)
  const insert = wellGroups.find(g => g.metadata.displayCategory)
  const insertCategory = insert?.metadata.displayCategory
  const irregular = wellGroups.length > 1
  const isMultiRow = ordering.some(row => row.length > 1)

  return (
    <Slideout
      onCloseClick={props.onClose}
      title={props.labware.definition.metadata.displayName}
      isExpanded
    >
      <Box
        backgroundColor={COLORS.lightGrey}
        padding={SPACING.spacing4}
        marginBottom={SPACING.spacing5}
        css={{ 'word-wrap': 'break-word' }}
      >
        <StyledText as="h6">{t('api_name')}</StyledText>
        <Link
          css={TYPOGRAPHY.pRegular}
          onClick={() => navigator.clipboard.writeText(apiName)}
          role="button"
        >
          {apiName} <Icon height=".7rem" name="ot-copy-text" />
        </Link>
      </Box>
      <Box border={BORDERS.lineBorder}>
        <Box padding={SPACING.spacing4}>
          <WellCount
            wellLabel={getWellLabel(labwareDef)}
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
            definition={labwareDef}
            irregular={irregular}
            insertCategory={insertCategory}
          />
          {wellGroups.map((wellProps, i) => {
            const { metadata: groupMetadata } = wellProps
            const wellLabel = getWellLabel(wellProps, labwareDef)
            const groupDisplaySuffix =
              groupMetadata.displayName != null
                ? ` - ${groupMetadata.displayName}`
                : ''

            return (
              <React.Fragment key={i}>
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
                    category={labwareDef.metadata.displayCategory}
                    wellProperties={wellProps}
                    wellLabel={wellLabel}
                    labelSuffix={groupDisplaySuffix}
                  />
                )}
                <WellSpacing
                  category={labwareDef.metadata.displayCategory}
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
      {hasInserts && <InsertDetails definition={labwareDef} />}
    </Slideout>
  )
}
