import {
  ALIGN_CENTER,
  COLORS,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  ListItem,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import type { ReactNode } from 'react'

type DispenseSettingOption =
  | {
      option: string
      copy: any
      value: any
      enabled: boolean
      onClick: () => void
    }
  | {
      option: string
      copy: any
      enabled: boolean
      onClick: () => void
      value?: undefined
    }

interface DispenseSettingItemProps {
  displayItem: DispenseSettingOption
}

export function DispenseSettingItem({
  displayItem,
}: DispenseSettingItemProps): ReactNode {
  return (
    <ListItem
      type="default"
      key={displayItem.option}
      onClick={displayItem.onClick}
    >
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} width="100%">
        <StyledText
          oddStyle="level4HeaderSemiBold"
          width="20rem"
          color={displayItem.enabled ? COLORS.black90 : COLORS.grey50}
        >
          {displayItem.copy}
        </StyledText>
        <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing8}>
          <StyledText
            oddStyle="level4HeaderRegular"
            color={displayItem.enabled ? COLORS.grey60 : COLORS.grey50}
            textAlign={TYPOGRAPHY.textAlignRight}
          >
            {displayItem.value}
          </StyledText>
          {displayItem.enabled ? <Icon name="more" size="2rem" /> : null}
        </Flex>
      </Flex>
    </ListItem>
  )
}
