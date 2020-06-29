// @flow
import {
  Icon,
  LabeledValue,
  LabwareRender,
  RobotWorkSpace,
} from '@opentrons/components'
import {
  type LabwareDefinition2,
  getLabwareDefIsStandard,
  getLabwareDisplayName,
} from '@opentrons/shared-data'
import reduce from 'lodash/reduce'
import * as React from 'react'

import { i18n } from '../../localization'
import styles from './styles.css'

type Props = {
  labwareDef: ?LabwareDefinition2,
  moduleCompatibility?:
    | 'recommended'
    | 'potentiallyCompatible'
    | 'notCompatible'
    | null,
}

export const LabwarePreview = (props: Props): React.Node => {
  const { labwareDef, moduleCompatibility } = props
  if (!labwareDef) return null
  const maxVolumes = reduce(
    labwareDef.wells,
    (acc, well) => acc.add(well.totalLiquidVolume),
    new Set()
  )
  const formattedVolumes = Array.from(maxVolumes)
    .map(vol => `${vol}${i18n.t('application.units.microliter')}`)
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
            {i18n.t(
              `modal.labware_selection.module_compatibility.${moduleCompatibility}`
            )}
          </div>
        ) : null}
        <div className={styles.labware_detail_row}>
          <div className={styles.labware_render_wrapper}>
            <RobotWorkSpace
              viewBox={`0 0 ${labwareDef.dimensions.xDimension} ${labwareDef.dimensions.yDimension}`}
            >
              {() => <LabwareRender definition={labwareDef} />}
            </RobotWorkSpace>
          </div>
          <div className={styles.labware_detail_column}>
            {getLabwareDefIsStandard(labwareDef) && (
              <LabeledValue
                label={i18n.t('modal.labware_selection.measurements')}
                value={i18n.t('modal.labware_selection.see_details')}
              />
            )}
            <div className={styles.labware_detail_row}>
              <LabeledValue
                label={i18n.t('modal.labware_selection.well_count')}
                value={Object.keys(labwareDef.wells).length}
              />
              <LabeledValue
                label={i18n.t('modal.labware_selection.max_vol')}
                value={formattedVolumes}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
