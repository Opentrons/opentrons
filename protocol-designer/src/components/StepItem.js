// @flow
import * as React from 'react'
import cx from 'classnames'

import {Icon, TitledList} from '@opentrons/components'
import StepDescription from './StepDescription'
import styles from './StepItem.css'

function noop () {} // a do-nothing function

const stepIconsByType = { // TODO Ian 2018-01-11 revisit this
  'transfer': 'arrow right',
  'consolidate': 'consolidate',
  'distribute': 'distribute',
  'pause': 'pause',
  'mix': 'mix'
}

type StepItemProps = {
  stepType: $Keys<typeof stepIconsByType>,
  title?: string,
  description?: string,
  collapsed?: boolean,
  selected?: boolean,
  sourceLabwareName?: string,
  destLabwareName?: string,
  onClick?: (event: SyntheticEvent<>) => void,
  onCollapseToggle?: (event: SyntheticEvent<>) => void,
  children?: React.Node
}

export default function StepItem (props: StepItemProps) {
  const {
    stepType,
    title,
    description,
    sourceLabwareName,
    destLabwareName,
    collapsed,
    selected,
    onClick,
    onCollapseToggle,
    children
  } = props

  const iconName = stepIconsByType[stepType]
  const showHeader = ['transfer', 'distribute', 'consolidate'].includes(stepType)

  const Description = <StepDescription description={description} />

  return (
    <TitledList
      className={styles.step_item}
      description={Description}
      {...{iconName, title, selected, onClick, onCollapseToggle: onCollapseToggle || noop, collapsed}}
    >
      {showHeader && <li className={cx(styles.step_subitem_column_header, styles.emphasized_cell)}>
        <span>{sourceLabwareName}</span>
        <Icon name={iconName} />
        <span>{destLabwareName}</span>
      </li>}
      {children}
    </TitledList>
  )
}
