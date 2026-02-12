import { EmptyWell, SelectedWell } from '../Wells'
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
        <SelectedWell
          size={size}
          textInsideTip={text}
          labwareDefinition={labwareDefinition}
        />
      )
    case NO:
      return <EmptyWell size={size} labwareDefinition={labwareDefinition} />
    case INACCESSIBLE:
      return <InaccessibleTip size={size} />
    case SELECTED_USED:
      return (
        <SelectedWell
          size={size}
          textInsideTip={text}
          isUsed
          labwareDefinition={labwareDefinition}
        />
      )
    case SELECTED_ERROR:
      return (
        <SelectedWell
          size={size}
          textInsideTip={text}
          isError
          labwareDefinition={labwareDefinition}
        />
      )
  }
}
