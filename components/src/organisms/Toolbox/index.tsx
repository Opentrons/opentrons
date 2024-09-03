import * as React from 'react'
import { Icon } from '../../icons'
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
import type { IconName } from '../../icons'

export interface ToolboxProps {
  title: string
  children: React.ReactNode
  confirmButtonText: string
  onConfirmClick: () => void
  onCloseClick: () => void
  closeButtonText: string
  disableCloseButton?: boolean
  width?: string
  height?: string
  titleIconName?: IconName
}

export function Toolbox(props: ToolboxProps): JSX.Element {
  const {
    title,
    children,
    confirmButtonText,
    onCloseClick,
    onConfirmClick,
    titleIconName,
    closeButtonText,
    height = '100%',
    disableCloseButton = false,
    width = '19.5rem',
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

  return (
    <Box
      cursor="auto"
      position={POSITION_FIXED}
      right="0"
      bottom="0"
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
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          alignItems={ALIGN_CENTER}
          padding={`${SPACING.spacing20} ${SPACING.spacing16}`}
          borderBottom={`1px solid ${COLORS.grey30}`}
          gridGap={SPACING.spacing12}
        >
          <Flex gridGap={SPACING.spacing8} alignItems={ALIGN_CENTER}>
            {titleIconName != null ? (
              <Icon name={titleIconName} size="1.25rem" />
            ) : null}
            <StyledText desktopStyle="bodyLargeSemiBold">{title}</StyledText>
          </Flex>
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
        </Flex>
        <Box
          padding={SPACING.spacing16}
          flex="1 1 auto"
          overflowY="auto"
          ref={slideOutRef}
          onScroll={handleScroll}
        >
          {children}
        </Box>
        <Box
          padding={SPACING.spacing16}
          boxShadow={isScrolledToBottom ? 'none' : '0px -4px 12px #0000001a'}
          zIndex={3}
          width="100%"
          borderTop={`1px solid ${COLORS.grey30}`}
          alignItems={ALIGN_CENTER}
        >
          <PrimaryButton
            width="100%"
            data-testid="Toolbox_confirmButton"
            onClick={onConfirmClick}
          >
            {confirmButtonText}
          </PrimaryButton>
        </Box>
      </Flex>
    </Box>
  )
}
