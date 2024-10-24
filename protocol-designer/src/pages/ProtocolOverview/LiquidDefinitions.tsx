import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  InfoScreen,
  LiquidIcon,
  ListItem,
  ListItemDescriptor,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { LINE_CLAMP_TEXT_STYLE } from '../../atoms'

import type { AllIngredGroupFields } from '../../labware-ingred/types'

interface LiquidDefinitionsProps {
  allIngredientGroupFields: AllIngredGroupFields
}

export function LiquidDefinitions({
  allIngredientGroupFields,
}: LiquidDefinitionsProps): JSX.Element {
  const { t } = useTranslation('protocol_overview')
  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing12}>
      <StyledText desktopStyle="headingSmallBold">
        {t('liquid_defs')}
      </StyledText>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
        {Object.keys(allIngredientGroupFields).length > 0 ? (
          Object.values(allIngredientGroupFields).map((liquid, index) => (
            <ListItem
              type="noActive"
              key={`${liquid.name}_${liquid.displayColor}_${index}`}
            >
              <ListItemDescriptor
                type="large"
                description={
                  <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing8}>
                    <LiquidIcon color={liquid.displayColor} />
                    <StyledText
                      desktopStyle="bodyDefaultRegular"
                      overflowWrap="anywhere"
                      id="liquid-name"
                      css={LINE_CLAMP_TEXT_STYLE(3)}
                    >
                      {liquid.name}
                    </StyledText>
                  </Flex>
                }
                content={liquid.description ?? t('na')}
              />
            </ListItem>
          ))
        ) : (
          <InfoScreen content={t('no_liquids_defined')} />
        )}
      </Flex>
    </Flex>
  )
}
