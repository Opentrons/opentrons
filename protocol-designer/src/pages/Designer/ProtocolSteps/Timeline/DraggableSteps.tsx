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
import {
  getOrderedSavedForms,
  getSavedStepHierarchy,
} from '/protocol-designer/step-forms/selectors'
import * as steplistActions from '/protocol-designer/steplist/actions'
import {
  computeStepMove,
  convertStepArrayToHierarchy,
  convertStepHierarchyToArray,
} from '/protocol-designer/steplist/utils/stepHierarchy'
import {
  getMultiSelectItemIds,
  getSelectedStepId,
} from '/protocol-designer/ui/steps/selectors'

import { ConnectedStepInfo } from './ConnectedStepInfo'

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
  const { sidebarWidth } = props
  const [openedOverflowMenuId, setOpenedOverflowMenuId] = useState<
    string | null
  >(null)

  const stepHierarchy = useSelector(getSavedStepHierarchy)

  return (
    <Flex flexDirection={DIRECTION_COLUMN} width="100%">
      {stepHierarchy.topLevelItems.map(nestedStepElement => {
        if (nestedStepElement.type === 'standaloneStep') {
          return (
            <DragDropStep
              key={`${nestedStepElement.stepId}`}
              stepId={nestedStepElement.stepId}
              openedOverflowMenuId={openedOverflowMenuId}
              setOpenedOverflowMenuId={setOpenedOverflowMenuId}
              sidebarWidth={sidebarWidth}
            />
          )
        } else if (nestedStepElement.type === 'thermocyclerProfileGroup') {
          return (
            <ThermocyclerProfile
              key={'concurrent-group-' + nestedStepElement.startStepId}
              startStepId={nestedStepElement.startStepId}
              concurrentStepIds={nestedStepElement.concurrentSteps.map(
                step => step.stepId
              )}
              openedOverflowMenuId={openedOverflowMenuId}
              setOpenedOverflowMenuId={setOpenedOverflowMenuId}
              sidebarWidth={sidebarWidth}
            />
          )
        } else if (nestedStepElement.type === 'vacuumProfileGroup') {
          return (
            <VacuumProfile
              key={'concurrent-group-' + nestedStepElement.startStepId}
              startStepId={nestedStepElement.startStepId}
              concurrentStepIds={nestedStepElement.concurrentSteps.map(
                step => step.stepId
              )}
              openedOverflowMenuId={openedOverflowMenuId}
              setOpenedOverflowMenuId={setOpenedOverflowMenuId}
              sidebarWidth={sidebarWidth}
            />
          )
        } else if (nestedStepElement.type === 'vacuumStateDurationGroup') {
          return (
            <VacuumStateDurationConcurrent
              key={'concurrent-group-' + nestedStepElement.startStepId}
              startStepId={nestedStepElement.startStepId}
              concurrentStepIds={nestedStepElement.concurrentSteps.map(
                step => step.stepId
              )}
              openedOverflowMenuId={openedOverflowMenuId}
              setOpenedOverflowMenuId={setOpenedOverflowMenuId}
              sidebarWidth={sidebarWidth}
            />
          )
        } else {
          nestedStepElement satisfies never // Exhaustiveness check.
          return null
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
    openedOverflowMenuId,
    setOpenedOverflowMenuId,
    sidebarWidth,
  } = props
  const stepRef = useRef<HTMLDivElement>(null)

  const dispatch = useDispatch()
  const steps = useSelector(getOrderedSavedForms)

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
      return computeStepMove(convertStepArrayToHierarchy(steps), {
        moveType: 'insertBeforeDestinationStep',
        movedStepId: idOfStepBeingMoved,
        destinationStepId: stepId,
      })
    },
    [steps, stepId]
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
  startStepId: StepIdType
  concurrentStepIds: StepIdType[]

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
    startStepId,
    concurrentStepIds,
    openedOverflowMenuId,
    setOpenedOverflowMenuId,
    sidebarWidth,
  } = props

  const selectedStepId = useSelector(getSelectedStepId)
  const multiSelectItemIds = useSelector(getMultiSelectItemIds)
  const isRootSelected =
    multiSelectItemIds != null && multiSelectItemIds.length > 0
      ? multiSelectItemIds.includes(startStepId)
      : selectedStepId === startStepId

  const { t } = useTranslation()

  return (
    <div>
      <DragDropStep
        stepId={startStepId}
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
              openedOverflowMenuId={openedOverflowMenuId}
              setOpenedOverflowMenuId={setOpenedOverflowMenuId}
              sidebarWidth={sidebarWidth}
            />
          </ConcurrentGroupChild>
        ))}
        <ConcurrentGroupChild type="checkpoint">
          <ThermocyclerProfileEndCheckpoint startStepId={startStepId} />
        </ConcurrentGroupChild>
      </ConcurrentGroup>
    </div>
  )
}

/**
 * The "wait for profile to complete" checkpoint at the end of a Thermocycler profile's
 * nested block. The user can drag a step onto it to move that step right above it.
 */
interface VacuumProfileProps {
  startStepId: StepIdType
  concurrentStepIds: StepIdType[]

  openedOverflowMenuId?: string | null
  setOpenedOverflowMenuId?: Dispatch<SetStateAction<string | null>>

  sidebarWidth: number
}

/**
 * A Vacuum profile step and the nested block that immediately follows it.
 *
 * The profile step can be dragged around to move the whole group.
 * The nested block can have other steps dropped into it.
 */
function VacuumProfile(props: VacuumProfileProps): JSX.Element {
  const {
    startStepId,
    concurrentStepIds,
    openedOverflowMenuId,
    setOpenedOverflowMenuId,
    sidebarWidth,
  } = props

  const selectedStepId = useSelector(getSelectedStepId)
  const multiSelectItemIds = useSelector(getMultiSelectItemIds)
  const isRootSelected =
    multiSelectItemIds != null && multiSelectItemIds.length > 0
      ? multiSelectItemIds.includes(startStepId)
      : selectedStepId === startStepId

  const { t } = useTranslation()

  return (
    <div>
      <DragDropStep
        stepId={startStepId}
        openedOverflowMenuId={openedOverflowMenuId}
        setOpenedOverflowMenuId={setOpenedOverflowMenuId}
        sidebarWidth={sidebarWidth}
      />

      <ConcurrentGroup active={isRootSelected}>
        <ConcurrentGroupChild type="checkpoint">
          <ConcurrentGroupCheckpoint
            text={t('protocol_steps:vacuum.profile_timeline.start')}
          />
        </ConcurrentGroupChild>
        {concurrentStepIds.map(concurrentStepId => (
          <ConcurrentGroupChild key={concurrentStepId} type="step">
            <DragDropStep
              stepId={concurrentStepId}
              openedOverflowMenuId={openedOverflowMenuId}
              setOpenedOverflowMenuId={setOpenedOverflowMenuId}
              sidebarWidth={sidebarWidth}
            />
          </ConcurrentGroupChild>
        ))}
        <ConcurrentGroupChild type="checkpoint">
          <VacuumProfileEndCheckpoint startStepId={startStepId} />
        </ConcurrentGroupChild>
      </ConcurrentGroup>
    </div>
  )
}

interface VacuumStateDurationConcurrentProps {
  startStepId: StepIdType
  concurrentStepIds: StepIdType[]

  openedOverflowMenuId?: string | null
  setOpenedOverflowMenuId?: Dispatch<SetStateAction<string | null>>

  sidebarWidth: number
}

/**
 * A timed Vacuum state step and the nested block that immediately follows it.
 */
function VacuumStateDurationConcurrent(
  props: VacuumStateDurationConcurrentProps
): JSX.Element {
  const {
    startStepId,
    concurrentStepIds,
    openedOverflowMenuId,
    setOpenedOverflowMenuId,
    sidebarWidth,
  } = props

  const selectedStepId = useSelector(getSelectedStepId)
  const multiSelectItemIds = useSelector(getMultiSelectItemIds)
  const isRootSelected =
    multiSelectItemIds != null && multiSelectItemIds.length > 0
      ? multiSelectItemIds.includes(startStepId)
      : selectedStepId === startStepId

  const { t } = useTranslation()

  return (
    <div>
      <DragDropStep
        stepId={startStepId}
        openedOverflowMenuId={openedOverflowMenuId}
        setOpenedOverflowMenuId={setOpenedOverflowMenuId}
        sidebarWidth={sidebarWidth}
      />

      <ConcurrentGroup active={isRootSelected}>
        <ConcurrentGroupChild type="checkpoint">
          <ConcurrentGroupCheckpoint
            text={t('protocol_steps:vacuum.state_timeline.start')}
          />
        </ConcurrentGroupChild>
        {concurrentStepIds.map(concurrentStepId => (
          <ConcurrentGroupChild key={concurrentStepId} type="step">
            <DragDropStep
              stepId={concurrentStepId}
              openedOverflowMenuId={openedOverflowMenuId}
              setOpenedOverflowMenuId={setOpenedOverflowMenuId}
              sidebarWidth={sidebarWidth}
            />
          </ConcurrentGroupChild>
        ))}
        <ConcurrentGroupChild type="checkpoint">
          <VacuumStateDurationEndCheckpoint startStepId={startStepId} />
        </ConcurrentGroupChild>
      </ConcurrentGroup>
    </div>
  )
}

/**
 * The "wait for profile to complete" checkpoint at the end of a Vacuum profile's
 * nested block. The user can drag a step onto it to move that step right above it.
 */
function VacuumProfileEndCheckpoint(props: {
  startStepId: string
}): JSX.Element {
  const { startStepId } = props

  const dispatch = useDispatch()
  const steps = useSelector(getOrderedSavedForms)
  const { t } = useTranslation()

  const getStepsAfterMovingStepHere = useCallback(
    (idOfStepBeingMoved: StepIdType) => {
      return computeStepMove(convertStepArrayToHierarchy(steps), {
        moveType: 'insertAsLastStepOfGroup',
        movedStepId: idOfStepBeingMoved,
        destinationGroupRootStepId: startStepId,
      })
    },
    [steps, startStepId]
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
        text={t('protocol_steps:vacuum.profile_timeline.wait_for_complete')}
      />
    </Flex>
  )
}

function VacuumStateDurationEndCheckpoint(props: {
  startStepId: string
}): JSX.Element {
  const { startStepId } = props

  const dispatch = useDispatch()
  const steps = useSelector(getOrderedSavedForms)
  const { t } = useTranslation()

  const getStepsAfterMovingStepHere = useCallback(
    (idOfStepBeingMoved: StepIdType) => {
      return computeStepMove(convertStepArrayToHierarchy(steps), {
        moveType: 'insertAsLastStepOfGroup',
        movedStepId: idOfStepBeingMoved,
        destinationGroupRootStepId: startStepId,
      })
    },
    [steps, startStepId]
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
        text={t('protocol_steps:vacuum.state_timeline.wait_for_complete')}
      />
    </Flex>
  )
}

function ThermocyclerProfileEndCheckpoint(props: {
  startStepId: string
}): JSX.Element {
  const { startStepId } = props

  const dispatch = useDispatch()
  const steps = useSelector(getOrderedSavedForms)
  const { t } = useTranslation()

  const getStepsAfterMovingStepHere = useCallback(
    (idOfStepBeingMoved: StepIdType) => {
      return computeStepMove(convertStepArrayToHierarchy(steps), {
        moveType: 'insertAsLastStepOfGroup',
        movedStepId: idOfStepBeingMoved,
        destinationGroupRootStepId: startStepId,
      })
    },
    [steps, startStepId]
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
