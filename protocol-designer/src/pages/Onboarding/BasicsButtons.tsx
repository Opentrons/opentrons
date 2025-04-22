import { useTranslation } from 'react-i18next'
import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  RadioButton,
  SPACING,
  StyledText,
} from '@opentrons/components'

interface BasicButtonsProps {
  header: string
  isSelected: boolean
  onChange: (value: boolean) => void
  type: 'gripper' | 'wasteChute' | 'thermocycler'
  subHeader?: string
}

export function BasicsButtons(props: BasicButtonsProps): JSX.Element {
  const { header, onChange, isSelected, type, subHeader } = props
  const { t } = useTranslation('shared')

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing12}>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
          <StyledText desktopStyle="headingSmallBold">{header}</StyledText>
          {subHeader != null ? (
            <StyledText desktopStyle="bodyLargeRegular" color={COLORS.grey60}>
              {subHeader}
            </StyledText>
          ) : null}
        </Flex>
        <Flex gridGap={SPACING.spacing4}>
          <RadioButton
            id={`${type}_yes`}
            buttonLabel={t('yes')}
            buttonValue="yes"
            isSelected={isSelected}
            onChange={() => {
              onChange(true)
            }}
          />
          <RadioButton
            id={`${type}_no`}
            buttonLabel={t('no')}
            buttonValue="no"
            isSelected={!isSelected}
            onChange={() => {
              onChange(false)
            }}
          />
        </Flex>
      </Flex>
    </Flex>
  )
}
