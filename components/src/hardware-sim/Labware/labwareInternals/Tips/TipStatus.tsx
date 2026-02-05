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
import { SelectedTip } from './SelectedTip'
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
      return <SelectedTip size={size} textInsideTip={text} />
    case NO:
      return <NoTip size={size} />
    case INACCESSIBLE:
      return <InaccessibleTip size={size} />
    case SELECTED_USED:
      return <SelectedTip size={size} textInsideTip={text} isUsed />
    case SELECTED_ERROR:
      return <SelectedTip size={size} textInsideTip={text} isError />
  }
}
