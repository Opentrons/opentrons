import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { List, useDynamicRowHeight, useListRef } from 'react-window'

import {
  COLORS,
  getLabwareDefinitionsFromCommands,
  Icon,
  StyledText,
} from '@opentrons/components'

import { ProtocolAnalysisErrorModal } from '../../Devices/ProtocolRun/ProtocolRunHeader/RunHeaderModalContainer/modals'
import { AnnotatedGroup } from './AnnotatedGroup'
import styles from './annotatedsteps.module.css'
import { IndividualCommand } from './IndividualCommand'

import type { Dispatch, SetStateAction } from 'react'
import type { RowComponentProps } from 'react-window'
import type {
  CompletedProtocolAnalysis,
  LabwareDefinition,
  ProtocolAnalysisError,
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
  errors: ProtocolAnalysisError[]
}

type AnnotatedStepsRow = GroupRow | CommandRow | ErrorRow

interface ItemData {
  rows: AnnotatedStepsRow[]
  analysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput
  allRunDefs: LabwareDefinition[]
  setSelectedCommand?: Dispatch<SetStateAction<string | null>>
  handlePause?: () => void
  scrollTargetId: string | null
  onShowErrorDetails: () => void
  t: (key: string) => string
}

const DEFAULT_ROW_HEIGHT_PX = 72

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

  useEffect(() => {
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
    }
  }, [groupedCommands, currentCommandIndex, scrollTargetId, commandIndexById])

  const filteredCommands = useMemo(
    () =>
      analysis.commands.filter(
        command =>
          !command.commandType.includes('load') &&
          command.commandType !== 'home'
      ),
    [analysis.commands]
  )

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

  const listRef = useListRef()
  const [listWidth, setListWidth] = useState(0)
  const dynamicRowHeight = useDynamicRowHeight({
    defaultRowHeight: DEFAULT_ROW_HEIGHT_PX,
    key: `${listWidth}-${rows.length}`,
  })

  useEffect(() => {
    if (scrollTargetId == null) return
    const rowIndex = rowIndexByCommandId.get(scrollTargetId)
    if (rowIndex == null) return
    listRef.current?.scrollToRow({ index: rowIndex, align: 'smart' })
  }, [scrollTargetId, rowIndexByCommandId])

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
          listRef={listRef}
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
          style={{ height: '100%', width: '100%' }}
        />
      </div>
    </>
  )
}

function AnnotatedStepsRowItem({
  index,
  style,
  ariaAttributes,
  ...data
}: RowComponentProps<ItemData>): JSX.Element {
  const row = data.rows[index]

  return (
    <div style={style} {...ariaAttributes}>
      <div className={styles.annotated_steps_row}>
        {row.type === 'group' ? (
          <AnnotatedGroup
            scrollTargetId={data.scrollTargetId}
            analysis={data.analysis}
            annotationType={row.annotationType}
            subCommands={row.group.subCommands}
            commandStartNumber={row.commandStartNumber}
            allRunDefs={data.allRunDefs}
            setSelectedCommand={data.setSelectedCommand}
            handlePause={data.handlePause}
          />
        ) : row.type === 'command' ? (
          <IndividualCommand
            scrollTargetId={data.scrollTargetId}
            fromGroup={row.fromGroup}
            command={row.command}
            isHighlighted={row.isHighlighted}
            analysis={data.analysis}
            allRunDefs={data.allRunDefs}
            setSelectedCommand={data.setSelectedCommand}
            commandNumber={row.commandNumber}
          />
        ) : (
          <div className={styles.annotated_steps_error_wrapper}>
            {row.errors.map(error => (
              <div
                className={styles.annotated_steps_error_container}
                key={error.id}
                onClick={() => {
                  data.onShowErrorDetails()
                }}
              >
                <div className={styles.annotated_steps_header}>
                  <Icon name="ot-alert" size="1rem" color={COLORS.red60} />
                  <StyledText
                    desktopStyle="captionSemiBold"
                    color={COLORS.red60}
                  >
                    {data.t('step_error')}
                  </StyledText>
                </div>
                <StyledText desktopStyle="bodyDefaultRegular">
                  {error.detail}
                </StyledText>
              </div>
            ))}
            <div className={styles.annotated_steps_final_command}>
              <StyledText desktopStyle="bodyDefaultRegular">
                {data.t('unable_to_show_steps_past_errors')}
              </StyledText>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
