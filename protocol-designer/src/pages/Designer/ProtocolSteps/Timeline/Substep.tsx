import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import noop from 'lodash/noop'
import { AIR } from '@opentrons/step-generation'
import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  DeckInfoLabel,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LiquidIcon,
  ListItem,
  SPACING,
  StyledText,
  Tag,
} from '@opentrons/components'
import { selectors } from '../../../../labware-ingred/selectors'
import {
  MIXED_WELL_COLOR,
  swatchColors,
} from '../../../../components/swatchColors'
import { compactPreIngreds, formatVolume } from './utils'
import type { AdditionalEquipmentName } from '@opentrons/step-generation'

import type {
  SubstepIdentifier,
  SubstepWellData,
  WellIngredientNames,
} from '../../../../steplist'

interface SubstepProps {
  trashName: AdditionalEquipmentName | null
  ingredNames: WellIngredientNames
  stepId: string
  substepIndex: number
  volume?: number | string | null
  source?: SubstepWellData
  dest?: SubstepWellData
  selectSubstep?: (substepIdentifier: SubstepIdentifier) => void
}

function SubstepComponent(props: SubstepProps): JSX.Element {
  const {
    volume,
    ingredNames,
    stepId,
    substepIndex,
    source,
    dest,
    trashName,
    selectSubstep: propSelectSubstep,
  } = props
  const { t } = useTranslation(['application', 'protocol_steps', 'shared'])
  const compactedSourcePreIngreds = source
    ? compactPreIngreds(source.preIngreds)
    : {}

  const selectSubstep = propSelectSubstep ?? noop

  const ingredIds: string[] = Object.keys(compactedSourcePreIngreds)
  const liquidDisplayColors = useSelector(selectors.getLiquidDisplayColors)
  const noColor = ingredIds.filter(id => id !== AIR).length === 0
  let color = MIXED_WELL_COLOR
  if (ingredIds.length === 1) {
    color =
      liquidDisplayColors[Number(ingredIds[0])] ?? swatchColors(ingredIds[0])
  } else if (noColor) {
    color = COLORS.transparent
  }

  const volumeTag = (
    <Tag
      text={`${formatVolume(volume)} ${t('units.microliter')}`}
      type="default"
    />
  )

  const isMix = source?.well === dest?.well

  return (
    <Flex
      onMouseEnter={() => {
        selectSubstep({
          stepId,
          substepIndex,
        })
      }}
      onMouseLeave={() => {
        selectSubstep(null)
      }}
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing4}
    >
      {isMix ? (
        <ListItem type="noActive">
          <Flex
            gridGap={SPACING.spacing4}
            padding={SPACING.spacing12}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            width="100%"
            alignItems={ALIGN_CENTER}
          >
            {ingredIds.length > 0 ? (
              <Flex gridGap={SPACING.spacing4} alignItems={ALIGN_CENTER}>
                <LiquidIcon color={color} size="medium" />

                <StyledText desktopStyle="bodyDefaultRegular">
                  {ingredIds.map(groupId => ingredNames[groupId]).join(',')}
                </StyledText>
              </Flex>
            ) : null}

            <Flex gridGap={SPACING.spacing4} alignItems={ALIGN_CENTER}>
              <StyledText desktopStyle="bodyDefaultRegular">
                {t('protocol_steps:mix')}
              </StyledText>
              {volumeTag}
              <StyledText desktopStyle="bodyDefaultRegular">
                {t('protocol_steps:in')}
              </StyledText>
              <DeckInfoLabel
                deckLabel={t('protocol_steps:well_name', {
                  wellName: source?.well ?? '',
                })}
              />
            </Flex>
          </Flex>
        </ListItem>
      ) : (
        <>
          <ListItem type="noActive">
            <Flex
              gridGap={SPACING.spacing4}
              padding={SPACING.spacing12}
              justifyContent={JUSTIFY_SPACE_BETWEEN}
              width="100%"
              alignItems={ALIGN_CENTER}
            >
              {ingredIds.length > 0 ? (
                <Flex gridGap={SPACING.spacing4} alignItems={ALIGN_CENTER}>
                  <LiquidIcon color={color} size="medium" />

                  <StyledText desktopStyle="bodyDefaultRegular">
                    {ingredIds.map(groupId => ingredNames[groupId]).join(',')}
                  </StyledText>
                </Flex>
              ) : null}
              {source != null ? (
                <Flex gridGap={SPACING.spacing4} alignItems={ALIGN_CENTER}>
                  <StyledText desktopStyle="bodyDefaultRegular">
                    {t('protocol_steps:aspirated')}
                  </StyledText>
                  {volumeTag}
                  <StyledText desktopStyle="bodyDefaultRegular">
                    {t('protocol_steps:from')}
                  </StyledText>
                  <DeckInfoLabel
                    deckLabel={t('protocol_steps:well_name', {
                      wellName: source.well,
                    })}
                  />
                </Flex>
              ) : null}
            </Flex>
          </ListItem>
          <ListItem type="noActive">
            <Flex
              gridGap={SPACING.spacing4}
              padding={SPACING.spacing12}
              justifyContent={JUSTIFY_SPACE_BETWEEN}
              width="100%"
              alignItems={ALIGN_CENTER}
            >
              {ingredIds.length > 0 ? (
                <Flex gridGap={SPACING.spacing4} alignItems={ALIGN_CENTER}>
                  <LiquidIcon color={color} size="medium" />
                  <StyledText desktopStyle="bodyDefaultRegular">
                    {ingredIds.map(groupId => ingredNames[groupId]).join(',')}
                  </StyledText>
                </Flex>
              ) : null}
              {dest != null || trashName != null ? (
                <Flex gridGap={SPACING.spacing4} alignItems={ALIGN_CENTER}>
                  <StyledText desktopStyle="bodyDefaultRegular">
                    {t('protocol_steps:dispensed')}
                  </StyledText>
                  {volumeTag}
                  <StyledText desktopStyle="bodyDefaultRegular">
                    {t('protocol_steps:into')}
                  </StyledText>

                  <DeckInfoLabel
                    deckLabel={
                      dest?.well != null
                        ? t('protocol_steps:well_name', {
                            wellName: dest.well,
                          })
                        : t(`shared:${trashName}`)
                    }
                  />
                </Flex>
              ) : null}
            </Flex>
          </ListItem>
        </>
      )}
    </Flex>
  )
}

export const Substep = React.memo(SubstepComponent)
