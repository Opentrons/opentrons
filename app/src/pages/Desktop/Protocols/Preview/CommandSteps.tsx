import { Dispatch, RefObject, SetStateAction } from 'react'
import ViewportList, { ViewportListRef } from 'react-viewport-list'

import {
  COLORS,
  Divider,
  Flex,
  OVERFLOW_SCROLL,
  StyledText,
} from '@opentrons/components'
import { ProtocolAnalysisOutput, RunTimeCommand } from '@opentrons/shared-data'

import { AnnotatedSteps } from '/app/organisms/Desktop/ProtocolDetails/AnnotatedSteps'
import { GroupedCommands } from '/app/redux/protocol-storage'

interface CommandStepsProps {
  //   wrapperRef: RefObject<HTMLDivElement>
  //   commandListRef: RefObject<ViewportListRef>
  //   commands: RunTimeCommand[]
  groupedCommands: GroupedCommands | null
  analysis: ProtocolAnalysisOutput
  setSelectedCommand: Dispatch<SetStateAction<string | null>>
  currentCommandIndex: number | undefined
}
export function CommandSteps(props: CommandStepsProps): JSX.Element {
  const {
    currentCommandIndex,
    groupedCommands,
    analysis,
    setSelectedCommand,
  } = props
  const commandLength = analysis.commands.length
  console.log(commandLength, currentCommandIndex)
  const percentComplete =
    currentCommandIndex != null
      ? (currentCommandIndex / commandLength) * 100
      : 0
  console.log(percentComplete)
  return (
    // <Flex
    //   ref={wrapperRef}
    //   //   alignSelf={ALIGN_STRETCH}
    //   overflowY={OVERFLOW_SCROLL}
    //   width="100%"
    // >
    //   <ViewportList
    //     viewportRef={wrapperRef}
    //     ref={commandListRef}
    //     items={commands}
    //     axis="y"
    //   >
    //     {(command, index) => (
    //       <CommandItem
    //         index={index}
    //         command={command}
    //         currentCommandIndex={currentCommandIndex}
    //         setCurrentCommandIndex={setCurrentCommandIndex}
    //         analysis={analysis}
    //         robotType={robotType ?? FLEX_ROBOT_TYPE}
    //         allRunDefs={allRunDefs}
    //       />
    //     )}
    //   </ViewportList>
    // </Flex>
    <div style={{ paddingRight: '16px', paddingBottom: '16px' }}>
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          height: '535px',
          maxHeight: '535px',
          overflowY: 'scroll',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '16px',
          }}
        >
          <StyledText desktopStyle="bodyDefaultRegular">Timeline</StyledText>
          <StyledText
            desktopStyle="bodyDefaultRegular"
            color={COLORS.grey60}
          >{`${percentComplete}% complete`}</StyledText>
        </div>
        <Divider />
        <AnnotatedSteps
          currentCommandIndex={currentCommandIndex}
          analysis={analysis}
          groupedCommands={groupedCommands}
          setSelectedCommand={setSelectedCommand}
        />
      </div>
    </div>
  )
}
