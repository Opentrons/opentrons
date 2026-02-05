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

import type { TipType } from '../types'

export function TipStatus(props: {
  type: TipType
  size?: string
  text?: string
}): JSX.Element {
  const { type, size, text } = props
  switch (type) {
    case NEW:
      return <NewTip size={size} />
    case USED:
      return <UsedTip size={size} />
    case SELECTED:
      return <SelectedWell size={size} textInsideTip={text} />
    case NO:
      return <EmptyWell size={size} />
    case INACCESSIBLE:
      return <InaccessibleTip size={size} />
    case SELECTED_USED:
      return <SelectedWell size={size} textInsideTip={text} isUsed />
    case SELECTED_ERROR:
      return <SelectedWell size={size} textInsideTip={text} isError />
  }
}
