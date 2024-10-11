import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  InfoScreen,
  LiquidIcon,
  ListItem,
  ListItemDescriptor,
  OVERFLOW_HIDDEN,
  SPACING,
  StyledText,
} from '@opentrons/components'

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
                type="default"
                description={
                  <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing8}>
                    <LiquidIcon color={liquid.displayColor} />
                    <StyledText
                      desktopStyle="bodyDefaultRegular"
                      overflowWrap="anywhere"
                      id="liquid-name"
                      css={LIQUID_DEFINITION_TEXT}
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

const LIQUID_DEFINITION_TEXT = css`
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: ${OVERFLOW_HIDDEN};
  text-overflow: ellipsis;
`
