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
      <Box
        border={BORDERS.lineBorder}
        padding={SPACING.spacing4}
        marginBottom={SPACING.spacing5}
      >
        <WellCount
          wellLabel={getWellLabel(labwareDef)}
          count={Object.keys(wells).length}
        />
        {!hasInserts && !irregular && (
          <WellProperties
            wellProperties={wellGroups[0]}
            wellLabel={wellLabel}
            displayVolumeUnits={displayVolumeUnits}
            hideTitle
          />
        )}
      </Box>
    </Slideout>
  )
}
