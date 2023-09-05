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
  useHoverTooltip,
  TOOLTIP_TOP_START,
} from '@opentrons/components'
import { getUniqueWellProperties } from '@opentrons/shared-data'
import { StyledText } from '../../atoms/text'
import { Slideout } from '../../atoms/Slideout'
import { Tooltip } from '../../atoms/Tooltip'
import { getWellLabel } from './helpers/labels'
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
    background: ${COLORS.lightGreyHover};
  }
  &:active {
    background: ${COLORS.lightGreyPressed};
  }
`

const COPY_ICON_STYLE = css`
  transform: translateY(${SPACING.spacing4});
  &:hover {
    color: ${COLORS.blueEnabled};
  }
  &:active,
  &:focus {
    color: ${COLORS.darkBlackEnabled};
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
  const [showToolTip, setShowToolTip] = React.useState<boolean>(false)
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_TOP_START,
  })

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(apiName)
    setShowToolTip(true)
  }

  React.useEffect(() => {
    const timer = setTimeout(() => setShowToolTip(false), 2000)
    return () => {
      clearTimeout(timer)
    }
  }, [showToolTip])

  const slideoutHeader = (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing4}
      paddingX={SPACING.spacing16}
      marginBottom={SPACING.spacing16}
    >
      <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <StyledText css={TYPOGRAPHY.h2SemiBold}>
          {props.labware.definition.metadata.displayName}
        </StyledText>
        <Link
          onClick={props.onClose}
          role="button"
          data-testid="labwareDetails_slideout_close_button"
        >
          <Icon
            name="close"
            height={SPACING.spacing24}
            css={CLOSE_ICON_STYLE}
          />
        </Link>
      </Flex>
      {!isCustomDefinition && (
        <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
          <Icon
            color={COLORS.blueEnabled}
            name="check-decagram"
            height=".7rem"
          />{' '}
          <StyledText
            as="label"
            id="LabwareDetails_opentronsDef"
            marginLeft={SPACING.spacing4}
          >
            {t('opentrons_def')}
          </StyledText>
        </Flex>
      )}
      {modified != null && filename != null && (
        <Flex
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          paddingRight={SPACING.spacing2}
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
        backgroundColor={COLORS.fundamentalsBackground}
        padding={SPACING.spacing16}
        marginBottom={SPACING.spacing24}
      >
        <StyledText as="h6">{t('api_name')}</StyledText>
        <Link css={TYPOGRAPHY.pRegular} onClick={handleCopy} role="button">
          <Flex overflowWrap="anywhere">
            <Box fontSize={TYPOGRAPHY.fontSizeP} color={COLORS.black}>
              {apiName}
              <span {...targetProps}>
                <Icon size={SIZE_1} name="copy-text" css={COPY_ICON_STYLE} />
              </span>
            </Box>
          </Flex>
          {showToolTip && (
            <Tooltip width="3.25rem" tooltipProps={tooltipProps}>
              {t('copied')}
            </Tooltip>
          )}
        </Link>
      </Box>
      <Box border={BORDERS.lineBorder}>
        <Box padding={SPACING.spacing16}>
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
                ? ` - ${String(groupMetadata.displayName)}`
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
