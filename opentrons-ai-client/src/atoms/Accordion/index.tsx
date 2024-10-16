import { useRef, useState, useEffect } from 'react'
import styled from 'styled-components'
import { Flex, Icon, StyledText, COLORS, BORDERS } from '@opentrons/components'

interface AccordionProps {
  id: string
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
  flex-direction: column;
  width: 100%;
  height: auto;
  padding: 24px 32px;
  border-radius: ${BORDERS.borderRadius16};
  background-color: ${COLORS.white};
`

const AccordionButton = styled.button<{ isOpen: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;

  &:focus-visible {
    outline: 2px solid ${COLORS.blue50};
  }
`

const HeadingText = styled(StyledText)`
  flex: 1;
  margin-right: 8px;
`

const AccordionContent = styled.div<{
  id: string
  isOpen: boolean
  contentHeight: number
}>`
  transition: height 0.3s ease, margin-top 0.3s ease, visibility 0.3s ease;
  overflow: hidden;
  height: ${props => (props.isOpen ? `${props.contentHeight}px` : '0')};
  margin-top: ${props => (props.isOpen ? '16px' : '0')};
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
