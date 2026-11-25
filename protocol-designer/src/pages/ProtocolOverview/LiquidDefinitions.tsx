import { useTranslation } from 'react-i18next'
import { clsx } from 'clsx'

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
  Tag,
} from '@opentrons/components'

import lineClampStyles from '/protocol-designer/styles/lineclamp.module.css'

import { getLiquidClassDisplayName } from '../../liquid-defs/utils'

import type { ReactNode } from 'react'
import type {
  AllIngredGroupFields,
  IngredInputs,
} from '../../labware-ingred/types'

const getLiquidDescription = (liquid: IngredInputs): JSX.Element | null => {
  const { description, liquidClass } = liquid
  const liquidClassDisplayName = getLiquidClassDisplayName(liquidClass ?? null)
  const liquidClassInfo =
    liquidClassDisplayName == null ? null : (
      <Tag text={liquidClassDisplayName} type="default" shrinkToContent />
    )

  return liquidClassInfo == null && !description ? null : (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
      {description ? (
        <StyledText
          desktopStyle="bodyDefaultRegular"
          className={clsx(
            lineClampStyles.line_clamp,
            lineClampStyles.word_break_all
          )}
          style={{ WebkitLineClamp: 10 }}
        >
          {description}
        </StyledText>
      ) : null}
      {liquidClassInfo}
    </Flex>
  )
}

interface LiquidDefinitionsProps {
  allIngredientGroupFields: AllIngredGroupFields
}

export function LiquidDefinitions({
  allIngredientGroupFields,
}: LiquidDefinitionsProps): ReactNode {
  const { t } = useTranslation('protocol_overview')

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing12}>
      <StyledText desktopStyle="headingSmallBold">
        {t('liquid_defs')}
      </StyledText>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
        {Object.keys(allIngredientGroupFields).length > 0 ? (
          Object.values(allIngredientGroupFields).map((liquid, index) => {
            return (
              <ListItem
                type="default"
                key={`${liquid.displayName}_${liquid.displayColor}`}
              >
                <ListItemDescriptor
                  type="large"
                  description={
                    <Flex
                      alignItems={ALIGN_CENTER}
                      gridGap={SPACING.spacing8}
                      minWidth="13.75rem"
                      width="13.75rem"
                    >
                      <LiquidIcon color={liquid.displayColor} />
                      <StyledText
                        desktopStyle="bodyDefaultRegular"
                        id="liquid-name"
                        className={clsx(
                          lineClampStyles.line_clamp,
                          lineClampStyles.word_break_all
                        )}
                        style={{ WebkitLineClamp: 3 }}
                      >
                        {liquid.displayName}
                      </StyledText>
                    </Flex>
                  }
                  content={
                    getLiquidDescription(liquid) ?? (
                      <StyledText
                        desktopStyle="bodyDefaultRegular"
                        alignSelf={ALIGN_CENTER}
                      >
                        {t('na')}
                      </StyledText>
                    )
                  }
                />
              </ListItem>
            )
          })
        ) : (
          <InfoScreen content={t('no_liquids_defined')} />
        )}
      </Flex>
    </Flex>
  )
}
