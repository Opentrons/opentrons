import styles from './EditModules.css'
import { SlotMap } from '@opentrons/components'
import { useField } from 'formik'
import * as React from 'react'

interface ConnectedSlotMapProps {
  fieldName: string
}

export const ConnectedSlotMap = (
  props: ConnectedSlotMapProps
): JSX.Element | null => {
  const { fieldName } = props
  const [field, meta] = useField(fieldName)
  return field.value ? (
    <div className={styles.slot_map_container}>
      <SlotMap
        occupiedSlots={[`${field.value}`]}
        isError={Boolean(meta.error)}
      />
    </div>
  ) : null
}
