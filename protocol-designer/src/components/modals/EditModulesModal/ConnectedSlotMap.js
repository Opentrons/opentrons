// @flow
import React from 'react'
import { useField } from 'formik'
import { SlotMap, type SlotMapProps } from '@opentrons/components'
import styles from './EditModules.css'

type ConnectedSlotMapProps = {|
  fieldName: string,
  isError: $PropertyType<SlotMapProps, 'isError'>,
|}

export const ConnectedSlotMap = (props: ConnectedSlotMapProps) => {
  const { fieldName, isError } = props
  const [field] = useField(fieldName)
  return field.value ? (
    <div className={styles.slot_map_container}>
      <SlotMap occupiedSlots={[`${field.value}`]} isError={isError} />
    </div>
  ) : null
}
