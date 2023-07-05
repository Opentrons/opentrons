import * as React from 'react'
import { useField } from 'formik'
import { SlotMap } from '@opentrons/components'
import { RobotType } from '@opentrons/shared-data'
import styles from './EditModules.css'

interface ConnectedSlotMapProps {
  fieldName: string
  robotType: RobotType
}

export const ConnectedSlotMap = (
  props: ConnectedSlotMapProps
): JSX.Element | null => {
  const { fieldName, robotType } = props
  const [field, meta] = useField(fieldName)
  return field.value ? (
    <div className={styles.slot_map_container}>
      <SlotMap
        occupiedSlots={[`${field.value}`]}
        isError={Boolean(meta.error)}
        robotType={robotType}
      />
    </div>
  ) : null
}
