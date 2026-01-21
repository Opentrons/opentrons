import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { List, useDynamicRowHeight, useListCallbackRef } from 'react-window'

import { getLabwareDefinitionsFromCommands } from '@opentrons/components'

import { ProtocolAnalysisErrorModal } from '../../Devices/ProtocolRun/ProtocolRunHeader/RunHeaderModalContainer/modals'
import styles from './annotatedsteps.module.css'
import { AnnotatedStepsRowItem } from './AnnotatedStepsRowItem'

import type { Dispatch, SetStateAction } from 'react'
import type {
  AnalysisError,
  CompletedProtocolAnalysis,
  LabwareDefinition,
  ProtocolAnalysisOutput,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type { GroupedCommands } from '/app/redux/protocol-storage'

interface AnnotatedStepsProps {
  analysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput
  groupedCommands: GroupedCommands | null
  currentCommandIndex?: number
  setSelectedCommand?: Dispatch<SetStateAction<string | null>>
  handlePause?: () => void
  setIsAtBottom?: Dispatch<SetStateAction<boolean>>
}

type GroupNode = Extract<GroupedCommands[number], { annotationIndex: number }>

interface GroupRow {
  type: 'group'
  group: GroupNode
  annotationType: string
  commandStartNumber: number
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

type AnnotatedStepsRow = GroupRow | CommandRow | ErrorRow

export interface ItemData {
  rows: AnnotatedStepsRow[]
  analysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput
  allRunDefs: LabwareDefinition[]
  setSelectedCommand?: Dispatch<SetStateAction<string | null>>
  handlePause?: () => void
  scrollTargetId: string | null
  listElement: HTMLElement | null
  onShowErrorDetails: () => void
  t: (key: string) => string
}

// Note: Since we're using the height value that appears most frequently in the design,
// we may need to adjust it later.
const DEFAULT_ROW_HEIGHT_PX = 64

export function AnnotatedSteps(props: AnnotatedStepsProps): JSX.Element {
  const {
    analysis,
    currentCommandIndex,
    groupedCommands,
    setSelectedCommand,
    handlePause,
    setIsAtBottom,
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
    [isValidRobotSideAnalysis]
  )
  const annotations = analysis?.commandAnnotations ?? []
  const annotationNames = useMemo(
    () => annotations.map(annotation => annotation?.machineReadableName ?? ''),
    [annotations]
  )
  const commandIndexById = useMemo(
    () =>
      new Map(analysis.commands.map((command, index) => [command.id, index])),
    [analysis.commands]
  )
  const groupedCommandsHighlightedInfo = useMemo(
    () =>
      groupedCommands?.map(node => {
        if ('annotationIndex' in node) {
          return {
            ...node,
            isHighlighted: node.subCommands.some(
              subNode => subNode.isHighlighted
            ),
            subCommands: node.subCommands.map(subNode => ({
              ...subNode,
              isHighlighted:
                currentCommandIndex ===
                commandIndexById.get(subNode.command.id),
            })),
          }
        } else {
          return {
            ...node,
            isHighlighted:
              currentCommandIndex === commandIndexById.get(node.command.id),
          }
        }
      }),
    [groupedCommands, currentCommandIndex, commandIndexById]
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

  useEffect(() => {
    if (currentCommandIndex == null) return
    if (groupedCommands != null) {
      const flatCommands = groupedCommands.flatMap(node =>
        'subCommands' in node ? node.subCommands : [node]
      )

      const targetNode = flatCommands.find(
        node => commandIndexById.get(node.command.id) === currentCommandIndex
      )

      if (targetNode?.command.id && scrollTargetId !== targetNode.command.id) {
        setScrollTargetId(targetNode.command.id)
      }
      return
    }

    const targetCommand = filteredCommands[currentCommandIndex]
    if (targetCommand?.id && scrollTargetId !== targetCommand.id) {
      setScrollTargetId(targetCommand.id)
    }
  }, [
    groupedCommands,
    currentCommandIndex,
    scrollTargetId,
    commandIndexById,
    filteredCommands,
  ])

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
        const nextIsGrouped =
          nextIndex != null && 'annotationIndex' in nextIndex

        if ('annotationIndex' in group) {
          const subCommandStartNumber = commandNumber + 1
          commandNumber += group.subCommands.length

          const rowIndex = nextRows.length
          nextRows.push({
            type: 'group',
            group,
            annotationType: annotationNames[group.annotationIndex] ?? '',
            commandStartNumber: subCommandStartNumber,
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
            filteredCommands[currentCommandIndex]?.id === command.id,
          fromGroup: false,
          commandNumber: currentCommandNumber,
        })
        nextRowIndexByCommandId.set(command.id, rowIndex)
      })
    }

    if (analysis.errors.length > 0) {
      nextRows.push({
        type: 'errors',
        errors: analysis.errors,
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
    annotationNames,
  ])

  const [listRef, listRefCallback] = useListCallbackRef()
  const [listWidth, setListWidth] = useState(0)
  const dynamicRowHeight = useDynamicRowHeight({
    defaultRowHeight: DEFAULT_ROW_HEIGHT_PX,
    key: `${listWidth}-${rows.length}`,
  })

  useEffect(() => {
    if (scrollTargetId == null) return
    const rowIndex = rowIndexByCommandId.get(scrollTargetId)
    if (rowIndex == null) return
    listRef?.scrollToRow({ index: rowIndex, align: 'auto' })
  }, [scrollTargetId, rowIndexByCommandId, listRef])

  useEffect(() => {
    setListElement(listRef?.element ?? null)
  }, [listRef])

  const handleRowsRendered = useCallback(
    ({ stopIndex }: { startIndex: number; stopIndex: number }) => {
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
      onShowErrorDetails: () => {
        setShowErrorDetailsModal(true)
      },
      t,
    }),
    [
      rows,
      analysis,
      allRunDefs,
      setSelectedCommand,
      handlePause,
      scrollTargetId,
      listElement,
      t,
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
