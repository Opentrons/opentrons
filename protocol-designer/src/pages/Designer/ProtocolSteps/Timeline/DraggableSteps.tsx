import { useCallback, useRef, useState } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Divider,
  Flex,
  SPACING,
} from '@opentrons/components'

import {
  ConcurrentGroup,
  ConcurrentGroupCheckpoint,
  ConcurrentGroupChild,
} from '/protocol-designer/components/molecules'
import { DND_TYPES } from '/protocol-designer/constants'
import { getEnableConcurrentModuleActions } from '/protocol-designer/feature-flags/selectors'
import { getOrderedSavedForms } from '/protocol-designer/step-forms/selectors'
import * as steplistActions from '/protocol-designer/steplist/actions'
import {
  getMultiSelectItemIds,
  getSelectedStepId,
} from '/protocol-designer/ui/steps/selectors'

import { ConnectedStepInfo } from './ConnectedStepInfo'
import {
  computeStepMove,
  convertStepArrayToHierarchy,
  convertStepHierarchyToArray,
} from './stepHierarchyUtils'

import type { Dispatch, SetStateAction } from 'react'
import type { DragLayerMonitor, DropTargetMonitor } from 'react-dnd'
import type { StepIdType } from '/protocol-designer/form-types'

interface DraggableStepsProps {
  sidebarWidth: number
}

/**
 * The entire list of the "real" steps in the protocol, as opposed to the
 * terminal steps. The steps in here can be dragged and dropped to reorder them.
 */
export function DraggableSteps(props: DraggableStepsProps): JSX.Element | null {
  const enableConcurrentModuleActions = useSelector(
    getEnableConcurrentModuleActions
  )
  const { sidebarWidth } = props
  const [openedOverflowMenuId, setOpenedOverflowMenuId] = useState<
    string | null
  >(null)

  const orderedSavedForms = useSelector(getOrderedSavedForms)
  const orderedStepIds = orderedSavedForms.map(form => form.id)

  // todo(mm, 2025-10-27): nestedSteps and findStepIndex probably ought to be Redux selectors, for efficiency.
  const nestedSteps = convertStepArrayToHierarchy(
    orderedSavedForms,
    enableConcurrentModuleActions
  )
  // todo(mm, 2025-10-27): This implementation of findStepIndex returns the wrong number for steps that
  // come after Thermocycler profiles, because it counts the invisible pause step. We want the numbering to
  // skip over invisible steps.
  const findStepIndex = (stepId: StepIdType): number =>
    orderedStepIds.findIndex(id => stepId === id)

  return (
    <Flex flexDirection={DIRECTION_COLUMN} width="100%">
      {nestedSteps.topLevelItems.map(nestedStepElement => {
        if (nestedStepElement.type === 'standaloneStep') {
          const index = findStepIndex(nestedStepElement.stepId)
          return (
            <DragDropStep
              key={`${nestedStepElement.stepId}_${index}`}
              stepNumber={index + 1}
              stepId={nestedStepElement.stepId}
              openedOverflowMenuId={openedOverflowMenuId}
              setOpenedOverflowMenuId={setOpenedOverflowMenuId}
              sidebarWidth={sidebarWidth}
            />
          )
        } else if (nestedStepElement.type === 'thermocyclerProfileGroup') {
          return (
            <ThermocyclerProfile
              key={
                'concurrent-group-' +
                nestedStepElement.thermocyclerProfileStepId
              }
              thermocyclerProfileStepId={
                nestedStepElement.thermocyclerProfileStepId
              }
              concurrentStepIds={nestedStepElement.concurrentSteps.map(
                step => step.stepId
              )}
              findStepIndex={findStepIndex}
              openedOverflowMenuId={openedOverflowMenuId}
              setOpenedOverflowMenuId={setOpenedOverflowMenuId}
              sidebarWidth={sidebarWidth}
            />
          )
        } else {
          nestedStepElement satisfies never // Exhaustiveness check.
        }
      })}
    </Flex>
  )
}

interface DropType {
  stepId: StepIdType
}

interface ConnectedStepItemProps {
  stepId: StepIdType
  stepNumber: number
  onStepContextMenu?: () => void
}

interface DragDropStepProps extends ConnectedStepItemProps {
  stepId: StepIdType
  openedOverflowMenuId?: string | null
  setOpenedOverflowMenuId?: Dispatch<SetStateAction<string | null>>
  sidebarWidth: number
}

/**
 * A step that can appear at the top level of the timeline or inside a nested group.
 * It can be dragged around to move it within the timeline.
 */
function DragDropStep(props: DragDropStepProps): JSX.Element {
  const {
    stepId,
    stepNumber,
    openedOverflowMenuId,
    setOpenedOverflowMenuId,
    sidebarWidth,
  } = props
  const stepRef = useRef<HTMLDivElement>(null)

  const dispatch = useDispatch()
  const steps = useSelector(getOrderedSavedForms)
  const enableConcurrentModuleActions = useSelector(
    getEnableConcurrentModuleActions
  )

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: DND_TYPES.STEP_ITEM,
      item: { stepId } satisfies DropType,
      collect: (monitor: DragLayerMonitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [stepId]
  )

  const getStepsAfterMovingHere = useCallback(
    (idOfStepBeingMoved: StepIdType) => {
      return computeStepMove(
        convertStepArrayToHierarchy(steps, enableConcurrentModuleActions),
        {
          moveType: 'insertBeforeDestinationStep',
          movedStepId: idOfStepBeingMoved,
          destinationStepId: stepId,
        }
      )
    },
    [steps, stepId, enableConcurrentModuleActions]
  )

  const [{ isHoveredOver, canBeDroppedUpon }, drop] = useDrop(
    () => ({
      accept: DND_TYPES.STEP_ITEM,
      canDrop: (item: DropType) => {
        const stepsAfterMove = getStepsAfterMovingHere(item.stepId)
        return stepsAfterMove.isMoveAllowed
      },
      drop: (item: DropType) => {
        const stepsAfterMove = getStepsAfterMovingHere(item.stepId)
        if (stepsAfterMove.isMoveAllowed) {
          dispatch(
            steplistActions.reorderSteps(
              convertStepHierarchyToArray(stepsAfterMove.stepsAfterMove)
            )
          )
        } else {
          // This shouldn't be possible if canDrop() is working right.
          console.error(
            "Unexpected attempt to move a step in a way that isn't allowed."
          )
        }
      },
      collect: (monitor: DropTargetMonitor) => ({
        isHoveredOver: monitor.isOver(),
        canBeDroppedUpon: monitor.canDrop(),
      }),
    }),
    [getStepsAfterMovingHere, dispatch]
  )

  drag(drop(stepRef))
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      opacity={isDragging ? 0.3 : 1}
      ref={stepRef}
    >
      {isHoveredOver && canBeDroppedUpon && <DragDropPreviewBar />}
      <ConnectedStepInfo
        openedOverflowMenuId={openedOverflowMenuId}
        setOpenedOverflowMenuId={setOpenedOverflowMenuId}
        stepNumber={stepNumber}
        stepId={stepId}
        sidebarWidth={sidebarWidth}
      />
    </Flex>
  )
}

/** A horizontal divider indicating where the step will be placed. */
function DragDropPreviewBar(): JSX.Element {
  return (
    <Box paddingY={SPACING.spacing2}>
      <Divider
        marginY="0"
        borderBottom="none"
        height="0.25rem" // 4px
        width="100%"
        backgroundColor={COLORS.blue50}
        borderRadius="0.125rem" // half of height
      />
    </Box>
  )
}

interface ThermocyclerProfileProps {
  thermocyclerProfileStepId: StepIdType
  concurrentStepIds: StepIdType[]

  findStepIndex: (stepId: StepIdType) => number

  openedOverflowMenuId?: string | null
  setOpenedOverflowMenuId?: Dispatch<SetStateAction<string | null>>

  sidebarWidth: number
}

/**
 * A Thermocycler profile step and the nested block that immediately follows it.
 *
 * The profile step can be dragged around to move the whole group.
 * The nested block can have other steps dropped into it.
 */
function ThermocyclerProfile(props: ThermocyclerProfileProps): JSX.Element {
  const {
    thermocyclerProfileStepId,
    concurrentStepIds,
    findStepIndex,
    openedOverflowMenuId,
    setOpenedOverflowMenuId,
    sidebarWidth,
  } = props

  const selectedStepId = useSelector(getSelectedStepId)
  const multiSelectItemIds = useSelector(getMultiSelectItemIds)
  const isRootSelected =
    multiSelectItemIds != null && multiSelectItemIds.length > 0
      ? multiSelectItemIds.includes(thermocyclerProfileStepId)
      : selectedStepId === thermocyclerProfileStepId

  const { t } = useTranslation()

  return (
    <div>
      <DragDropStep
        stepId={thermocyclerProfileStepId}
        stepNumber={findStepIndex(thermocyclerProfileStepId) + 1}
        openedOverflowMenuId={openedOverflowMenuId}
        setOpenedOverflowMenuId={setOpenedOverflowMenuId}
        sidebarWidth={sidebarWidth}
      />

      <ConcurrentGroup
        active={isRootSelected}
        // todo(mm, 2025-10-27): Following the styling of normal standalnone top-level steps,
        // something should make this ConcurrentGroup and its checkpoint children semi-translucent
        // if there's an error somewhere above in the timeline. But we need to avoid adding
        // translucency to the DragDropStep children, because they already do that to themselves.
      >
        <ConcurrentGroupChild type="checkpoint">
          <ConcurrentGroupCheckpoint
            text={t(
              'protocol_steps:thermocycler_module.profile_timeline.start'
            )}
          />
        </ConcurrentGroupChild>
        {concurrentStepIds.map(concurrentStepId => (
          <ConcurrentGroupChild key={concurrentStepId} type="step">
            <DragDropStep
              stepId={concurrentStepId}
              stepNumber={findStepIndex(concurrentStepId) + 1}
              openedOverflowMenuId={openedOverflowMenuId}
              setOpenedOverflowMenuId={setOpenedOverflowMenuId}
              sidebarWidth={sidebarWidth}
            />
          </ConcurrentGroupChild>
        ))}
        <ConcurrentGroupChild type="checkpoint">
          <ThermocyclerProfileEndCheckpoint
            thermocyclerProfileStepId={thermocyclerProfileStepId}
          />
        </ConcurrentGroupChild>
      </ConcurrentGroup>
    </div>
  )
}

/**
 * The "wait for profile to complete" checkpoint at the end of a Thermocycler profile's
 * nested block. The user can drag a step onto it to move that step right above it.
 */
function ThermocyclerProfileEndCheckpoint(props: {
  thermocyclerProfileStepId: string
}): JSX.Element {
  const { thermocyclerProfileStepId } = props

  const dispatch = useDispatch()
  const steps = useSelector(getOrderedSavedForms)
  const enableConcurrentModuleActions = useSelector(
    getEnableConcurrentModuleActions
  )
  const { t } = useTranslation()

  const getStepsAfterMovingStepHere = useCallback(
    (idOfStepBeingMoved: StepIdType) => {
      return computeStepMove(
        convertStepArrayToHierarchy(steps, enableConcurrentModuleActions),
        {
          moveType: 'insertAsLastStepOfGroup',
          movedStepId: idOfStepBeingMoved,
          destinationGroupRootStepId: thermocyclerProfileStepId,
        }
      )
    },
    [steps, thermocyclerProfileStepId, enableConcurrentModuleActions]
  )

  const [{ isHoveredOver, canBeDroppedUpon }, drop] = useDrop(
    () => ({
      accept: DND_TYPES.STEP_ITEM,
      canDrop: (item: DropType) => {
        const stepsAfterMove = getStepsAfterMovingStepHere(item.stepId)
        return stepsAfterMove.isMoveAllowed
      },
      drop: (item: DropType) => {
        const stepsAfterMove = getStepsAfterMovingStepHere(item.stepId)
        if (stepsAfterMove.isMoveAllowed) {
          dispatch(
            steplistActions.reorderSteps(
              convertStepHierarchyToArray(stepsAfterMove.stepsAfterMove)
            )
          )
        } else {
          // This shouldn't be possible if canDrop() is working right.
          console.error(
            "Unexpected attempt to move a step in a way that isn't allowed."
          )
        }
      },
      collect: monitor => ({
        isHoveredOver: monitor.isOver(),
        canBeDroppedUpon: monitor.canDrop(),
      }),
    }),
    [dispatch, getStepsAfterMovingStepHere]
  )

  return (
    <Flex flexDirection={DIRECTION_COLUMN} ref={drop}>
      {isHoveredOver && canBeDroppedUpon && <DragDropPreviewBar />}
      <ConcurrentGroupCheckpoint
        text={t(
          'protocol_steps:thermocycler_module.profile_timeline.wait_for_complete'
        )}
      />
    </Flex>
  )
}
