import * as React from 'react'
import { css } from 'styled-components'

import {
  SPACING,
  Icon,
  Flex,
  COLORS,
  BORDERS,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
  SIZE_1,
  ALIGN_CENTER,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import OT2_PNG from '../../assets/images/OT2-R_HERO.png'

interface AvailableRobotOptionProps {
  robotName: string
  robotModel: string
  local: boolean | null
  onClick: () => void
  isSelected: boolean
}
const unselectedOptionStyles = css`
  background-color: ${COLORS.white};
  border: 1px solid ${COLORS.medGrey};
  border-radius: ${BORDERS.radiusSoftCorners};
  padding: ${SPACING.spacing3};
  width: 100%;
  cursor: pointer;
`
const selectedOptionStyles = css`
  ${unselectedOptionStyles}
  border: 1px solid ${COLORS.blue};
  background-color: ${COLORS.lightBlue};
`

export function AvailableRobotOption(
  props: AvailableRobotOptionProps
): JSX.Element {
  const { robotName, robotModel, local, onClick, isSelected } = props
  return (
    <Flex
      onClick={onClick}
      css={isSelected ? selectedOptionStyles : unselectedOptionStyles}
    >
      <img
        src={OT2_PNG}
        css={css`
          width: 6rem;
        `}
      />
      <Flex
        flexDirection={DIRECTION_COLUMN}
        marginLeft={SPACING.spacing4}
        marginTop={SPACING.spacing3}
      >
        <StyledText as="h6">{robotModel}</StyledText>
        <Flex alignItems={ALIGN_CENTER}>
          <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
            {robotName}
          </StyledText>
          <Icon
            // local boolean corresponds to a wired usb connection
            aria-label={local ? 'usb' : 'wifi'}
            name={local ? 'usb' : 'wifi'}
            size={SIZE_1}
            marginLeft={SPACING.spacing3}
          />
        </Flex>
      </Flex>
    </Flex>
  )
}
