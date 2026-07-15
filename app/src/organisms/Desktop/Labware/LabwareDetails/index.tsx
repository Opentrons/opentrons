import { Fragment, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'

import {
  COLORS,
  Icon,
  LegacyStyledText,
  Link,
  Tooltip,
  TOOLTIP_TOP_START,
  TYPOGRAPHY,
  useHoverTooltip,
} from '@opentrons/components'
import {
  getLabwareDefIsStandard,
  getLabwareDisplayName,
  getUniqueWellProperties,
} from '@opentrons/shared-data'

import { Slideout } from '/app/atoms/Slideout'

import { CustomLabwareOverflowMenu } from '../LabwareCard/CustomLabwareOverflowMenu'
import { Dimensions } from './Dimensions'
import { Gallery } from './Gallery'
import { getWellLabel } from './helpers/labels'
import { InsertDetails } from './InsertDetails'
import styles from './labwaredetails.module.css'
import { ManufacturerDetails } from './ManufacturerDetails'
import { WellCount } from './WellCount'
import { WellDimensions } from './WellDimensions'
import { WellProperties } from './WellProperties'
import { WellSpacing } from './WellSpacing'

import type { LabwareDefAndDate } from '/app/local-resources/labware'

export interface LabwareDetailsProps {
  onClose: () => void
  labware: LabwareDefAndDate
}

export function LabwareDetails(props: LabwareDetailsProps): JSX.Element {
  const { t } = useTranslation(['labware_landing', 'branded'])
  const { definition, modified, filename } = props.labware
  const { metadata, parameters, brand, wells, ordering } = definition
  const displayName = getLabwareDisplayName(definition)
  const apiName = parameters.loadName
  const { displayVolumeUnits } = metadata
  const wellGroups = getUniqueWellProperties(definition)
  const wellLabel = getWellLabel(definition)
  const hasInserts = wellGroups.some(g => g.metadata.displayCategory)
  const insert = wellGroups.find(g => g.metadata.displayCategory)
  const insertCategory = insert?.metadata.displayCategory
  const irregular = wellGroups.length > 1
  const isMultiRow = ordering.some(row => row.length > 1)
  const isCustomDefinition = !getLabwareDefIsStandard(definition)
  const [showToolTip, setShowToolTip] = useState<boolean>(false)
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_TOP_START,
  })

  const handleCopy = (): void => {
    void navigator.clipboard.writeText(apiName).then(() => {
      setShowToolTip(true)
    })
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowToolTip(false)
    }, 2000)
    return () => {
      clearTimeout(timer)
    }
  }, [showToolTip])

  const slideoutHeader = (
    <div className={styles.slideout_header_container}>
      <div className={styles.slideout_header_content}>
        <LegacyStyledText css={TYPOGRAPHY.h2SemiBold}>
          {displayName}
        </LegacyStyledText>
        <Link
          onClick={props.onClose}
          role="button"
          data-testid="labwareDetails_slideout_close_button"
        >
          <Icon name="close" height="1.5rem" className={styles.close_icon} />
        </Link>
      </div>
      {!isCustomDefinition && (
        <div className={styles.brand_def_container}>
          <Icon color={COLORS.blue50} name="check-decagram" height=".7rem" />{' '}
          <LegacyStyledText
            forwardedAs="label"
            className={styles.brand_def_text}
          >
            {t('branded:opentrons_def')}
          </LegacyStyledText>
        </div>
      )}
      {modified != null && filename != null && (
        <div className={styles.last_updated_container}>
          <LegacyStyledText
            forwardedAs="label"
            color={COLORS.grey50}
          >
            {t('last_updated')} {format(new Date(modified), 'MM/dd/yyyy')}
          </LegacyStyledText>
          <CustomLabwareOverflowMenu
            filename={filename}
            onDelete={props.onClose}
          />
        </div>
      )}
    </div>
  )

  return (
    <Slideout onCloseClick={props.onClose} title={slideoutHeader} isExpanded>
      <Gallery definition={definition} />
      <div className={styles.api_name_container}>
        <LegacyStyledText forwardedAs="h6">{t('api_name')}</LegacyStyledText>
        <Link
          className={styles.api_name_link}
          onClick={handleCopy}
          role="button"
          aria-label="copy"
        >
          <div className={styles.api_name_content}>
            {apiName}
            <span {...targetProps} className={styles.copy_icon_container}>
              <Icon size="1rem" name="copy-text" className={styles.copy_icon} />
            </span>
          </div>

          {showToolTip && (
            <Tooltip width="3.25rem" tooltipProps={tooltipProps}>
              {t('copied')}
            </Tooltip>
          )}
        </Link>
      </div>
      <div className={styles.table_contaienr}>
        <div className={styles.table_content}>
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
              <Fragment key={index}>
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
              </Fragment>
            )
          })}
        </div>
        <ManufacturerDetails brand={brand} />
      </div>
      {hasInserts && <InsertDetails definition={definition} />}
    </Slideout>
  )
}
