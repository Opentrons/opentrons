// @flow
import * as React from 'react'

import {TitledList} from '@opentrons/components'
import StepDescription from '../StepDescription'
import styles from './StepItem.css'

import {stepIconsByType, type StepType} from '../../form-types'

type StepItemProps = {
  stepType: StepType,
  title?: string,
  description?: ?string,
  collapsed?: boolean,
  selected?: boolean,
  error?: ?boolean,
  onClick?: (event: SyntheticEvent<>) => mixed,
  onMouseEnter?: (event: SyntheticEvent<>) => mixed,
  onMouseLeave?: (event: SyntheticEvent<>) => mixed,
  onCollapseToggle?: (event: SyntheticEvent<>) => mixed,
  headers?: Array<React.Element<'li'>> | React.Element<'li'>,
  children?: React.Node
}

export default function StepItem (props: StepItemProps) {
  const {
    stepType,
    title,
    description,
    collapsed,
    selected,
    error,
    onClick,
    onMouseEnter,
    onMouseLeave,
    onCollapseToggle,
    headers,
    children
  } = props

  const iconName = stepIconsByType[stepType]

  const Description = <StepDescription description={description} />

  return (
    <TitledList
      className={styles.step_item}
      description={Description}
      iconName={error ? 'alert-circle' : iconName}
      iconProps={{className: error ? styles.error_icon : ''}}
      {...{title, selected, onClick, onMouseEnter, onMouseLeave, onCollapseToggle, collapsed}}
    >
      {headers}
      {children}
    </TitledList>
  )
}
