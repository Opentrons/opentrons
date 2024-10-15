import styled from 'styled-components'
import { Flex, Icon, StyledText, COLORS, BORDERS } from '@opentrons/components'

interface AccordionProps {
  handleClick: () => void
  heading: string
  isOpen: boolean
  isCompleted: boolean
  children: React.ReactNode
}

const AccordionContainer = styled(Flex)`
  flex-direction: column;
  width: 100%;
  height: auto;
  padding: 24px 32px;
  border-radius: ${BORDERS.borderRadius16};
  border: 1px solid black;
`

const AccordionHeader = styled.button<{ isOpen: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: ${props => (props.isOpen ? '16px' : 0)};
  background: none;
  border: none;
  padding: 0;
  cursor: ${props => (props.isOpen ? 'unset' : 'pointer')};
  text-align: left;

  &:focus {
    outline: 2px solid ${COLORS.blue50};
  }
`

export function Accordion({
  handleClick,
  isOpen,
  isCompleted,
  heading,
  children,
}: AccordionProps): JSX.Element {
  return (
    <AccordionContainer>
      <AccordionHeader isOpen={isOpen} onClick={handleClick}>
        <StyledText desktopStyle="headingSmallBold">{heading}</StyledText>
        {isCompleted && (
          <Icon
            name="ot-check"
            color={COLORS.green50}
            size={'20px'}
            data-testid="accordion-ot-check"
          />
        )}
      </AccordionHeader>
      {isOpen && children}
      {/* not sure if we should add the confirm button here */}
    </AccordionContainer>
  )
}
