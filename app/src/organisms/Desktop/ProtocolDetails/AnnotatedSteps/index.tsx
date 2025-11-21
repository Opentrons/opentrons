import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  COLORS,
  getLabwareDefinitionsFromCommands,
  Icon,
  StyledText,
} from '@opentrons/components'

import { AnnotatedGroup } from './AnnotatedGroup'
import styles from './annotatedsteps.module.css'
import { IndividualCommand } from './IndividualCommand'

import type { Dispatch, SetStateAction } from 'react'
import type {
  CompletedProtocolAnalysis,
  ProtocolAnalysisOutput,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type { GroupedCommands } from '/app/redux/protocol-storage'

interface AnnotatedStepsProps {
  analysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput
  groupedCommands: (GroupedCommands & { id: string }) | null
  currentCommandIndex?: number
  setSelectedCommand?: Dispatch<SetStateAction<string | null>>
  handlePause?: () => void
  searchQuery?: string
}

export function AnnotatedSteps(props: AnnotatedStepsProps): JSX.Element {
  const {
    analysis,
    currentCommandIndex,
    groupedCommands,
    setSelectedCommand,
    handlePause,
    searchQuery = '',
  } = props
  const { t } = useTranslation(['protocol_command_text', 'shared'])
  const [scrollTargetId, setScrollTargetId] = useState<string | null>(null)
  const isValidRobotSideAnalysis = analysis != null

  // Ensure a JSX.Element is always returned if analysis fails
  if (!analysis) {
    return (
      <div className={styles.annotatedStepsContainer}>
        <StyledText color={COLORS.red60}>
          {t('shared:analysis_not_found')}
        </StyledText>
      </div>
    )
  }
  
  const allRunDefs = useMemo(
    () =>
      analysis != null
        ? getLabwareDefinitionsFromCommands(analysis.commands)
        : [],
    [isValidRobotSideAnalysis]
  )

  // --- 1. ADVANCED LOOKUP MAPS (Labware Name & Slot) ---
  const labwareCtx = useMemo(() => {
    if (!analysis || !analysis.labware) return { names: {}, locations: {} }
    
    const names: Record<string, string> = {}
    const locations: Record<string, string> = {}

    analysis.labware.forEach(item => {
      if (item.id) {
        // Store Display Name
        if (item.displayName) names[item.id] = item.displayName
        
        // Store Location
        if (item.location != null && typeof item.location === 'object') {
          if ('slotName' in item.location) {
             // Legacy slot definition
             locations[item.id] = `Slot ${item.location.slotName}`
          } else if ('addressableAreaName' in item.location) {
             // Modern slot definition (e.g., "D1")
             locations[item.id] = `Slot ${item.location.addressableAreaName}`
          } else if ('moduleId' in item.location) {
             // Labware is on top of a module; resolve module location
             const modId = item.location.moduleId
             const mod = analysis.modules.find(m => m.id === modId)
             if (mod && mod.location && typeof mod.location === 'object' && 'slotName' in mod.location) {
               locations[item.id] = `Slot ${mod.location.slotName}`
             }
          }
        }
      }
    })
    return { names, locations }
  }, [analysis])

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

  const filteredCommands = analysis.commands.filter(
    command =>
      !command.commandType.includes('load') && command.commandType !== 'home'
  )

  // --- 2. SEARCH LOGIC ---
  const doesCommandMatch = (
    command: RunTimeCommand,
    query: string
  ): boolean => {
    if (!query) return true
    const q = query.toLowerCase()
    
    // DETECT NUMERIC SEARCH
    const isNumericSearch = !isNaN(parseFloat(query)) && isFinite(Number(query))

    // A. Search Comments (Highest Priority)
    // @ts-expect-error: checking optional comment properties
    if (command.params?.comment?.toLowerCase().includes(q)) return true
    // @ts-expect-error: checking optional legacy properties
    if (command.params?.legacyCommandText?.toLowerCase().includes(q)) return true

    // B. Search Parameters (Volume, Rates, Labware, Slots)
    if ('params' in command && command.params) {
      const params = command.params as Record<string, unknown>

      // B1. Search Formatted Numbers & Units
      const numericFields = ['volume', 'flowRate', 'x', 'y', 'z', 'celsius']
      for (const field of numericFields) {
        if (typeof params[field] === 'number') {
          const val = params[field] as number
          const fixed = val.toFixed(2)
          
          // Check raw number: "10.50"
          if (fixed.includes(q)) return true
          
          // Check with units
          if (`${fixed} ul`.includes(q) || `${fixed} µl`.includes(q)) return true
          if (`${fixed} ul/sec`.includes(q) || `${fixed} µl/sec`.includes(q)) return true
        }
      }
      
      // B2. Search Labware Names & Slots
      if (params.labwareId && typeof params.labwareId === 'string') {
        const id = params.labwareId
        if (labwareCtx.names[id]?.toLowerCase().includes(q)) return true
        if (labwareCtx.locations[id]?.toLowerCase().includes(q)) return true
      }
    }

    // C. Search Raw Data (Sanitized)
    // Only run if NOT numeric search (prevent finding "45" in random IDs)
    if (!isNumericSearch) {
      // We construct a "clean" object excluding IDs to prevent partial UUID matches 
      // (e.g. preventing "a1" search from matching "11d8a1..." in a labware UUID)
      const cleanParams: Record<string, unknown> = {}
      
      if ('params' in command && command.params) {
        const params = command.params as Record<string, unknown>
        Object.keys(params).forEach(key => {
          // SKIP IDs: labwareId, pipetteId, moduleId, etc. are mostly noise 
          // containing random hex characters like "c2" or "a1".
          if (key.endsWith('Id') || key === 'id') return
          
          // SKIP Noise Wells: Don't match A1 for dropTip/pickUpTip
          if (key === 'wellName' && (command.commandType === 'dropTip' || command.commandType === 'pickUpTip')) return
          
          cleanParams[key] = params[key]
        })
      }
      
      // We only search the clean params and the command type
      const cleanCommand = { commandType: command.commandType, params: cleanParams }

      if (JSON.stringify(cleanCommand).toLowerCase().includes(q)) {
        return true
      }
    }

    // D. Search "Generated" UI Verbs
    const verbMap: Record<string, string> = {
      aspirate: 'aspirating',
      dispense: 'dispensing',
      blowout: 'blowing out',
      dropTip: 'dropping tip',
      pickUpTip: 'picking up tip',
      moveToWell: 'moving',
      moveToCoordinates: 'moving',
      moveRelative: 'moving',
      thermocycler: 'thermocycler',
      heaterShaker: 'heater shaker',
      temperatureModule: 'temperature module',
      magneticModule: 'magnetic module',
      delay: 'pausing',
      comment: 'comment',
    }
    const userFacingText = verbMap[command.commandType]
    if (userFacingText && userFacingText.includes(q)) return true

    // E. Edge Case: "Calculating position..."
    if (command.commandType === 'pickUpTip') {
      if (!command.params?.wellName) {
        if ("calculating position".includes(q)) return true
      }
    }

    return false
  }

  return (
    <div className={styles.annotated_steps_container}>
      <div className={styles.annotated_steps_wrap}>
        {groupedCommandsHighlightedInfo != null &&
        groupedCommandsHighlightedInfo.length > 0
          ? groupedCommandsHighlightedInfo.map((group, index) => {
              const nextIndex = groupedCommandsHighlightedInfo[index + 1]
              const nextIsGrouped =
                nextIndex != null && 'annotationIndex' in nextIndex

              if ('annotationIndex' in group) {
                const subCommandStartNumber = commandNumber + 1
                commandNumber += group.subCommands.length
                
                const annotationTitle = annotations[group.annotationIndex]?.machineReadableName
                const isTitleMatch = annotationTitle?.toLowerCase().includes(searchQuery.toLowerCase())

                const matchingSubCommands = group.subCommands.filter(sub => 
                   doesCommandMatch(sub.command, searchQuery)
                )

                if (!isTitleMatch && matchingSubCommands.length === 0) {
                  return null
                }

                const subCommandsDisplay = isTitleMatch ? group.subCommands : matchingSubCommands

                return (
                  <AnnotatedGroup
                    key={`group_${group.annotationIndex}_${index}`}
                    scrollTargetId={scrollTargetId}
                    analysis={analysis}
                    annotationType={annotationTitle}
                    subCommands={subCommandsDisplay}
                    commandStartNumber={subCommandStartNumber}
                    allRunDefs={allRunDefs}
                    setSelectedCommand={setSelectedCommand}
                    handlePause={handlePause}
                  />
                )
              } else {
                const currentCommandNumber = ++commandNumber
                
                if (!doesCommandMatch(group.command, searchQuery)) {
                  return null
                }

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
              
              if (!doesCommandMatch(command, searchQuery)) {
                return null
              }

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
          <div className={styles.annotated_steps_error_container}>
            {analysis?.errors.map(error => (
              <div
                className={styles.annotated_steps_error_header}
                key={error.id}
              >
                <Icon name="ot-alert" size="1rem" color={COLORS.red60} />
                <StyledText desktopStyle="bodyDefaultRegular">
                  {error.detail}
                </StyledText>
              </div>
            ))}
            <div className={styles.annotated_steps_final_command}>
              <StyledText desktopStyle="bodyDefaultRegular">
                Unable to show steps past errors
              </StyledText>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}