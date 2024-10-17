import { useRef, useState, useEffect } from 'react'
import styled from 'styled-components'
import {
  Flex,
  Icon,
  StyledText,
  COLORS,
  BORDERS,
  DIRECTION_COLUMN,
  SIZE_AUTO,
  SPACING,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_CENTER,
  CURSOR_POINTER,
  TEXT_ALIGN_LEFT,
  DISPLAY_FLEX,
  OVERFLOW_HIDDEN,
} from '@opentrons/components'

interface AccordionProps {
  id?: string
  handleClick: () => void
  heading: string
  isOpen?: boolean
  isCompleted?: boolean
  children: React.ReactNode
}

const ACCORDION = 'accordion'
const BUTTON = 'button'
const CONTENT = 'content'
const OT_CHECK = 'ot-check'

const AccordionContainer = styled(Flex)`
  flex-direction: ${DIRECTION_COLUMN};
  width: 100%;
  height: ${SIZE_AUTO};
  padding: ${SPACING.spacing24} ${SPACING.spacing32};
  border-radius: ${BORDERS.borderRadius16};
  background-color: ${COLORS.white};
`

const AccordionButton = styled.button<{ isOpen: boolean }>`
  display: ${DISPLAY_FLEX};
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
  align-items: ${ALIGN_CENTER};
  width: 100%;
  background: none;
  border: none;
  padding: 0;
  cursor: ${CURSOR_POINTER};
  text-align: ${TEXT_ALIGN_LEFT};

  &:focus-visible {
    outline: 2px solid ${COLORS.blue50};
  }
`

const HeadingText = styled(StyledText)`
  flex: 1;
  margin-right: ${SPACING.spacing8};
`

const AccordionContent = styled.div<{
  id: string
  isOpen: boolean
  contentHeight: number
}>`
  transition: height 0.3s ease, margin-top 0.3s ease, visibility 0.3s ease;
  overflow: ${OVERFLOW_HIDDEN};
  height: ${props => (props.isOpen ? `${props.contentHeight}px` : '0')};
  margin-top: ${props => (props.isOpen ? `${SPACING.spacing16}` : '0')};
  pointer-events: ${props => (props.isOpen ? 'auto' : 'none')};
  visibility: ${props => (props.isOpen ? 'unset' : 'hidden')};
`

export function Accordion({
  id = ACCORDION,
  handleClick,
  isOpen = false,
  isCompleted = false,
  heading = '',
  children,
}: AccordionProps): JSX.Element {
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState(0)

  useEffect(() => {
    if (contentRef.current != null) {
      setContentHeight(contentRef.current.scrollHeight)
    }
  }, [isOpen])

  return (
    <AccordionContainer id={id}>
      <AccordionButton
        id={`${id}-${BUTTON}`}
        aria-expanded={isOpen}
        aria-controls={`${id}-${CONTENT}`}
        isOpen={isOpen}
        onClick={handleClick}
      >
        <HeadingText desktopStyle="headingSmallBold">{heading}</HeadingText>
        {isCompleted && (
          <Icon
            name={OT_CHECK}
            color={COLORS.green50}
            size={'20px'}
            data-testid={`${id}-${OT_CHECK}`}
          />
        )}
      </AccordionButton>
      <AccordionContent
        id={`${id}-${CONTENT}`}
        role="region"
        aria-labelledby={`${id}-${BUTTON}`}
        isOpen={isOpen}
        contentHeight={contentHeight}
        ref={contentRef}
      >
        {children}
      </AccordionContent>
    </AccordionContainer>
  )
}
