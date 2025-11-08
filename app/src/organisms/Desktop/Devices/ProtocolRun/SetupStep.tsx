import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  NO_WRAP,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import type { ReactNode } from 'react'

interface SetupStepProps {
  /** whether or not to show the full contents of the step */
  expanded: boolean
  /** always shown text name of the step */
  title: ReactNode
  /** always shown text that provides a one sentence explanation of the contents */
  description: string
  /* element to be shown beneath the description, if any. */
  descriptionElement: ReactNode
  /** callback that should toggle the expanded state (managed by parent) */
  toggleExpanded: () => void
  /** contents to be shown only when expanded */
  children: ReactNode
  /** element to be shown (right aligned) regardless of expanded state */
  rightElement: ReactNode
}

export function SetupStep({
  expanded,
  title,
  description,
  descriptionElement,
  toggleExpanded,
  children,
  rightElement,
}: SetupStepProps): JSX.Element {
  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Btn textAlign={TYPOGRAPHY.textAlignLeft}>
        <Flex
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
        >
          <Flex
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            width="100%"
            onClick={toggleExpanded}
            gridGap={SPACING.spacing40}
          >
            <Flex flexDirection={DIRECTION_COLUMN} gap={SPACING.spacing4}>
              <StyledText
                color={COLORS.black90}
                desktopStyle="bodyLargeSemiBold"
                id={`CollapsibleStep_${String(title)}`}
              >
                {title}
              </StyledText>
              <StyledText
                desktopStyle="bodyDefaultRegular"
                color={COLORS.black90}
                id={`CollapsibleStep_${description}`}
              >
                {description}
              </StyledText>
              {descriptionElement}
            </Flex>
            <Flex css={RIGHT_CONTENT_CONTAINER_STYLE}>
              {rightElement}
              <Icon
                color={COLORS.black90}
                size="1.5rem"
                css={ACCORDION_STYLE}
                name={expanded ? 'minus' : 'plus'}
                margin={SPACING.spacing4}
              />
            </Flex>
          </Flex>
        </Flex>
      </Btn>
      <div
        css={expanded ? EXPANDED_STYLE : COLLAPSED_STYLE}
        onTransitionEnd={e => {
          // HACK:
          // There's some kind of Chromium bug where, when the section expands,
          // the contents will sometimes be left only partially painted, i.e. partially
          // missing. They'll remain that way until something like a screen resize
          // happens to force a repaint. It seems to happen more when there are
          // performance problems (dropped frames and partially-presented frames) and
          // when the section contents land partially below the fold.
          forceRepaint(e.currentTarget)
        }}
      >
        {children}
      </div>
    </Flex>
  )
}

const EXPANDED_STYLE = css`
  interpolate-size: allow-keywords;
  overflow: hidden;

  visibility: visible;
  height: auto;
  transition:
    height 300ms ease-in,
    visibility 300ms step-start;
`
const COLLAPSED_STYLE = css`
  interpolate-size: allow-keywords;
  overflow: hidden;

  visibility: hidden;
  height: 0;
  transition:
    height 500ms ease-out,
    visibility 500ms step-end;
`
const ACCORDION_STYLE = css`
  border-radius: 50%;
  &:hover {
    background: ${COLORS.grey30};
  }
  &:active {
    background: ${COLORS.grey35};
  }
`

const RIGHT_CONTENT_CONTAINER_STYLE = css`
  align-items: ${ALIGN_CENTER};
  text-wrap: ${NO_WRAP};
`

// https://stackoverflow.com/questions/3485365
function forceRepaint(element: HTMLElement): void {
  element.style.display = 'none'
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  element.offsetHeight // no need to store this anywhere, the reference is enough
  element.style.display = ''
}
