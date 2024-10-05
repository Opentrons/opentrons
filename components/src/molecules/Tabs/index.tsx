import { css } from 'styled-components'
import { TYPOGRAPHY, SPACING, RESPONSIVENESS } from '../../ui-style-constants'
import { COLORS, BORDERS } from '../../helix-design-system'
import { POSITION_RELATIVE, DIRECTION_ROW } from '../../styles'
import { Btn, Flex } from '../../primitives'

const DEFAULT_TAB_STYLE = css`
  ${TYPOGRAPHY.pSemiBold}
  background-color: ${COLORS.purple30};
  border-radius: ${BORDERS.borderRadius8};
  padding: ${SPACING.spacing8} ${SPACING.spacing16};
  position: ${POSITION_RELATIVE};

  &:hover {
    background-color: ${COLORS.purple35};
  }

  &:focus-visible {
    outline-offset: 2px;
    outline: 2px ${BORDERS.styleSolid} ${COLORS.blue50};
  }

  &:disabled {
    background-color: ${COLORS.grey30};
    color: ${COLORS.grey40};

    &:hover {
      background-color: ${COLORS.grey30};
    }
  }

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    border-radius: ${BORDERS.borderRadius16};
    box-shadow: none;
    font-size: ${TYPOGRAPHY.fontSize22};
    font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
    line-height: ${TYPOGRAPHY.lineHeight28};
    padding: ${SPACING.spacing16} ${SPACING.spacing24};
    text-transform: ${TYPOGRAPHY.textTransformNone};

    &:focus-visible {
      outline-offset: 3px;
      outline: 2px ${BORDERS.styleSolid} ${COLORS.blue50};
    }
  }
`
const CURRENT_TAB_STYLE = css`
  ${DEFAULT_TAB_STYLE}
  color: ${COLORS.white};
  background-color: ${COLORS.purple50};

  &:hover {
    background-color: ${COLORS.purple55};
  }
`
const DEFAULT_CONTAINER_STYLE = css`
  grid-gap: ${SPACING.spacing4};
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    grid-gap: ${SPACING.spacing8};
  }
`

export interface TabProps {
  text: string
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
}

export interface TabsProps {
  tabs: TabProps[]
}

export function Tabs(props: TabsProps): JSX.Element {
  const { tabs } = props

  return (
    <Flex flexDirection={DIRECTION_ROW} css={DEFAULT_CONTAINER_STYLE}>
      {tabs.map((tab, index) => (
        <Btn
          data-testid={`tab_${index}_${tab.text}`}
          key={index}
          onClick={() => {
            tab.onClick()
          }}
          css={tab.isActive === true ? CURRENT_TAB_STYLE : DEFAULT_TAB_STYLE}
          disabled={tab.disabled}
        >
          {tab.text}
        </Btn>
      ))}
    </Flex>
  )
}
