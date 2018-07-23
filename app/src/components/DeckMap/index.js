// @flow
import React from 'react'

import {Deck} from '@opentrons/components'
import ConnectedSlotItem from './ConnectedSlotItem'
import ModuleItem from './ModuleItem'
import LabwareItem from './LabwareItem'
import styles from './styles.css'

export default function DeckMap () {
  return (
    <Deck
      // $FlowFixMe: I think ReactRouter type is causing problems here?
      LabwareComponent={ConnectedSlotItem}
      className={styles.deck}
    />
  )
}

export {LabwareItem, ModuleItem}
export type {LabwareItemProps} from './LabwareItem'
export type {ModuleItemProps} from './ModuleItem'
