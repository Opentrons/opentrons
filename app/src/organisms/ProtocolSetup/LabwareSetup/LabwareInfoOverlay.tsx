import * as React from 'react'
import { useTranslation } from 'react-i18next'
import cx from 'classnames'
import {
  getLabwareDisplayName,
  LabwareDefinition2,
} from '@opentrons/shared-data'
import { RobotCoordsForeignDiv } from '@opentrons/components'
import styles from './styles.css'

interface LabwareInfoProps {
  displayName: string
}

const FAKE_OFFSET_DATA = { x: 0.0, y: 0.0, z: 0.0 } // TODO IMMEDIATELY: replace with real data when available
const LabwareInfo = (props: LabwareInfoProps): JSX.Element => {
  const { displayName } = props
  const { t } = useTranslation('protocol_setup')
  return (
    <div className={cx(styles.name_overlay)}>
      <p className={styles.display_name}> {displayName} </p>
      <p className={cx(styles.display_name, styles.offset_label)}>
        {' '}
        {t('offset_data')}{' '}
      </p>
      <p className={styles.display_name}>
        {' '}
        <span className={styles.offset_label}>X </span>
        {FAKE_OFFSET_DATA.x} <span className={styles.offset_label}>Y </span>
        {FAKE_OFFSET_DATA.y} <span className={styles.offset_label}>Z </span>
        {FAKE_OFFSET_DATA.z}{' '}
      </p>
    </div>
  )
}

interface LabwareInfoOverlayProps {
  x: number
  y: number
  definition: LabwareDefinition2
}
export const LabwareInfoOverlay = (
  props: LabwareInfoOverlayProps
): JSX.Element => {
  const { x, y, definition } = props
  const width = definition.dimensions.xDimension
  const height = definition.dimensions.yDimension
  return (
    <RobotCoordsForeignDiv
      {...{ x, y, width, height }}
      innerDivProps={{
        className: cx(styles.labware_info_overlay),
      }}
    >
      <LabwareInfo displayName={getLabwareDisplayName(definition)} />
    </RobotCoordsForeignDiv>
  )
}
