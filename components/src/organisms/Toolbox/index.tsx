import * as React from 'react'
import { Box, Btn, Flex } from '../../primitives'
import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_BETWEEN,
  NO_WRAP,
  POSITION_FIXED,
} from '../../styles'
import { BORDERS, COLORS } from '../../helix-design-system'
import { SPACING } from '../../ui-style-constants'
import { PrimaryButton, StyledText } from '../../atoms'
import { textDecorationUnderline } from '../../ui-style-constants/typography'

export interface ToolboxProps {
  title: JSX.Element
  children: React.ReactNode
  disableCloseButton?: boolean
  width?: string
  height?: string
  confirmButtonText?: string
  onConfirmClick?: () => void
  confirmButton?: JSX.Element
  onCloseClick?: () => void
  closeButtonText?: string
  side?: 'left' | 'right'
  horizontalSide?: 'top' | 'bottom'
  childrenPadding?: string
  subHeader?: JSX.Element | null
}

export function Toolbox(props: ToolboxProps): JSX.Element {
  const {
    title,
    children,
    confirmButtonText,
    onCloseClick,
    onConfirmClick,
    closeButtonText,
    height = '100%',
    disableCloseButton = false,
    width = '19.5rem',
    confirmButton,
    side = 'right',
    horizontalSide = 'bottom',
    childrenPadding = SPACING.spacing16,
    subHeader,
  } = props

  const slideOutRef = React.useRef<HTMLDivElement>(null)
  const [isScrolledToBottom, setIsScrolledToBottom] = React.useState<boolean>(
    false
  )
  const handleScroll = (): void => {
    if (slideOutRef.current == null) return
    const { scrollTop, scrollHeight, clientHeight } = slideOutRef.current
    if (scrollTop + clientHeight === scrollHeight) {
      setIsScrolledToBottom(true)
    } else {
      setIsScrolledToBottom(false)
    }
  }

  React.useEffect(() => {
    handleScroll()
  }, [slideOutRef])

  const positionStyles = {
    ...(side === 'right' && { right: '0' }),
    ...(side === 'left' && { left: '0' }),
    ...(horizontalSide === 'bottom' && { bottom: '0' }),
    ...(horizontalSide === 'top' && { top: '5rem' }),
  }

  return (
    <Box
      zIndex={10}
      cursor="auto"
      position={POSITION_FIXED}
      {...positionStyles}
      backgroundColor={COLORS.white}
      boxShadow="0px 3px 6px rgba(0, 0, 0, 0.23)"
      height={height}
      borderRadius={BORDERS.borderRadius8}
    >
      <Flex
        width={width}
        height="100%"
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <Flex
          padding={`${SPACING.spacing20} ${SPACING.spacing16}`}
          flexDirection={DIRECTION_COLUMN}
          borderBottom={`1px solid ${COLORS.grey30}`}
        >
          {subHeader != null ? subHeader : null}
          <Flex
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            alignItems={ALIGN_CENTER}
            gridGap={SPACING.spacing12}
          >
            {title}
            {onCloseClick != null && closeButtonText != null ? (
              <Btn
                onClick={onCloseClick}
                textDecoration={textDecorationUnderline}
                data-testid={`Toolbox_${closeButtonText}`}
                whiteSpace={NO_WRAP}
                disable={disableCloseButton}
              >
                <StyledText desktopStyle="bodyDefaultRegular">
                  {closeButtonText}
                </StyledText>
              </Btn>
            ) : null}
          </Flex>
        </Flex>
        <Box
          padding={childrenPadding}
          flex="1 1 auto"
          overflowY="auto"
          ref={slideOutRef}
          onScroll={handleScroll}
        >
          {children}
        </Box>
        {(onConfirmClick != null && confirmButtonText != null) ||
        confirmButton != null ? (
          <Box
            padding={SPACING.spacing16}
            boxShadow={isScrolledToBottom ? 'none' : '0px -4px 12px #0000001a'}
            zIndex={3}
            width="100%"
            borderTop={`1px solid ${COLORS.grey30}`}
            alignItems={ALIGN_CENTER}
          >
            {onConfirmClick != null && confirmButtonText != null ? (
              <PrimaryButton
                width="100%"
                data-testid="Toolbox_confirmButton"
                onClick={onConfirmClick}
              >
                {confirmButtonText}
              </PrimaryButton>
            ) : null}
            {confirmButton != null ? confirmButton : null}
          </Box>
        ) : null}
      </Flex>
    </Box>
  )
}
