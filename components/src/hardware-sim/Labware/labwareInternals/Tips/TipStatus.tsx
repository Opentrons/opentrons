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
    case 'new':
      return <NewTip size={size} />
    case 'used':
      return <UsedTip size={size} />
    case 'selected':
      return <SelectedTip size={size} text={text} />
    case 'no':
      return <NoTip size={size} />
    case 'inaccessible':
      return <InaccessibleTip size={size} />
  }
}
