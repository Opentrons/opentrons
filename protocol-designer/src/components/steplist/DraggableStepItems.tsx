import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useDrop, useDrag } from 'react-dnd'
import {
  BORDERS,
  Box,
  Btn,
  COLORS,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  SPACING,
} from '@opentrons/components'

import { DND_TYPES } from '../../constants'
import { selectors as stepFormSelectors } from '../../step-forms'
import { stepIconsByType } from '../../form-types'
import { getStepGroups } from '../../step-forms/selectors'
import { ConnectedStepItem } from '../../containers/ConnectedStepItem'
import { PDTitledList } from '../lists'
import { ContextMenu } from './ContextMenu'
import styles from './StepItem.module.css'
import type { DragLayerMonitor, DropTargetOptions } from 'react-dnd'
import type { StepIdType } from '../../form-types'
import type { ConnectedStepItemProps } from '../../containers/ConnectedStepItem'
import { removeGroup } from '../../step-forms/actions/groups'
import { css } from 'styled-components'

type GroupedStep = { groupName: string; stepIds: string[] } | string

interface DragDropStepItemProps extends ConnectedStepItemProps {
  stepId: StepIdType
  moveStep: (stepId: StepIdType, value: number) => void
  findStepIndex: (stepId: StepIdType) => number
  orderedStepIds: string[]
}

interface DropType {
  stepId: StepIdType
}

const DragDropStepItem = (props: DragDropStepItemProps): JSX.Element => {
  const { stepId, moveStep, findStepIndex, orderedStepIds } = props
  const ref = useRef<HTMLDivElement>(null)

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: DND_TYPES.STEP_ITEM,
      item: { stepId },
      collect: (monitor: DragLayerMonitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [orderedStepIds]
  )

  const [{ handlerId }, drop] = useDrop(
    () => ({
      accept: DND_TYPES.STEP_ITEM,
      canDrop: () => {
        return true
      },
      drop: (item: DropType) => {
        const draggedId = item.stepId
        if (draggedId !== stepId) {
          const overIndex = findStepIndex(stepId)
          moveStep(draggedId, overIndex)
        }
      },
      collect: (monitor: DropTargetOptions) => ({
        handlerId: monitor.getHandlerId(),
      }),
    }),
    [orderedStepIds]
  )

  drag(drop(ref))
  return (
    <div
      ref={ref}
      style={{ opacity: isDragging ? 0.3 : 1 }}
      data-handler-id={handlerId}
    >
      <ConnectedStepItem {...props} stepId={stepId} />
    </div>
  )
}

interface StepItemsProps {
  orderedStepIds: StepIdType[]
  reorderSteps: (steps: StepIdType[]) => void
}
export const DraggableStepItems = (
  props: StepItemsProps
): JSX.Element | null => {
  const { orderedStepIds, reorderSteps } = props
  const { t } = useTranslation('shared')
  const groups = useSelector(getStepGroups)
  const dispatch = useDispatch()

  const findStepIndex = (stepId: StepIdType): number =>
    orderedStepIds.findIndex(id => stepId === id)

  const moveStep = (stepId: StepIdType, targetIndex: number): void => {
    const currentIndex = findStepIndex(stepId)

    const currentRemoved = [
      ...orderedStepIds.slice(0, currentIndex),
      ...orderedStepIds.slice(currentIndex + 1, orderedStepIds.length),
    ]
    const currentReinserted = [
      ...currentRemoved.slice(0, targetIndex),
      stepId,
      ...currentRemoved.slice(targetIndex, currentRemoved.length),
    ]
    if (confirm(t('confirm_reorder') as string)) {
      reorderSteps(currentReinserted)
    }
  }

  const groupedSteps: GroupedStep[] = []
  const seenSteps: Set<string> = new Set()

  orderedStepIds.forEach(stepId => {
    // If stepId is already processed, skip it
    if (seenSteps.has(stepId)) return

    // Find group for the current stepId
    const group = Object.entries(groups).find(([groupName, stepIds]) =>
      stepIds.includes(stepId)
    )

    if (group) {
      const [groupName, stepIds] = group
      // Add the whole group to the result and mark all stepIds as seen
      groupedSteps.push({ groupName, stepIds })
      stepIds.forEach(id => seenSteps.add(id))
    } else {
      // If not part of a group, add stepId as is
      groupedSteps.push(stepId)
    }
  })

  return (
    <>
      <ContextMenu>
        {({ makeStepOnContextMenu }) =>
          groupedSteps.map((item, index) => {
            if (typeof item === 'string') {
              // Render a single step
              return (
                <DragDropStepItem
                  key={item}
                  stepNumber={index + 1}
                  stepId={item}
                  //  @ts-expect-error
                  onStepContextMenu={makeStepOnContextMenu(item)}
                  moveStep={moveStep}
                  findStepIndex={findStepIndex}
                  orderedStepIds={orderedStepIds}
                />
              )
            } else {
              // Render a group of steps
              return (
                <Box
                  key={item.groupName}
                  border={BORDERS.lineBorder}
                  backgroundColor={COLORS.grey30}
                >
                  <Flex
                    justifyContent={JUSTIFY_SPACE_BETWEEN}
                    padding={SPACING.spacing8}
                  >
                    <LegacyStyledText as="h2SemiBold" color={COLORS.grey60}>
                      {item.groupName}
                    </LegacyStyledText>
                    <Btn
                      //  this matches legacy --c-highlight used in PD right now
                      css={css`
                        color: ${COLORS.grey40};

                        &:hover {
                          color: #00c3e6;
                        }
                      `}
                      onClick={() => {
                        dispatch(removeGroup({ groupName: item.groupName }))
                      }}
                    >
                      Ungroup
                    </Btn>
                  </Flex>
                  {item.stepIds.map((stepId, subIndex) => (
                    <DragDropStepItem
                      key={`${stepId}_${subIndex}`}
                      stepNumber={index + 1}
                      stepId={stepId}
                      //  @ts-expect-error
                      onStepContextMenu={makeStepOnContextMenu(stepId)}
                      moveStep={moveStep}
                      findStepIndex={findStepIndex}
                      orderedStepIds={orderedStepIds}
                    />
                  ))}
                </Box>
              )
            }
          })
        }
      </ContextMenu>
      <StepDragPreview />
    </>
  )
}

const NAV_OFFSET = 64

const StepDragPreview = (): JSX.Element | null => {
  const [{ isDragging, itemType, item, currentOffset }] = useDrag(() => ({
    type: DND_TYPES.STEP_ITEM,
    collect: (monitor: DragLayerMonitor) => ({
      currentOffset: monitor.getSourceClientOffset(),
      isDragging: monitor.isDragging(),
      itemType: monitor.getItemType(),
      item: monitor.getItem() as { stepId: StepIdType },
    }),
  }))

  const savedStepForms = useSelector(stepFormSelectors.getSavedStepForms)
  const savedForm = item && savedStepForms[item.stepId]
  const { stepType, stepName } = savedForm || {}

  if (
    itemType !== DND_TYPES.STEP_ITEM ||
    !isDragging ||
    !stepType ||
    !currentOffset
  )
    return null
  return (
    <div
      className={styles.step_drag_preview}
      style={{ left: currentOffset.x - NAV_OFFSET, top: currentOffset.y }}
    >
      <PDTitledList
        iconName={stepIconsByType[stepType]}
        title={stepName || ''}
        onCollapseToggle={() => {}} // NOTE: necessary to render chevron
        collapsed
      />
    </div>
  )
}
