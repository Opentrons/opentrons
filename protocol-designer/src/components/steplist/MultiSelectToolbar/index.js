// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'

import {
  Flex,
  Box,
  Tooltip,
  useHoverTooltip,
  Icon,
  ALIGN_CENTER,
  SIZE_2,
  SPACING_2,
  C_DARK_GRAY,
} from '@opentrons/components'

import { selectors as stepFormSelectors } from '../../../step-forms'
import { getMultiSelectItemIds } from '../../../ui/steps'

import type { IconName } from '@opentrons/components'

type ClickableIconProps = {
  iconName: IconName,
  tooltipText: string,
  width?: string,
  alignRight?: boolean,
  isLast?: boolean,
}

export const ClickableIcon = (props: ClickableIconProps): React.Node => {
  const { iconName, tooltipText, width } = props
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: 'top',
  })

  const boxStyles = {
    marginRight: props.isLast ? 0 : SPACING_2,
    marginLeft: props.alignRight ? 'auto' : 0,
  }

  return (
    <Box {...boxStyles} {...targetProps}>
      <Tooltip {...tooltipProps}>{tooltipText}</Tooltip>
      <Icon name={iconName} width={width || '1.25rem'} color={C_DARK_GRAY} />
    </Box>
  )
}

export const MultiSelectToolbar = (): React.Node => {
  const stepCount = useSelector(stepFormSelectors.getOrderedStepIds).length
  const selectedStepCount = useSelector(getMultiSelectItemIds)?.length
  const isAllStepsSelected = stepCount === selectedStepCount

  const selectProps = {
    iconName: isAllStepsSelected ? 'checkbox-marked' : 'minus-box',
    tooltipText: isAllStepsSelected ? 'deselect' : 'select',
  }

  const deleteProps = {
    iconName: 'delete',
    tooltipText: 'delete',
    width: '1.5rem',
    alignRight: true,
  }

  const copyProps = {
    iconName: 'content-copy',
    tooltipText: 'duplicate',
  }

  const expandProps = {
    iconName: 'unfold-less-horizontal',
    tooltipText: 'collapse',
    isLast: true,
  }

  return (
    <Flex alignItems={ALIGN_CENTER} height={SIZE_2} padding={'0 0.75rem'}>
      <ClickableIcon {...selectProps} />
      <ClickableIcon {...deleteProps} />
      <ClickableIcon {...copyProps} />
      <ClickableIcon {...expandProps} />
    </Flex>
  )
}
