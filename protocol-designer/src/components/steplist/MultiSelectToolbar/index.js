// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import cx from 'classnames'
import { Tooltip, useHoverTooltip, Icon } from '@opentrons/components'

import { selectors as stepFormSelectors } from '../../../step-forms'
import { getMultiSelectItemIds } from '../../../ui/steps'
import styles from './styles.css'

export const MultiSelectToolbar = (): React.Node => {
  return (
    <div className={styles.toolbar_container}>
      <SelectAllIcon />
      <DeleteIcon />
      <DuplicateIcon />
      <ExpandCollapseIcon />
    </div>
  )
}

const SelectAllIcon = (): React.Node => {
  const stepCount = useSelector(stepFormSelectors.getOrderedStepIds).length
  const selectedStepCount = useSelector(getMultiSelectItemIds)?.length
  const isAllStepsSelected = stepCount === selectedStepCount
  const iconName = isAllStepsSelected ? 'checkbox-marked' : 'minus-box'

  const tooltipText = isAllStepsSelected ? 'deselect' : 'select'

  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: 'top',
  })
  return (
    <div {...targetProps}>
      <Tooltip {...tooltipProps}>{tooltipText}</Tooltip>
      <Icon name={iconName} className={styles.toolbar_icon} />
    </div>
  )
}

const DeleteIcon = () => {
  const tooltipText = 'delete'
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: 'top',
  })
  return (
    <div {...targetProps}>
      <Tooltip {...tooltipProps}>{tooltipText}</Tooltip>
      <Icon
        name="delete"
        className={cx(styles.toolbar_icon, styles.icon_right)}
      />
    </div>
  )
}

const DuplicateIcon = () => {
  const tooltipText = 'duplicate'
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: 'top',
  })
  return (
    <div {...targetProps}>
      <Tooltip {...tooltipProps}>{tooltipText}</Tooltip>
      <Icon name="content-copy" className={styles.toolbar_icon} />
    </div>
  )
}

const ExpandCollapseIcon = () => {
  const tooltipText = 'collapse'
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: 'top',
  })
  return (
    <div {...targetProps}>
      <Tooltip {...tooltipProps}>{tooltipText}</Tooltip>
      <Icon name="unfold-less-horizontal" className={styles.toolbar_icon} />
    </div>
  )
}
