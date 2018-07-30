// @flow
import * as React from 'react'
import {PDTitledList} from '../../lists'

type Props = {
  title: string,
  children?: React.Node,

  hovered: boolean,
  selected: boolean,

  onStepClick?: (event?: SyntheticEvent<>) => mixed,
  onStepHover?: (event?: SyntheticEvent<>) => mixed,
  onStepMouseLeave?: (event?: SyntheticEvent<>) => mixed
}

export default function TerminalItem (props: Props) {
  const {
    title,
    children,
    hovered,
    selected,
    onStepClick,
    onStepHover,
    onStepMouseLeave
  } = props

  return (
    <PDTitledList
      title={title}
      onClick={onStepClick}
      onMouseEnter={onStepHover}
      onMouseLeave={onStepMouseLeave}
      selected={selected}
      hovered={hovered}
    >
      {children}
    </PDTitledList>
  )
}
