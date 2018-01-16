// @flow
import * as React from 'react'
import cx from 'classnames'
import noop from 'lodash/noop'

import {Icon, TitledList} from '@opentrons/components'
import StepDescription from './StepDescription'
import styles from './StepItem.css'

import {stepIconsByType} from '../steplist/types'
import type {StepType} from '../steplist/types'

type StepItemProps = {
  stepType: StepType,
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
  const showLabwareHeader = ['transfer', 'distribute', 'consolidate'].includes(stepType) &&
    sourceLabwareName &&
    destLabwareName

  const Description = <StepDescription description={description} />

  return (
    <TitledList
      className={styles.step_item}
      description={Description}
      {...{iconName, title, selected, onClick, onCollapseToggle: onCollapseToggle || noop, collapsed}}
    >
      {showLabwareHeader && <li className={cx(styles.step_subitem_column_header, styles.emphasized_cell)}>
        <span>{sourceLabwareName}</span>
        <Icon name={iconName} />
        <span>{destLabwareName}</span>
      </li>}
      {children}
    </TitledList>
  )
}
