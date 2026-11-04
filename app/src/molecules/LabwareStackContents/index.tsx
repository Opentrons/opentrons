import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { css } from 'styled-components'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  RadioButton,
  SPACING,
  StyledText,
  styleProps,
  truncateString,
} from '@opentrons/components'

import { getIsOnDevice } from '/app/redux/config'

import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type { StyleProps } from '@opentrons/components'
import type { LabwareInStack } from '@opentrons/shared-data'

const HIDE_SCROLLBAR = css`
  ::-webkit-scrollbar {
    display: none;
  }
`

const MAX_CHARS_FOR_DISPLAY_NAME_ODD = 44
const MAX_CHARS_FOR_DISPLAY_NAME_DESKTOP = 30

interface LabwareStackContentsProps extends StyleProps {
  labwareInStack: LabwareInStack[]
  selectedLabware: LabwareInStack
  setSelectedLabware: Dispatch<SetStateAction<LabwareInStack>>
}

export function LabwareStackContents(
  props: LabwareStackContentsProps
): ReactNode {
  const { labwareInStack, selectedLabware, setSelectedLabware } = props
  const isOnDevice = useSelector(getIsOnDevice)
  const { t } = useTranslation('protocol_setup')
  const MAX_CHARS = isOnDevice
    ? MAX_CHARS_FOR_DISPLAY_NAME_ODD
    : MAX_CHARS_FOR_DISPLAY_NAME_DESKTOP
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      css={HIDE_SCROLLBAR}
      overflowY="scroll"
      height="27rem"
      width={isOnDevice ? '21.875rem' : '11.688rem'}
      gap={SPACING.spacing8}
      {...styleProps}
    >
      <StyledText
        oddStyle="smallBodyTextRegular"
        desktopStyle="captionRegular"
        color={COLORS.grey60}
      >
        {t('top_of_slot')}
      </StyledText>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
        {labwareInStack.map((labware, index) => {
          const isSelected = selectedLabware.labwareId === labware.labwareId
          return (
            <RadioButton
              key={index}
              radioButtonType="small"
              buttonLabel={truncateString(labware.displayName, MAX_CHARS)}
              buttonValue={labware.labwareId}
              id={labware.labwareId}
              isSelected={isSelected}
              tagText={(labwareInStack.length - index).toString()}
              maxLines={2}
              onChange={() => {
                setSelectedLabware(labware)
              }}
              largeDesktopBorderRadius={!isOnDevice}
            />
          )
        })}
      </Flex>
      <StyledText
        oddStyle="smallBodyTextRegular"
        desktopStyle="captionRegular"
        color={COLORS.grey60}
      >
        {t('bottom_of_slot')}
      </StyledText>
    </Flex>
  )
}
