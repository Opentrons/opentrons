import * as React from 'react'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import { ViewportList, ViewportListRef } from 'react-viewport-list'

import {
  Flex,
  DIRECTION_ROW,
  COLORS,
  SPACING,
  Icon,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
  JUSTIFY_SPACE_BETWEEN,
  Btn,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  DISPLAY_FLEX,
  BORDERS,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import { CommandText } from '../../CommandText'

import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'
import { CommandIcon } from '../../RunPreview/CommandIcon'

const COMMAND_ROW_STYLE = css`
  font-size: 1.375rem;
  line-height: 1.75rem;
  font-weight: ${TYPOGRAPHY.fontWeightRegular}
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
`

interface RunningProtocolCommandListProps {
  currentRunStatus: string
  protocolName?: string
  playRun: () => void
  pauseRun: () => void
  stopRun: () => void
  currentRunCommandIndex?: number
  robotSideAnalysis: CompletedProtocolAnalysis | null
}

export function RunningProtocolCommandList({
  currentRunStatus,
  protocolName,
  currentRunCommandIndex,
  robotSideAnalysis,
}: RunningProtocolCommandListProps): JSX.Element {
  const viewPortRef = React.useRef<HTMLDivElement | null>(null)
  const ref = React.useRef<ViewportListRef>(null)

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacingXXL}>
      <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        gridGap={SPACING.spacingXXL}
      >
        <Flex flexDirection={DIRECTION_COLUMN} gridGap="0.25rem">
          <StyledText fontSize="1.75rem" lineHeight="2.25rem" fontWeight="700">
            {currentRunStatus}
          </StyledText>
          <StyledText fontSize="2rem" color={COLORS.darkGreyEnabled}>
            {protocolName}
          </StyledText>
        </Flex>
        <Flex gridGap="1.5rem">
          <StopButton onStop={() => console.log('stop')} />
          <PauseButton onPause={() => console.log('pause')} />
        </Flex>
      </Flex>
      {robotSideAnalysis != null ? (
        <Flex
          ref={viewPortRef}
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing3}
        >
          <ViewportList
            viewportRef={viewPortRef}
            ref={ref}
            items={robotSideAnalysis?.commands}
            initialIndex={0}
          >
            {(command, index) => {
              const backgroundColor =
                index === currentRunCommandIndex
                  ? COLORS.foundationalBlue
                  : COLORS.light_one
              return (
                <Flex
                  key={command.id}
                  alignItems={ALIGN_CENTER}
                  gridGap={SPACING.spacing3}
                >
                  <Flex
                    padding={`0.75rem ${SPACING.spacing5}`}
                    alignItems={ALIGN_CENTER}
                    // gridGap={SPACING.spacing4}
                    backgroundColor={backgroundColor}
                    width="100%"
                    fontSize="1.375rem"
                    lineHeight="1.75rem"
                    fontWeight={TYPOGRAPHY.fontWeightRegular}
                    borderRadius={BORDERS.size_two}
                  >
                    <CommandIcon command={command} />
                    <CommandText
                      command={command}
                      robotSideAnalysis={robotSideAnalysis}
                      css={COMMAND_ROW_STYLE}
                    />
                  </Flex>
                </Flex>
              )
            }}
          </ViewportList>
        </Flex>
      ) : null}
      {/* <Flex gridGap="1rem">
          <Flex
            backgroundColor={COLORS.fundamentalsBackgroundShade}
            padding="0.25rem 0.5rem"
          >
            {`Run: ${createdAtTimestamp}`}
          </Flex>
          <Flex
            backgroundColor={COLORS.fundamentalsBackgroundShade}
            padding="0.25rem 0.5rem"
            textTransform={TYPOGRAPHY.textTransformCapitalize}
          >
            {`${t('status')}: ${runStatus}`}
          </Flex>
        </Flex> */}
      {/* </Flex> */}
    </Flex>
  )
}

interface StopButtonProps {
  onStop: () => void
}
const StopButton = ({ onStop }: StopButtonProps): JSX.Element => {
  return (
    <Btn
      alignItems={ALIGN_CENTER}
      backgroundColor={COLORS.red_two}
      borderRadius="50%"
      display={DISPLAY_FLEX}
      height="6.25rem"
      justifyContent={JUSTIFY_CENTER}
      width="6.25rem"
      // onClick={onClose}
      aria-label="close"
    >
      <Icon name="close" color={COLORS.white} size="5rem" />
    </Btn>
  )
}

interface PauseButtonProps {
  onPause: () => void
}
const PauseButton = ({ onPause }: PauseButtonProps): JSX.Element => {
  return (
    <Btn
      alignItems={ALIGN_CENTER}
      backgroundColor={COLORS.blueEnabled}
      borderRadius="50%"
      display={DISPLAY_FLEX}
      height="6.25rem"
      justifyContent={JUSTIFY_CENTER}
      width="6.25rem"
      // onClick={onPause}
      aria-label="pause"
    >
      <Icon name="pause" color={COLORS.white} size="2.5rem" />
    </Btn>
  )
}
