// @flow
import * as React from 'react'

import styles from './LiquidPlacementModal.css'

import SelectablePlate from '../containers/SelectablePlate'
import LiquidPlacementForm from '../components/LiquidPlacementForm'
import LabwareNameEditForm from '../containers/LabwareNameEditForm'
import WellSelectionInstructions from './WellSelectionInstructions'

type Props = {}

export default function LiquidPlacementModal (props: Props) {
  return (
    <div className={styles.liquid_placement_modal}>
      <LiquidPlacementForm />
      <LabwareNameEditForm />

      <SelectablePlate selectable />

      <WellSelectionInstructions />
    </div>
  )
}
