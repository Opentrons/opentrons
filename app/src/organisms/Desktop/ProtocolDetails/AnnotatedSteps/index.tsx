import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

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
import type {
  CompletedProtocolAnalysis,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'
import type { GroupedCommands } from '/app/redux/protocol-storage'

interface AnnotatedStepsProps {
  analysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput
  groupedCommands: GroupedCommands | null
  currentCommandIndex?: number
  setSelectedCommand?: Dispatch<SetStateAction<string | null>>
  handlePause?: () => void
}

export function AnnotatedSteps(props: AnnotatedStepsProps): JSX.Element {
  const {
    analysis,
    currentCommandIndex,
    groupedCommands,
    setSelectedCommand,
    handlePause,
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

  const groupedCommandsHighlightedInfo = groupedCommands?.map(node => {
    if ('annotationIndex' in node) {
      return {
        ...node,
        isHighlighted: node.subCommands.some(subNode => subNode.isHighlighted),
        subCommands: node.subCommands.map(subNode => ({
          ...subNode,
          isHighlighted:
            currentCommandIndex === analysis.commands.indexOf(subNode.command),
        })),
      }
    } else {
      return {
        ...node,
        isHighlighted:
          currentCommandIndex === analysis.commands.indexOf(node.command),
      }
    }
  })

  useEffect(() => {
    if (groupedCommands != null) {
      const flatCommands = groupedCommands.flatMap(node =>
        'subCommands' in node ? node.subCommands : [node]
      )

      const targetNode = flatCommands.find(
        node => analysis.commands.indexOf(node.command) === currentCommandIndex
      )

      if (targetNode?.command.id && scrollTargetId !== targetNode.command.id) {
        setScrollTargetId(targetNode.command.id)
      }
    }
  }, [analysis, groupedCommands, currentCommandIndex, scrollTargetId])

  let commandNumber = 0

  // temporarily filter out loadCommands and home commands for the PV MVP
  const filteredCommands = analysis.commands.filter(
    command =>
      !command.commandType.includes('load') && command.commandType !== 'home'
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
        <div className={styles.annotated_steps_wrap}>
          {groupedCommandsHighlightedInfo != null &&
          groupedCommandsHighlightedInfo.length > 0
            ? groupedCommandsHighlightedInfo.map((group, index) => {
                const nextIndex = groupedCommandsHighlightedInfo[index + 1]
                const nextIsGrouped =
                  nextIndex != null && 'annotationIndex' in nextIndex

                if ('annotationIndex' in group) {
                  const subCommandStartNumber = commandNumber + 1 // Starting number for this group
                  commandNumber += group.subCommands.length

                  return (
                    <AnnotatedGroup
                      key={`group_${group.annotationIndex}_${index}`}
                      scrollTargetId={scrollTargetId}
                      analysis={analysis}
                      annotationType={
                        annotations[group.annotationIndex]?.machineReadableName
                      }
                      subCommands={group.subCommands}
                      commandStartNumber={subCommandStartNumber}
                      allRunDefs={allRunDefs}
                      setSelectedCommand={setSelectedCommand}
                      handlePause={handlePause}
                    />
                  )
                } else {
                  const currentCommandNumber = ++commandNumber

                  return (
                    <IndividualCommand
                      scrollTargetId={scrollTargetId}
                      fromGroup={nextIsGrouped}
                      key={group.command.id}
                      command={group.command}
                      isHighlighted={group.isHighlighted}
                      analysis={analysis}
                      allRunDefs={allRunDefs}
                      setSelectedCommand={setSelectedCommand}
                      commandNumber={currentCommandNumber}
                    />
                  )
                }
              })
            : filteredCommands.map(command => {
                const currentCommandNumber = ++commandNumber
                return (
                  <IndividualCommand
                    scrollTargetId={scrollTargetId}
                    fromGroup={false}
                    key={`individual_${command.id}`}
                    command={command}
                    commandNumber={currentCommandNumber}
                    isHighlighted={
                      currentCommandIndex != null &&
                      filteredCommands[currentCommandIndex]?.id === command.id
                    }
                    analysis={analysis}
                    allRunDefs={allRunDefs}
                    setSelectedCommand={setSelectedCommand}
                  />
                )
              })}
          {analysis?.errors.length > 0 ? (
            <div className={styles.annotated_steps_error_wrapper}>
              {analysis?.errors.map(error => (
                <div
                  className={styles.annotated_steps_error_container}
                  key={error.id}
                  onClick={() => {
                    setShowErrorDetailsModal(true)
                  }}
                >
                  <div className={styles.annotated_steps_header}>
                    <Icon name="ot-alert" size="1rem" color={COLORS.red60} />
                    <StyledText desktopStyle='captionSemiBold' color={COLORS.red60}>{t('step_error')}</StyledText>
                  </div>
                  <StyledText desktopStyle="bodyDefaultRegular">
                    {error.detail}
                  </StyledText>
                </div>
              ))}
              <div className={styles.annotated_steps_final_command}>
                <StyledText desktopStyle="bodyDefaultRegular">
                  {t('unable_to_show_steps_past_errors')}
                </StyledText>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}
