import * as React from 'react'
import { ControllerRenderProps } from 'react-hook-form'
import { SlotMap } from '@opentrons/components'
import { RobotType } from '@opentrons/shared-data'
import styles from './EditModules.module.css'
import type { EditModulesFormValues } from './index'


interface ConnectedSlotMapProps {
  robotType: RobotType
  field: ControllerRenderProps<EditModulesFormValues, 'selectedSlot'>
  hasFieldError?: boolean
}

export const ConnectedSlotMap = (
  props: ConnectedSlotMapProps
): JSX.Element | null => {
  const { robotType, field, hasFieldError } = props

  return field.value ? (
    <div className={styles.slot_map_container}>
      <SlotMap
        occupiedSlots={[`${field.value}`]}
        isError={hasFieldError}
        robotType={robotType}
      />
    </div>
  ) : null
}
