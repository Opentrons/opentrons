import { useTranslation } from 'react-i18next'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  RadioButton,
  SPACING,
  StyledText,
} from '@opentrons/components'

import type { ReactNode } from 'react'

interface BasicButtonsProps {
  header: string
  selected: boolean | null
  onChange: (value: boolean) => void
  type: 'gripper' | 'wasteChute' | 'thermocycler'
  subHeader?: string
}

export function BasicsButtons(props: BasicButtonsProps): ReactNode {
  const { header, onChange, selected, type, subHeader } = props
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
            testid={`BasicsButtons_${type}_yes`}
            buttonLabel={t('yes')}
            buttonValue="yes"
            isSelected={selected === true}
            onChange={() => {
              onChange(true)
            }}
          />
          <RadioButton
            id={`${type}_no`}
            testid={`BasicsButtons_${type}_no`}
            buttonLabel={t('no')}
            buttonValue="no"
            isSelected={selected === false}
            onChange={() => {
              onChange(false)
            }}
          />
        </Flex>
      </Flex>
    </Flex>
  )
}
