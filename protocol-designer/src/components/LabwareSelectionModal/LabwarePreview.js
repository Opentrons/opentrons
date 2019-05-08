// @flow
import * as React from 'react'
import reduce from 'lodash/reduce'
import {
  LabwareRender,
  LabeledValue,
  RobotWorkSpace,
} from '@opentrons/components'
import { type LabwareDefinition2 } from '@opentrons/shared-data'
import i18n from '../../localization'
import styles from './styles.css'

type Props = {
  labwareDef: LabwareDefinition2,
}

const LabwarePreview = (props: Props) => {
  const { labwareDef } = props
  if (!labwareDef) return null
  const maxVolumes = reduce(
    labwareDef.wells,
    (acc, well) => acc.add(well.totalLiquidVolume),
    new Set()
  )
  return (
    <div className={styles.labware_preview_wrapper}>
      <div className={styles.labware_preview}>
        <h3>{props.labwareDef.metadata.displayName}</h3>
        <div className={styles.labware_detail_row}>
          <RobotWorkSpace
            viewBox={`0 0 ${labwareDef.dimensions.overallLength} ${
              labwareDef.dimensions.overallWidth
            }`}
          >
            {() => <LabwareRender definition={labwareDef} />}
          </RobotWorkSpace>
          <div>
            <LabeledValue
              label={i18n.t('modal.labware_selection.measurements')}
              value={i18n.t('modal.labware_selection.see_details')}
            />
            <div>
              <LabeledValue
                label={i18n.t('modal.labware_selection.well_count')}
                value={Object.keys(labwareDef.wells).length}
              />
              <LabeledValue
                label={i18n.t('modal.labware_selection.max_vol')}
                value={Array.from(maxVolumes).join(', ')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LabwarePreview
