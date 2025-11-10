import {
  ALIGN_CENTER,
  Box,
  Flex,
  SPACING,
  StyledText,
  Tag,
} from '@opentrons/components'

import type { LiquidEntity } from '@opentrons/step-generation'

export function getLiquidDisplay(
  liquidInfo: LiquidEntity[],
  t: any
): JSX.Element | null {
  //  filtering out liquids with no liquidEntities to prevent whitescreens
  //  when the user deletes a liquid in use
  const filteredLiquids = liquidInfo.filter(
    liquidEntity => liquidEntity != null
  )
  const liquidLength = filteredLiquids.length

  if (liquidLength === 0) {
    return null
  }

  let liquidDisplay: JSX.Element = <Box />

  if (liquidLength === 1) {
    liquidDisplay = (
      <Flex gridGap={SPACING.spacing4} alignItems={ALIGN_CENTER}>
        <StyledText desktopStyle="bodyDefaultRegular">{t('of')}</StyledText>
        <Tag
          type="default"
          text={filteredLiquids[0].displayName}
          liquidIcon={{
            color: filteredLiquids[0].displayColor,
            size: 'xSmall',
          }}
        />
      </Flex>
    )
  } else if (liquidLength === 2) {
    liquidDisplay = (
      <Flex gridGap={SPACING.spacing4} alignItems={ALIGN_CENTER}>
        <StyledText desktopStyle="bodyDefaultRegular">{t('of')}</StyledText>
        <Flex gridGap={SPACING.spacing4} alignItems={ALIGN_CENTER}>
          <Tag
            type="default"
            text={filteredLiquids[0].displayName}
            liquidIcon={{
              color: filteredLiquids[0].displayColor,
              size: 'xSmall',
            }}
          />
          {t('and')}
          <Tag
            type="default"
            text={filteredLiquids[1].displayName}
            liquidIcon={{
              color: filteredLiquids[1].displayColor,
              size: 'xSmall',
            }}
          />
        </Flex>
      </Flex>
    )
  } else if (liquidLength > 2) {
    liquidDisplay = (
      <Flex gridGap={SPACING.spacing4} alignItems={ALIGN_CENTER}>
        <StyledText desktopStyle="bodyDefaultRegular">{t('of')}</StyledText>
        <Tag type="default" text={t('liquids', { num: liquidLength })} />
      </Flex>
    )
  }
  return liquidDisplay
}
