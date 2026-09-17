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
import type { SettingItem } from '../types'

interface AspirateSettingItemProps {
  displayItem: SettingItem
}

export function AspirateSettingItem({
  displayItem,
}: AspirateSettingItemProps): ReactNode {
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
