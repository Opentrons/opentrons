import { css } from 'styled-components'
import { BORDERS, COLORS } from '../../helix-design-system'
import { Flex } from '../../primitives'
import { fontWeightRegular } from '../../ui-style-constants/typography'
import { PrimaryButton } from '../../atoms/buttons/PrimaryButton'
import { spacing6, spacing8 } from '../../ui-style-constants/spacing'

interface ToggleGroupProps {
  leftText: string
  rightText: string
  leftClick: () => void
  rightClick: () => void
  selectedValue: string
}

export const ToggleGroup = (props: ToggleGroupProps): JSX.Element => {
  const { leftText, rightText, leftClick, rightClick, selectedValue } = props

  return (
    <Flex css={BUTTON_GROUP_STYLES} key="toggleGroup">
      <PrimaryButton
        css={selectedValue === leftText ? ACTIVE_STYLE : DEFAULT_STYLE}
        key={leftText}
        onClick={leftClick}
        data-testid="toggleGroup_leftButton"
      >
        {leftText}
      </PrimaryButton>
      <PrimaryButton
        css={selectedValue === rightText ? ACTIVE_STYLE : DEFAULT_STYLE}
        key={rightText}
        onClick={rightClick}
        data-testid="toggleGroup_rightButton"
      >
        {rightText}
      </PrimaryButton>
    </Flex>
  )
}

const BUTTON_GROUP_STYLES = css`
  border-radius: ${BORDERS.borderRadius8};
  margin-top: -1px;
  width: fit-content;

  button {
    height: 1.75rem;
    width: auto;
    font-weight: ${fontWeightRegular};
    font-size: 11px;
    line-height: 14px;
    box-shadow: none;
    padding-top: ${spacing6};
    padding-bottom: ${spacing8};
    &:focus {
      box-shadow: none;
      color: ${COLORS.white};
      background-color: ${COLORS.blue50};
    }

    &:hover {
      background-color: ${COLORS.grey10};
      color: ${COLORS.black90};
      box-shadow: 0 0 0;
    }

    &.active {
      background-color: ${COLORS.blue50};
      color: ${COLORS.white};
    }
  }

  button:first-child {
    border-radius: ${BORDERS.borderRadius8} 0 0 ${BORDERS.borderRadius8};
    border-right: none;
  }

  button:last-child {
    border-radius: 0 ${BORDERS.borderRadius8} ${BORDERS.borderRadius8} 0;
    border-left: none;
  }
`

const ACTIVE_STYLE = css`
  padding-left: ${spacing8};
  padding-right: ${spacing8};
  background-color: ${COLORS.blue50};
  color: ${COLORS.white};
  pointer-events: none;
`

const DEFAULT_STYLE = css`
  padding-left: ${spacing8};
  padding-right: ${spacing8};
  background-color: ${COLORS.white};
  color: ${COLORS.black90};
  border: 1px ${COLORS.grey30} solid;
`
