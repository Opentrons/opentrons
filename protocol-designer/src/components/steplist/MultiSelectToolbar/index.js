// @flow
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
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
import { useConditionalConfirm } from '../../../../../components/src/hooks/useConditionalConfirm'
import { selectors as stepFormSelectors } from '../../../step-forms'
import {
  getMultiSelectItemIds,
  actions as stepActions,
} from '../../../ui/steps'
import { getBatchEditFormHasUnsavedChanges } from '../../../step-forms/selectors'
import { deleteMultipleSteps } from '../../../steplist/actions'
import {
  CLOSE_STEP_FORM_WITH_CHANGES,
  ConfirmDeleteModal,
} from '../../modals/ConfirmDeleteModal'

import type { IconName } from '@opentrons/components'

type ClickableIconProps = {|
  iconName: IconName,
  tooltipText: string,
  width?: string,
  alignRight?: boolean,
  isLast?: boolean,
  onClick?: (event: SyntheticMouseEvent<>) => mixed,
|}

export const ClickableIcon = (props: ClickableIconProps): React.Node => {
  const { iconName, onClick, tooltipText, width } = props
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
      <Box onClick={onClick}>
        <Icon name={iconName} width={width || '1.25rem'} color={C_DARK_GRAY} />
      </Box>
    </Box>
  )
}

export const MultiSelectToolbar = (): React.Node => {
  const dispatch = useDispatch()
  const [isExpandState, setIsExpandState] = React.useState<boolean>(true)
  const stepCount = useSelector(stepFormSelectors.getOrderedStepIds).length
  const selectedStepCount = useSelector(getMultiSelectItemIds)?.length
  const batchEditFormHasUnsavedChanges = useSelector(
    getBatchEditFormHasUnsavedChanges
  )
  const selectedStepIds = useSelector(getMultiSelectItemIds)
  const isAllStepsSelected = stepCount === selectedStepCount

  const onClickAction = isAllStepsSelected
    ? () => dispatch(stepActions.deselectAllSteps())
    : () => dispatch(stepActions.selectAllSteps())

  const { confirm, showConfirmation, cancel } = useConditionalConfirm(
    onClickAction,
    batchEditFormHasUnsavedChanges
  )

  const selectProps = {
    iconName: isAllStepsSelected ? 'checkbox-marked' : 'minus-box',
    tooltipText: isAllStepsSelected ? 'deselect' : 'select',
    onClick: confirm,
  }

  const deleteProps = {
    iconName: 'delete',
    tooltipText: 'Delete',
    width: '1.5rem',
    alignRight: true,
    onClick: () => {
      if (selectedStepIds) {
        dispatch(deleteMultipleSteps(selectedStepIds))
      } else {
        console.warn(
          'something went wrong, you cannot delete multiple steps if none are selected'
        )
      }
    },
  }

  const copyProps = {
    iconName: 'content-copy',
    tooltipText: 'Duplicate',
    onClick: () => {
      if (selectedStepIds) {
        dispatch(stepActions.duplicateMultipleSteps(selectedStepIds))
      } else {
        console.warn(
          'something went wrong, you cannot duplicate multiple steps if none are selected'
        )
      }
    },
  }

  const expandProps = {
    iconName: isExpandState
      ? 'unfold-more-horizontal'
      : 'unfold-less-horizontal',
    tooltipText: isExpandState ? 'Expand' : 'Collapse',
    onClick: () => {
      if (selectedStepIds) {
        if (isExpandState) {
          dispatch(stepActions.expandMultipleSteps(selectedStepIds))
        } else {
          dispatch(stepActions.collapseMultipleSteps(selectedStepIds))
        }
        setIsExpandState(!isExpandState)
      } else {
        console.warn(
          'something went wrong, you cannot toggle multiple steps if none are selected'
        )
      }
    },
    isLast: true,
  }

  return (
    <>
      {showConfirmation && (
        <ConfirmDeleteModal
          modalType={CLOSE_STEP_FORM_WITH_CHANGES}
          onContinueClick={confirm}
          onCancelClick={cancel}
        />
      )}
      <Flex alignItems={ALIGN_CENTER} height={SIZE_2} padding={'0 0.75rem'}>
        <ClickableIcon {...selectProps} />
        <ClickableIcon {...deleteProps} />
        <ClickableIcon {...copyProps} />
        <ClickableIcon {...expandProps} />
      </Flex>
    </>
  )
}
