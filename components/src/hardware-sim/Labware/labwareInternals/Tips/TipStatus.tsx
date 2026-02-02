import { SelectedItem } from '../SelectedItem'
import {
  INACCESSIBLE,
  NEW,
  NO,
  SELECTED,
  SELECTED_ERROR,
  SELECTED_USED,
  USED,
} from './constants'
import { InaccessibleTip } from './InaccessibleTip'
import { NewTip } from './NewTip'
import { NoTip } from './NoTip'
import { UsedTip } from './UsedTip'

import type { LabwareDefinition } from '@opentrons/shared-data'
import type { TipType } from '../types'

export function TipStatus(props: {
  type: TipType
  labwareDefinition: LabwareDefinition
  size?: string
  text?: string
}): JSX.Element {
  const { type, size, text, labwareDefinition } = props
  switch (type) {
    case NEW:
      return <NewTip size={size} />
    case USED:
      return <UsedTip size={size} />
    case SELECTED:
      return (
        <SelectedItem
          labwareDefinition={labwareDefinition}
          textInsideTip={text}
        />
      )
    case NO:
      return <NoTip labwareDefinition={labwareDefinition} />
    case INACCESSIBLE:
      return <InaccessibleTip size={size} />
    case SELECTED_USED:
      return (
        <SelectedItem
          labwareDefinition={labwareDefinition}
          textInsideTip={text}
          isUsed
        />
      )
    case SELECTED_ERROR:
      return (
        <SelectedItem
          labwareDefinition={labwareDefinition}
          textInsideTip={text}
          isError
        />
      )
  }
}
