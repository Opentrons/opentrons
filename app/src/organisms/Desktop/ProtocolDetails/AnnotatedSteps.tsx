import {
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  CommandText,
  CURSOR_POINTER,
  DIRECTION_COLUMN,
  Divider,
  Flex,
  getLabwareDefinitionsFromCommands,
  Icon,
  OVERFLOW_AUTO,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { CommandIcon } from '/app/molecules/Command'

import type {
  CompletedProtocolAnalysis,
  LabwareDefinition,
  ProtocolAnalysisOutput,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type { GroupedCommands, LeafNode } from '/app/redux/protocol-storage'

interface AnnotatedStepsProps {
  analysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput
  groupedCommands: GroupedCommands | null
  currentCommandIndex?: number
  setSelectedCommand?: Dispatch<SetStateAction<string | null>>
}

export function AnnotatedSteps(props: AnnotatedStepsProps): JSX.Element {
  const {
    analysis,
    currentCommandIndex,
    groupedCommands,
    setSelectedCommand,
  } = props
  const HIDE_SCROLLBAR = css`
    ::-webkit-scrollbar {
      display: none;
    }
  `
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
  return (
    <Flex
      css={HIDE_SCROLLBAR}
      flexDirection={DIRECTION_COLUMN}
      overflowY={OVERFLOW_AUTO}
    >
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
        {groupedCommandsHighlightedInfo != null &&
        groupedCommandsHighlightedInfo.length > 0
          ? groupedCommandsHighlightedInfo.map((c, i) =>
              'annotationIndex' in c ? (
                <AnnotatedGroup
                  key={`group_${c.annotationIndex}`}
                  analysis={analysis}
                  annotationType={
                    annotations[c.annotationIndex]?.machineReadableName
                  }
                  subCommands={c.subCommands}
                  allRunDefs={allRunDefs}
                  setSelectedCommand={setSelectedCommand}
                />
              ) : (
                <IndividualCommand
                  key={c.command.id}
                  command={c.command}
                  isHighlighted={c.isHighlighted}
                  analysis={analysis}
                  allRunDefs={allRunDefs}
                  setSelectedCommand={setSelectedCommand}
                />
              )
            )
          : analysis.commands.map((c, i) => (
              <IndividualCommand
                key={`individual_${c.id}`}
                command={c}
                isHighlighted={i === currentCommandIndex}
                analysis={analysis}
                allRunDefs={allRunDefs}
                setSelectedCommand={setSelectedCommand}
              />
            ))}
        {analysis?.errors.length > 0 ? (
          <Flex
            alignItems={ALIGN_CENTER}
            gridGap={SPACING.spacing8}
            padding="0px 16px"
            flexDirection="column"
          >
            {analysis?.errors.map(error => (
              <Flex
                key={error.id}
                gridGap={SPACING.spacing4}
                width="100%"
                backgroundColor={COLORS.red20}
                borderRadius={BORDERS.borderRadius4}
                padding={SPACING.spacing8}
                alignItems="center"
                css={css`
                  transition: background-color 500ms ease-out,
                    border-color 500ms ease-out;
                `}
              >
                <Icon name="ot-alert" size="16px" color={COLORS.red60} />
                <StyledText desktopStyle="bodyDefaultRegular">
                  {error.detail}
                </StyledText>
              </Flex>
            ))}
            <Flex
              key="final_command"
              width="100%"
              backgroundColor={COLORS.grey20}
              borderRadius={BORDERS.borderRadius4}
              padding={SPACING.spacing8}
              css={css`
                transition: background-color 500ms ease-out,
                  border-color 500ms ease-out;
              `}
            >
              <StyledText desktopStyle="bodyDefaultRegular">
                Unable to show steps past errors
              </StyledText>
            </Flex>
          </Flex>
        ) : null}
      </Flex>
    </Flex>
  )
}

interface AnnotatedGroupProps {
  annotationType: string
  subCommands: LeafNode[]
  analysis: ProtocolAnalysisOutput | CompletedProtocolAnalysis
  allRunDefs: LabwareDefinition[]
  setSelectedCommand?: Dispatch<SetStateAction<string | null>>
}
function AnnotatedGroup(props: AnnotatedGroupProps): JSX.Element {
  const {
    subCommands,
    annotationType,
    analysis,
    allRunDefs,
    setSelectedCommand,
  } = props
  const [isExpanded, setIsExpanded] = useState(() =>
    subCommands.some(command => command.isHighlighted)
  )

  useEffect(() => {
    setIsExpanded(subCommands.some(command => command.isHighlighted))
  }, [subCommands])

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      width="100%"
      flexDirection="column"
      overflow="hidden"
    >
      <Flex
        onClick={() => {
          setIsExpanded(!isExpanded)
        }}
        cursor={CURSOR_POINTER}
        alignItems={ALIGN_CENTER}
        paddingX="16px"
        width="100%"
        justifyContent="space-between"
        borderBottom={`1px solid ${COLORS.grey30}`}
        flexShrink={0}
      >
        <StyledText desktopStyle="bodyDefaultRegular">
          {annotationType}
        </StyledText>
        <Icon
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size="2rem"
          color={COLORS.black90}
        />
      </Flex>

      {isExpanded ? (
        <Flex
          flexDirection="column"
          padding="8px"
          //  TODO: make max height dynamic based on
          //  amount of space left
          maxHeight="300px"
          borderBottom={`1px solid ${COLORS.grey30}`}
          overflowY={OVERFLOW_AUTO}
          gridGap={SPACING.spacing4}
          css={css`
            ::-webkit-scrollbar {
              display: none;
            }
          `}
        >
          {subCommands.map((c, i) => (
            <IndividualCommand
              key={c.command.id}
              command={c.command}
              analysis={analysis}
              isHighlighted={c.isHighlighted}
              allRunDefs={allRunDefs}
              setSelectedCommand={setSelectedCommand}
            />
          ))}
        </Flex>
      ) : null}
    </Flex>
  )
}

interface IndividualCommandProps {
  command: RunTimeCommand
  analysis: ProtocolAnalysisOutput | CompletedProtocolAnalysis
  isHighlighted: boolean
  allRunDefs: LabwareDefinition[]
  setSelectedCommand?: Dispatch<SetStateAction<string | null>>
}
function IndividualCommand({
  command,
  analysis,
  isHighlighted,
  allRunDefs,
  setSelectedCommand,
}: IndividualCommandProps): JSX.Element {
  const commandRef = useRef<HTMLDivElement | null>(null)

  const backgroundColor = isHighlighted ? COLORS.purple30 : COLORS.grey20
  const iconColor = isHighlighted ? COLORS.purple50 : COLORS.grey50

  useEffect(() => {
    if (isHighlighted && commandRef.current) {
      commandRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      })
    }
  }, [isHighlighted])

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      gridGap={SPACING.spacing8}
      padding="0px 16px"
      width="100%"
      ref={commandRef}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing4}
        width="100%"
        backgroundColor={backgroundColor}
        color={COLORS.black90}
        borderRadius={BORDERS.borderRadius4}
        padding={SPACING.spacing8}
        css={css`
          transition: background-color 500ms ease-out,
            border-color 500ms ease-out;
        `}
        cursor="pointer"
        onClick={() => {
          setSelectedCommand?.(command.id)
        }}
      >
        <Flex
          key={command.id}
          alignItems={ALIGN_CENTER}
          gridGap={SPACING.spacing8}
        >
          <CommandIcon command={command} color={iconColor} />
          <CommandText
            command={command}
            robotType={analysis?.robotType ?? FLEX_ROBOT_TYPE}
            color={COLORS.black90}
            commandTextData={analysis}
            allRunDefs={allRunDefs}
          />
        </Flex>
      </Flex>
    </Flex>
  )
}
