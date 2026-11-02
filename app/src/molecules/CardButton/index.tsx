import { useNavigate } from 'react-router-dom'

import {
  Btn,
  COLORS,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import styles from './cardbutton.module.css'

import type { ReactNode } from 'react'
import type { IconName } from '@opentrons/components'

interface CardButtonProps {
  /**  Header text should be less than 2 words.  */
  title: string
  /**  set an Icon */
  iconName: IconName
  /**  Subtext should be less than 3 lines.  */
  description: string
  /**  The path when clicking a card button */
  destinationPath: string
  /**  make button enabled/disabled */
  disabled?: boolean
}

export function CardButton(props: CardButtonProps): ReactNode {
  const { title, iconName, description, destinationPath, disabled } = props
  const navigate = useNavigate()

  return (
    <Btn
      onClick={() => {
        navigate(destinationPath)
      }}
      width="100%"
      className={styles.button}
      backgroundColor={disabled ? COLORS.grey35 : COLORS.blue35}
      disabled={disabled}
    >
      <Icon
        name={iconName}
        size="3.75rem"
        data-testid={`cardButton_icon_${String(iconName)}`}
        color={disabled ? COLORS.grey50 : COLORS.blue50}
      />
      <Flex marginTop={SPACING.spacing16}>
        <StyledText
          forwardedAs="h4"
          fontWeight={TYPOGRAPHY.fontWeightBold}
          color={disabled ? COLORS.grey50 : COLORS.black90}
          textAlign={TYPOGRAPHY.textAlignCenter}
        >
          {title}
        </StyledText>
      </Flex>
      <Flex
        marginTop={SPACING.spacing4}
        width="100%"
        justifyContent={JUSTIFY_CENTER}
      >
        <StyledText
          forwardedAs="p"
          fontWeight={TYPOGRAPHY.fontWeightRegular}
          color={disabled ? COLORS.grey50 : COLORS.black90}
          className={styles.description}
        >
          {description}
        </StyledText>
      </Flex>
    </Btn>
  )
}
