import * as React from 'react'
import { Icon, IconName } from '../../icons'
import { Box, Btn, Flex } from '../../primitives'
import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_BETWEEN,
  POSITION_FIXED,
} from '../../styles'
import { BORDERS, COLORS } from '../../helix-design-system'
import { SPACING } from '../../ui-style-constants'
import { PrimaryButton, StyledText } from '../../atoms'
import { textDecorationUnderline } from '../../ui-style-constants/typography'

export interface ToolboxProps {
  header: string
  children: React.ReactNode
  doneButtonText: string
  onCloseClick: () => void
  headerIconName: IconName
  exitButtonText?: string
  width?: string
}

export const Toolbox = (props: ToolboxProps): JSX.Element => {
  const {
    header,
    children,
    doneButtonText,
    onCloseClick,
    headerIconName,
    exitButtonText,
    width = '19.5rem',
  } = props

  const slideOutRef = React.useRef<HTMLDivElement>(null)
  const [isReachedBottom, setIsReachedBottom] = React.useState<boolean>(false)
  const handleScroll = (): void => {
    if (slideOutRef.current == null) return
    const { scrollTop, scrollHeight, clientHeight } = slideOutRef.current
    if (scrollTop + clientHeight === scrollHeight) {
      setIsReachedBottom(true)
    } else {
      setIsReachedBottom(false)
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
      top="0"
      backgroundColor={COLORS.white}
      boxShadow="0px 3px 6px rgba(0, 0, 0, 0.23)"
      height="100%"
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
        >
          <Flex gridGap={SPACING.spacing2} alignItems={ALIGN_CENTER}>
            <Icon name={headerIconName} size="20px" />
            <StyledText desktopStyle="bodyLargeSemiBold">{header}</StyledText>
          </Flex>

          <Btn
            onClick={onCloseClick}
            textDecoration={textDecorationUnderline}
            data-testid={`Toolbox_${exitButtonText}`}
          >
            <StyledText desktopStyle="bodyDefaultRegular">
              {exitButtonText}
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
          boxShadow={isReachedBottom ? 'none' : '0px -4px 12px #0000001a'}
          zIndex="3"
          width="100%"
          borderTop={`1px solid ${COLORS.grey30}`}
          alignItems={ALIGN_CENTER}
        >
          <PrimaryButton
            width="100%"
            data-testid="Toolbox_doneButton"
            onClick={onCloseClick}
          >
            {doneButtonText}
          </PrimaryButton>
        </Box>
      </Flex>
    </Box>
  )
}
