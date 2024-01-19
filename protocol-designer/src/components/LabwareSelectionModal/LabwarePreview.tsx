import * as React from 'react'
import reduce from 'lodash/reduce'
import { useTranslation } from 'react-i18next'
import {
  Icon,
  LabwareRender,
  LabeledValue,
  RobotWorkSpace,
} from '@opentrons/components'
import {
  getLabwareDisplayName,
  getLabwareDefIsStandard,
  LabwareDefinition2,
} from '@opentrons/shared-data'
import styles from './styles.css'

interface Props {
  labwareDef?: LabwareDefinition2 | null
  moduleCompatibility?:
    | 'recommended'
    | 'potentiallyCompatible'
    | 'notCompatible'
    | null
}

export const LabwarePreview = (props: Props): JSX.Element | null => {
  const { labwareDef, moduleCompatibility } = props
  const { t } = useTranslation(['modal', 'application'])
  if (!labwareDef) return null
  const maxVolumes = reduce(
    labwareDef.wells,
    (acc, well) => acc.add(well.totalLiquidVolume),
    new Set()
  )
  const formattedVolumes = Array.from(maxVolumes)
    .map(vol => `${vol}${t('application:units.microliter')}`)
    .join(', ')

  // NOTE: this is a temporary magic value that positions the preview component
  // in a fixed place relative to the labware dropdown, while still letting
  // it overflow the sidebar nav if necessary
  const leftValue = (global.innerWidth - 365) / 2 - 260

  return (
    <div style={{ left: leftValue }} className={styles.labware_preview_wrapper}>
      <div className={styles.labware_preview}>
        <h3 className={styles.labware_preview_header}>
          {props.labwareDef ? getLabwareDisplayName(props.labwareDef) : ''}
        </h3>
        {moduleCompatibility != null ? (
          <div className={styles.labware_preview_module_compat}>
            {moduleCompatibility === 'recommended' ? (
              <Icon className={styles.icon} name="check-decagram" />
            ) : null}
            {t(`labware_selection.module_compatibility.${moduleCompatibility}`)}
          </div>
        ) : null}
        <div className={styles.labware_detail_row}>
          <div className={styles.labware_render_wrapper}>
            <RobotWorkSpace
              viewBox={`${labwareDef.cornerOffsetFromSlot.x} ${labwareDef.cornerOffsetFromSlot.y} ${labwareDef.dimensions.xDimension} ${labwareDef.dimensions.yDimension}`}
            >
              {() => <LabwareRender definition={labwareDef} />}
            </RobotWorkSpace>
          </div>
          <div className={styles.labware_detail_column}>
            {getLabwareDefIsStandard(labwareDef) && (
              <LabeledValue
                label={t('labware_selection.measurements')}
                value={t('labware_selection.see_details')}
              />
            )}
            <div className={styles.labware_detail_row}>
              <LabeledValue
                label={t('labware_selection.well_count')}
                value={Object.keys(labwareDef.wells).length}
              />
              <LabeledValue
                label={t('labware_selection.max_vol')}
                value={formattedVolumes}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
