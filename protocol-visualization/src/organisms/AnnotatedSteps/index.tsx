import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { List, useDynamicRowHeight, useListCallbackRef } from 'react-window'

import { getLabwareDefinitionsFromCommands } from '@opentrons/components'

import styles from './annotatedsteps.module.css'
import { AnnotatedStepsRowItem } from './AnnotatedStepsRowItem'
import { ProtocolAnalysisErrorModal } from './ProtocolAnalysisErrorModal'
import {
  getGroupedNodeIndexContainingCommandId,
  getIsVisibleProtocolStep,
  getLastVisibleAnalysisCommandId,
} from './utils'

import type { Dispatch, SetStateAction } from 'react'
import type {
  AnalysisError,
  CompletedProtocolAnalysis,
  LabwareDefinition,
  ProtocolAnalysisOutput,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type { GroupedCommands } from '../../types'

interface AnnotatedStepsProps {
  analysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput
  groupedCommands: GroupedCommands | null
  currentCommandIndex?: number
  setSelectedCommand?: Dispatch<SetStateAction<string | null>> // remove redux dependency
  handlePause?: () => void
  setIsAtBottom?: Dispatch<SetStateAction<boolean>> // remove redux dependency
  milliSecondsPerFrame?: number
  isGlobalPlaying?: boolean
}

type GroupNode = Extract<GroupedCommands[number], { annotationId: string }>

interface GroupRow {
  type: 'group'
  group: GroupNode
  annotationType: string
  commandStartNumber: number
  annotationDescription: string
  trailingErrors?: AnalysisError[]
}

interface CommandRow {
  type: 'command'
  command: RunTimeCommand
  isHighlighted: boolean
  fromGroup: boolean
  commandNumber: number
}

interface ErrorRow {
  type: 'errors'
  errors: AnalysisError[]
}

interface ErrorPastStepsMessageRow {
  type: 'errors_past_steps_message'
}

type AnnotatedStepsRow =
  | GroupRow
  | CommandRow
  | ErrorRow
  | ErrorPastStepsMessageRow

export interface ItemData {
  rows: AnnotatedStepsRow[]
  analysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput
  allRunDefs: LabwareDefinition[]
  scrollTargetId: string | null
  listElement: HTMLElement | null
  /** Height of the virtualized list viewport; used to size expanded step groups vertically. */
  listViewportHeight: number
  onShowErrorDetails: () => void
  t: (key: string) => string
  milliSecondsPerFrame: number
  isGlobalPlaying: boolean
  setSelectedCommand?: Dispatch<SetStateAction<string | null>> // remove redux dependency
  handlePause?: () => void
}

// Note: Since we're using the height value that appears most frequently in the design,
// we may need to adjust it later.
const DEFAULT_ROW_HEIGHT_PX = 64
const DEFAULT_STEP_GROUP_SECONDS = 2000

export function AnnotatedSteps(props: AnnotatedStepsProps): JSX.Element {
  const {
    analysis,
    currentCommandIndex,
    groupedCommands,
    setSelectedCommand,
    handlePause,
    setIsAtBottom,
    milliSecondsPerFrame = DEFAULT_STEP_GROUP_SECONDS,
    isGlobalPlaying = false,
  } = props
  const { t } = useTranslation('protocol_visualization')
  const [showErrorDetailsModal, setShowErrorDetailsModal] =
    useState<boolean>(false)
  const [scrollTargetId, setScrollTargetId] = useState<string | null>(null)
  const [listElement, setListElement] = useState<HTMLElement | null>(null)
  const isValidRobotSideAnalysis = analysis != null
  const allRunDefs = useMemo(
    () =>
      analysis != null
        ? getLabwareDefinitionsFromCommands(analysis.commands)
        : [],
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isValidRobotSideAnalysis]
  )
  const filteredCommands = useMemo(
    () =>
      analysis.commands.filter(
        command =>
          !command.commandType.includes('load') &&
          command.commandType !== 'home'
      ),
    [analysis.commands]
  )
  const currentCommandId =
    currentCommandIndex != null && currentCommandIndex >= 0
      ? (filteredCommands[currentCommandIndex]?.id ?? null)
      : null
  const filteredGroupedCommands = useMemo(() => {
    if (groupedCommands == null) {
      return null
    }
    const next: GroupedCommands = []
    for (const node of groupedCommands) {
      if ('annotationId' in node) {
        const subCommands = node.subCommands.filter(leaf =>
          getIsVisibleProtocolStep(leaf.command)
        )
        if (subCommands.length > 0) {
          next.push({ ...node, subCommands })
        }
      } else if (getIsVisibleProtocolStep(node.command)) {
        next.push(node)
      }
    }
    return next
  }, [groupedCommands])
  const groupedCommandsHighlightedInfo = useMemo(
    () =>
      filteredGroupedCommands?.map(node => {
        if ('annotationId' in node) {
          const updatedSubCommands = node.subCommands.map(subNode => ({
            ...subNode,
            isHighlighted: currentCommandId === subNode.command.id,
          }))

          return {
            ...node,
            subCommands: updatedSubCommands,
            isHighlighted: updatedSubCommands.some(
              subNode => subNode.isHighlighted
            ),
          }
        }
        return {
          ...node,
          isHighlighted: currentCommandId === node.command.id,
        }
      }),
    [filteredGroupedCommands, currentCommandId]
  )

  const lastVisibleAnalysisCommandId = useMemo(
    () => getLastVisibleAnalysisCommandId(analysis.commands),
    [analysis.commands]
  )

  const groupedRowIndexForTrailingErrors = useMemo(() => {
    if (
      analysis.errors.length === 0 ||
      groupedCommandsHighlightedInfo == null ||
      groupedCommandsHighlightedInfo.length === 0 ||
      lastVisibleAnalysisCommandId == null
    ) {
      return null
    }
    return getGroupedNodeIndexContainingCommandId(
      groupedCommandsHighlightedInfo,
      lastVisibleAnalysisCommandId
    )
  }, [
    analysis.errors,
    groupedCommandsHighlightedInfo,
    lastVisibleAnalysisCommandId,
  ])

  useEffect(() => {
    if (currentCommandId == null) {
      return
    }
    if (filteredGroupedCommands != null && filteredGroupedCommands.length > 0) {
      const flatCommands = filteredGroupedCommands.flatMap(node =>
        'subCommands' in node ? node.subCommands : [node]
      )

      const targetNode = flatCommands.find(
        node => node.command.id === currentCommandId
      )
      const targetCommandId = targetNode?.command.id ?? null

      if (targetCommandId != null && scrollTargetId !== targetCommandId) {
        setScrollTargetId(targetCommandId)
      }
      return
    }

    if (scrollTargetId !== currentCommandId) {
      setScrollTargetId(currentCommandId)
    }
  }, [filteredGroupedCommands, currentCommandId, scrollTargetId])

  const { rows, rowIndexByCommandId } = useMemo(() => {
    const nextRows: AnnotatedStepsRow[] = []
    const nextRowIndexByCommandId = new Map<string, number>()
    let commandNumber = 0

    if (
      groupedCommandsHighlightedInfo != null &&
      groupedCommandsHighlightedInfo.length > 0
    ) {
      groupedCommandsHighlightedInfo.forEach((group, index) => {
        const nextIndex = groupedCommandsHighlightedInfo[index + 1]
        const nextIsGrouped = nextIndex != null && 'annotationId' in nextIndex

        if ('annotationId' in group) {
          const subCommandStartNumber = commandNumber + 1
          commandNumber += group.subCommands.length

          const rowIndex = nextRows.length
          nextRows.push({
            type: 'group',
            group,
            annotationType: group.annotation?.name ?? '',
            commandStartNumber: subCommandStartNumber,
            annotationDescription: group.annotation?.description ?? '',
            ...(groupedRowIndexForTrailingErrors === index &&
            analysis.errors.length > 0
              ? { trailingErrors: analysis.errors }
              : {}),
          })
          group.subCommands.forEach(subCommand => {
            nextRowIndexByCommandId.set(subCommand.command.id, rowIndex)
          })
        } else {
          const currentCommandNumber = ++commandNumber
          const rowIndex = nextRows.length
          nextRows.push({
            type: 'command',
            command: group.command,
            isHighlighted: group.isHighlighted,
            fromGroup: nextIsGrouped,
            commandNumber: currentCommandNumber,
          })
          nextRowIndexByCommandId.set(group.command.id, rowIndex)
        }
      })
    } else {
      filteredCommands.forEach(command => {
        const currentCommandNumber = ++commandNumber
        const rowIndex = nextRows.length
        nextRows.push({
          type: 'command',
          command,
          isHighlighted:
            currentCommandIndex != null &&
            currentCommandIndex >= 0 &&
            filteredCommands[currentCommandIndex]?.id === command.id,
          fromGroup: false,
          commandNumber: currentCommandNumber,
        })
        nextRowIndexByCommandId.set(command.id, rowIndex)
      })
    }

    if (
      analysis.errors.length > 0 &&
      groupedRowIndexForTrailingErrors == null
    ) {
      nextRows.push({
        type: 'errors',
        errors: analysis.errors,
      })
    } else if (
      analysis.errors.length > 0 &&
      groupedRowIndexForTrailingErrors != null
    ) {
      nextRows.push({
        type: 'errors_past_steps_message',
      })
    }

    return {
      rows: nextRows,
      rowIndexByCommandId: nextRowIndexByCommandId,
    }
  }, [
    groupedCommandsHighlightedInfo,
    filteredCommands,
    currentCommandIndex,
    analysis.errors,
    groupedRowIndexForTrailingErrors,
  ])

  const [listRef, listRefCallback] = useListCallbackRef()
  const [listWidth, setListWidth] = useState(0)
  const [listViewportHeight, setListViewportHeight] = useState(0)
  const visibleRowRangeRef = useRef({ start: 0, stop: 0 })
  const dynamicRowHeight = useDynamicRowHeight({
    defaultRowHeight: DEFAULT_ROW_HEIGHT_PX,
    key: `${listWidth}-${rows.length}`,
  })

  useEffect(() => {
    const element = listRef?.element
    if (element == null) return

    const updateHeight = (): void => {
      setListViewportHeight(element.clientHeight)
    }

    updateHeight()
    const resizeObserver = new ResizeObserver(updateHeight)
    resizeObserver.observe(element)
    return () => {
      resizeObserver.disconnect()
    }
  }, [listRef])

  useEffect(() => {
    if (scrollTargetId == null) return
    const rowIndex = rowIndexByCommandId.get(scrollTargetId)
    if (rowIndex == null) return

    if (!isGlobalPlaying) {
      const { start, stop } = visibleRowRangeRef.current
      const isRowVisible = rowIndex >= start && rowIndex <= stop
      if (isRowVisible) {
        return
      }
    }

    listRef?.scrollToRow({
      index: rowIndex,
      align: rowIndex >= rows.length - 1 ? 'end' : 'auto',
    })
  }, [
    scrollTargetId,
    rowIndexByCommandId,
    listRef,
    rows.length,
    isGlobalPlaying,
  ])

  useEffect(() => {
    setListElement(listRef?.element ?? null)
  }, [listRef])

  const handleRowsRendered = useCallback(
    ({ startIndex, stopIndex }: { startIndex: number; stopIndex: number }) => {
      visibleRowRangeRef.current = { start: startIndex, stop: stopIndex }
      if (rows.length === 0) {
        setIsAtBottom?.(true)
      } else {
        setIsAtBottom?.(stopIndex >= rows.length - 1)
      }
    },
    [rows.length, setIsAtBottom]
  )
  const itemData = useMemo<ItemData>(
    () => ({
      rows,
      analysis,
      allRunDefs,
      setSelectedCommand,
      handlePause,
      scrollTargetId,
      listElement,
      listViewportHeight,
      onShowErrorDetails: () => {
        setShowErrorDetailsModal(true)
      },
      t,
      milliSecondsPerFrame,
      isGlobalPlaying,
    }),
    [
      rows,
      analysis,
      allRunDefs,
      setSelectedCommand,
      handlePause,
      scrollTargetId,
      listElement,
      listViewportHeight,
      t,
      milliSecondsPerFrame,
      isGlobalPlaying,
    ]
  )

  return (
    <>
      {showErrorDetailsModal ? (
        <ProtocolAnalysisErrorModal
          errors={analysis?.errors}
          onClose={() => {
            setShowErrorDetailsModal(false)
          }}
        />
      ) : null}
      <div className={styles.annotated_steps_container}>
        <List
          listRef={listRefCallback}
          className={styles.annotated_steps_list}
          rowCount={rows.length}
          rowHeight={dynamicRowHeight}
          rowComponent={AnnotatedStepsRowItem}
          rowProps={itemData}
          onRowsRendered={handleRowsRendered}
          onResize={(size, prevSize) => {
            if (size.width !== prevSize.width) {
              setListWidth(size.width)
            }
          }}
        />
      </div>
    </>
  )
}
