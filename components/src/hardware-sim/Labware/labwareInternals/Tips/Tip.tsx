import { InaccessibleTip } from './InaccessibleTip'
import { NewTip } from './NewTip'
import { NoTip } from './NoTip'
import { SelectedTip } from './SelectedTip'
import { UsedTip } from './UsedTip'

import type { TipType } from '../types'

export function Tip(props: {
  type: TipType
  size?: string | number
}): JSX.Element {
  const { type, size } = props
  switch (type) {
    case 'new':
      return <NewTip size={size} />
    case 'used':
      return <UsedTip size={size} />
    case 'selected':
      return <SelectedTip size={size} />
    case 'no':
      return <NoTip size={size} />
    case 'inaccessible':
      return <InaccessibleTip size={size} />
  }
}
