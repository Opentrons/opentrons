import * as React from 'react'

import {
  Flex,
  Icon,
  Link,
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  BORDERS,
  COLORS,
  LEGACY_COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  FLEX_NONE,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
  useHoverTooltip,
} from '@opentrons/components'

import { TertiaryButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import { Tooltip } from '../../atoms/Tooltip'

import type { SubTaskProps, TaskListProps, TaskProps } from './types'

interface ProgressTrackerItemProps {
  activeIndex: [number, number] | null
  subTasks: SubTaskProps[]
  taskIndex: number
  taskListLength: number
  isComplete?: boolean
}

function ProgressTrackerItem({
  activeIndex,
  subTasks,
  taskIndex,
  taskListLength,
  isComplete = false,
}: ProgressTrackerItemProps): JSX.Element {
  const [activeTaskIndex, activeSubTaskIndex] = activeIndex ?? []

  const isTaskListComplete = activeIndex == null
  const isPastTask = activeTaskIndex != null && taskIndex < activeTaskIndex
  const isLastTask = taskIndex === taskListLength - 1
  const hasSubTasks = subTasks.length > 0
  const isActiveTaskWithSubtasks = taskIndex === activeTaskIndex && hasSubTasks
  const isFutureTask = activeTaskIndex != null && taskIndex > activeTaskIndex

  // a connector between task icons
  const taskConnector = (
    <Flex
      flex="1"
      borderLeft={BORDERS.lineBorder}
      borderColor={
        isTaskListComplete || isPastTask || isActiveTaskWithSubtasks
          ? COLORS.blue50
          : ''
      }
      marginTop={`-${SPACING.spacing12}`}
      // shorten connector length when subtasks are present
      marginBottom={
        hasSubTasks ? `-${SPACING.spacing8}` : `-${SPACING.spacing20}`
      }
      height="100%"
    />
  )

  const noSubTaskConnector = !isLastTask ? taskConnector : null

  return (
    <Flex flexDirection={DIRECTION_COLUMN} alignItems={ALIGN_CENTER}>
      {isComplete || isTaskListComplete || isPastTask ? (
        <Icon
          size="1.25rem"
          margin={SPACING.spacing16}
          name="ot-check"
          color={
            isTaskListComplete || isPastTask
              ? COLORS.blue50
              : COLORS.grey60
          }
        />
      ) : (
        <Flex
          flex={FLEX_NONE}
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_CENTER}
          backgroundColor={
            isFutureTask
              ? COLORS.grey60
              : COLORS.blue50
          }
          color={COLORS.white}
          margin={SPACING.spacing16}
          height="1.25rem"
          width="1.25rem"
          borderRadius="0.625rem"
        >
          <StyledText as="label">{(taskIndex + 1).toString()}</StyledText>
        </Flex>
      )}
      {!hasSubTasks ? (
        noSubTaskConnector
      ) : (
        <>
          {/**
           * iterate subtask completion list -
           * APPROXIMATION: average amount of space via flex-grow to position the substep connectors/icons
           * ASSUMPTION: substeps don't vary much in size for current use case - maybe one line of wrapped text at most
           * TODO (bh, 9/28/2022): this could change in the future if the task list is used for tasks that contain differently sized children, like deck map rendering, etc
           * a more robust solution to subtask icon layout could implement an n x 2 grid where n is the combined number of tasks/subtasks, in two columns (fixed size, 1fr)
           * this would require top level coordination of both the number of tasks/subtasks and the open status of each task
           * which is possible, but nice to avoid
           * */}
          {taskConnector}
          {subTasks.map((subTask, subTaskIndex) => {
            const isPastSubTask =
              (activeTaskIndex != null &&
                activeSubTaskIndex != null &&
                subTaskIndex <= activeSubTaskIndex &&
                taskIndex < activeTaskIndex) ||
              (activeTaskIndex != null &&
                subTask.isComplete === true &&
                taskIndex <= activeTaskIndex)
            const isFutureSubTask =
              (activeSubTaskIndex != null &&
                activeTaskIndex != null &&
                subTaskIndex > activeSubTaskIndex &&
                taskIndex >= activeTaskIndex) ||
              isFutureTask
            // last subtask of the parent task
            const isLastSubTask = subTaskIndex === subTasks.length - 1
            // last subtask of the last task of the entire list
            const isFinalSubTaskOfTaskList = isLastSubTask && isLastTask

            return (
              <React.Fragment key={subTask.title}>
                {/* subtask circle icon component */}
                <Flex
                  flex={FLEX_NONE}
                  alignItems={ALIGN_CENTER}
                  justifyContent={JUSTIFY_CENTER}
                  // fill in circle for past or completed subtasks
                  backgroundColor={
                    // is in the past or list is complete
                    isTaskListComplete || isPastSubTask
                      ? COLORS.blue50
                      : subTask.isComplete === true
                      ? COLORS.grey60
                      : 'initial'
                  }
                  border={BORDERS.lineBorder}
                  borderColor={
                    isFutureSubTask
                      ? COLORS.grey60
                      : COLORS.blue50
                  }
                  borderWidth={SPACING.spacing2}
                  color={COLORS.white}
                  margin={SPACING.spacing16}
                  height="0.75rem"
                  width="0.75rem"
                  borderRadius="0.375rem"
                />
                {/* subtask connector component */}
                <Flex
                  flex="1"
                  borderLeft={BORDERS.lineBorder}
                  borderColor={
                    // do not show the subtask connector if it's the final subtask of the task list
                    isFinalSubTaskOfTaskList
                      ? COLORS.transparent
                      : isTaskListComplete || isPastSubTask
                      ? COLORS.blue50
                      : COLORS.grey30
                  }
                  marginTop={`-${SPACING.spacing8}`}
                  marginBottom={
                    // extend connector for last subtask
                    isLastSubTask
                      ? `-${SPACING.spacing20}`
                      : `-${SPACING.spacing8}`
                  }
                  height="100%"
                />
              </React.Fragment>
            )
          })}
        </>
      )}
    </Flex>
  )
}

function SubTask({
  activeIndex,
  subTaskIndex,
  taskIndex,
  title,
  description,
  cta,
  footer,
  markedBad,
  generalClickHandler,
  generalTaskDisabledReason,
}: SubTaskProps): JSX.Element {
  const [targetProps, tooltipProps] = useHoverTooltip()

  const [activeTaskIndex, activeSubTaskIndex] = activeIndex ?? []

  const isTaskListComplete = activeIndex == null
  const isActiveSubTask =
    activeSubTaskIndex === subTaskIndex && activeTaskIndex === taskIndex
  const isPastSubTask =
    activeTaskIndex != null &&
    activeSubTaskIndex != null &&
    ((activeSubTaskIndex > subTaskIndex && activeTaskIndex === taskIndex) ||
      activeTaskIndex > taskIndex)
  const isDisabled = generalTaskDisabledReason != null

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      backgroundColor={isActiveSubTask ? COLORS.blue10 : COLORS.white}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={SPACING.spacing16}
      border={isActiveSubTask ? BORDERS.activeLineBorder : BORDERS.lineBorder}
      borderRadius={BORDERS.radiusSoftCorners}
      gridGap={SPACING.spacing24}
      width="100%"
    >
      <Flex
        alignItems={ALIGN_FLEX_START}
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing4}
      >
        <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
          <Flex
            alignItems={ALIGN_CENTER}
            flexDirection={DIRECTION_ROW}
            gridGap={SPACING.spacing8}
          >
            {title}
          </Flex>
        </StyledText>
        <StyledText as="p">{description}</StyledText>
        {footer != null ? (
          <StyledText as="p" color={COLORS.grey50Enabled}>
            <Flex
              alignItems={ALIGN_CENTER}
              flexDirection={DIRECTION_ROW}
              gridGap={SPACING.spacing8}
            >
              {markedBad === true && (
                <Icon
                  name="alert-circle"
                  backgroundColor={COLORS.yellow20}
                  color={COLORS.yellow50}
                  height="1rem"
                  aria-label={`icon_warning`}
                />
              )}
              {footer}
            </Flex>
          </StyledText>
        ) : null}
      </Flex>
      {(isTaskListComplete || isPastSubTask) && cta != null ? (
        <>
          <Link
            {...targetProps}
            css={
              isDisabled
                ? TYPOGRAPHY.darkLinkLabelSemiBoldDisabled
                : TYPOGRAPHY.darkLinkLabelSemiBold
            }
            onClick={() => {
              if (isDisabled) {
                return
              }
              if (generalClickHandler != null) {
                generalClickHandler()
              }
              cta.onClick()
            }}
          >
            {cta.label}
          </Link>
          {isDisabled ? (
            <Tooltip tooltipProps={tooltipProps} whiteSpace="normal">
              {generalTaskDisabledReason}
            </Tooltip>
          ) : null}
        </>
      ) : null}
      {isActiveSubTask && cta != null ? (
        <>
          <TertiaryButton
            {...targetProps}
            disabled={isDisabled}
            onClick={() => {
              if (generalClickHandler != null) {
                generalClickHandler()
              }
              cta.onClick()
            }}
          >
            {cta.label}
          </TertiaryButton>
          {isDisabled ? (
            <Tooltip tooltipProps={tooltipProps} whiteSpace="normal">
              {generalTaskDisabledReason}
            </Tooltip>
          ) : null}
        </>
      ) : null}
    </Flex>
  )
}

function Task({
  activeIndex,
  taskIndex,
  title,
  description,
  cta,
  footer,
  subTasks,
  taskListLength,
  isComplete,
  markedBad,
  generalClickHandler,
  generalTaskDisabledReason,
}: TaskProps): JSX.Element {
  const [targetProps, tooltipProps] = useHoverTooltip()
  const [activeTaskIndex] = activeIndex ?? []

  // TODO(bh, 2022-10-18): pass booleans to children as props
  const isTaskListComplete = activeIndex == null
  const isPastTask = activeTaskIndex != null && taskIndex < activeTaskIndex
  const isActiveTask = activeTaskIndex === taskIndex
  const hasSubTasks = subTasks.length > 0
  const isDisabled = generalTaskDisabledReason != null

  const [isTaskOpen, setIsTaskOpen] = React.useState<boolean>(
    hasSubTasks && isActiveTask
  )

  React.useEffect(() => {
    setIsTaskOpen(hasSubTasks && isActiveTask)
  }, [isActiveTask, hasSubTasks])

  return (
    <Flex key={title}>
      <ProgressTrackerItem
        activeIndex={activeIndex}
        isComplete={isComplete}
        taskIndex={taskIndex}
        subTasks={isTaskOpen ? subTasks : []}
        taskListLength={taskListLength}
      />
      <Flex
        flexDirection={DIRECTION_COLUMN}
        padding={SPACING.spacing16}
        backgroundColor={
          isActiveTask && !isTaskOpen ? COLORS.blue10 : COLORS.white
        }
        border={
          isActiveTask && !isTaskOpen
            ? BORDERS.activeLineBorder
            : BORDERS.lineBorder
        }
        borderRadius={BORDERS.radiusSoftCorners}
        width="100%"
      >
        <Flex
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          gridGap={SPACING.spacing24}
          // click to open the subtask drawer if subtasks are present
          cursor={hasSubTasks ? 'pointer' : ''}
          onClick={() => (hasSubTasks ? setIsTaskOpen(!isTaskOpen) : null)}
        >
          <Flex
            alignItems={ALIGN_FLEX_START}
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing4}
          >
            <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
              <Flex
                alignItems={ALIGN_CENTER}
                flexDirection={DIRECTION_ROW}
                gridGap={SPACING.spacing8}
              >
                {markedBad === true && (
                  <Icon
                    name="alert-circle"
                    backgroundColor={COLORS.yellow20}
                    color={COLORS.yellow50}
                    height="1rem"
                    aria-label={`icon_warning`}
                  />
                )}
                {title}
              </Flex>
            </StyledText>
            <StyledText as="p">{description}</StyledText>
            {footer != null ? (
              <StyledText as="p" color={COLORS.grey50Enabled}>
                <Flex
                  alignItems={ALIGN_CENTER}
                  flexDirection={DIRECTION_ROW}
                  gridGap={SPACING.spacing8}
                >
                  {footer}
                </Flex>
              </StyledText>
            ) : null}
          </Flex>
          {/* if subtasks, caret, otherwise show cta as link or button */}
          {hasSubTasks ? (
            <Icon
              name={isTaskOpen ? 'chevron-up' : 'chevron-down'}
              height="15px"
            />
          ) : (isTaskListComplete || isPastTask) && cta != null ? (
            <>
              <Link
                {...targetProps}
                css={
                  isDisabled
                    ? TYPOGRAPHY.darkLinkLabelSemiBoldDisabled
                    : TYPOGRAPHY.darkLinkLabelSemiBold
                }
                onClick={() => {
                  if (isDisabled) {
                    return
                  }
                  if (generalClickHandler != null) {
                    generalClickHandler()
                  }
                  cta.onClick()
                }}
              >
                {cta.label}
              </Link>
              {isDisabled ? (
                <Tooltip tooltipProps={tooltipProps} whiteSpace="normal">
                  {generalTaskDisabledReason}
                </Tooltip>
              ) : null}
            </>
          ) : null}
          {isActiveTask && cta != null ? (
            <>
              <TertiaryButton
                {...targetProps}
                disabled={isDisabled}
                onClick={() => {
                  if (generalClickHandler != null) {
                    generalClickHandler()
                  }
                  cta.onClick()
                }}
              >
                {cta.label}
              </TertiaryButton>
              {isDisabled ? (
                <Tooltip tooltipProps={tooltipProps} whiteSpace="normal">
                  {generalTaskDisabledReason}
                </Tooltip>
              ) : null}
            </>
          ) : null}
        </Flex>
        {isTaskOpen ? (
          <Flex
            flexDirection={DIRECTION_COLUMN}
            marginTop={SPACING.spacing16}
            gridGap={SPACING.spacing8}
          >
            {subTasks.map(
              (
                { title, description, cta, footer, markedBad },
                subTaskIndex
              ) => (
                <SubTask
                  key={title}
                  title={title}
                  description={description}
                  cta={cta}
                  footer={footer}
                  activeIndex={activeIndex}
                  subTaskIndex={subTaskIndex}
                  taskIndex={taskIndex}
                  markedBad={markedBad}
                  generalClickHandler={generalClickHandler}
                  generalTaskDisabledReason={generalTaskDisabledReason}
                />
              )
            )}
          </Flex>
        ) : null}
      </Flex>
    </Flex>
  )
}

export function TaskList({
  activeIndex,
  taskList,
  generalTaskClickHandler,
  generalTaskDisabledReason,
}: TaskListProps): JSX.Element {
  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
      {taskList.map(
        (
          { title, description, cta, footer, subTasks, isComplete, markedBad },
          taskIndex
        ) => (
          <Task
            key={title}
            title={title}
            description={description}
            cta={cta}
            footer={footer}
            subTasks={subTasks}
            activeIndex={activeIndex}
            taskIndex={taskIndex}
            taskListLength={taskList.length}
            isComplete={isComplete}
            markedBad={markedBad}
            generalClickHandler={generalTaskClickHandler}
            generalTaskDisabledReason={generalTaskDisabledReason}
          />
        )
      )}
    </Flex>
  )
}
