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
import type {
  SubstepIdentifier,
  SubstepWellData,
  WellIngredientNames,
} from '../../../../steplist'

interface SubstepRowProps {
  volume: number | string | null | undefined
  ingredNames: WellIngredientNames
  stepId: string
  substepIndex: number
  source?: SubstepWellData
  dest?: SubstepWellData
  selectSubstep?: (substepIdentifier: SubstepIdentifier) => void
}

function SubstepComponent(props: SubstepRowProps): JSX.Element {
  const {
    volume,
    ingredNames,
    stepId,
    substepIndex,
    source,
    dest,
    selectSubstep: propSelectSubstep,
  } = props
  const { t } = useTranslation(['application', 'protocol_steps'])
  const compactedSourcePreIngreds = props.source
    ? compactPreIngreds(props.source.preIngreds)
    : {}

  const selectSubstep = propSelectSubstep ?? noop

  const ingredIds: string[] = Object.keys(compactedSourcePreIngreds)
  const liquidDisplayColors = useSelector(selectors.getLiquidDisplayColors)
  const noColor = ingredIds.filter(id => id !== AIR).length === 0
  const color =
    ingredIds.length === 1
      ? liquidDisplayColors[Number(ingredIds[0])] ?? swatchColors(ingredIds[0])
      : noColor
      ? COLORS.transparent
      : MIXED_WELL_COLOR

  const volumeTag = (
    <Tag
      text={`${formatVolume(volume)} ${t('units.microliter')}`}
      type="default"
    />
  )

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
      <ListItem type="noActive">
        <Flex
          gridGap={SPACING.spacing4}
          padding={SPACING.spacing12}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          width="100%"
          alignItems={ALIGN_CENTER}
        >
          <LiquidIcon color={color} size="medium" />
          {ingredIds.length > 0 ? (
            <StyledText desktopStyle="bodyDefaultRegular">
              {ingredIds.map(groupId => ingredNames[groupId]).join(',')}
            </StyledText>
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
          <LiquidIcon color={color} size="medium" />
          {ingredIds.length > 0 ? (
            <StyledText desktopStyle="bodyDefaultRegular">
              {ingredIds.map(groupId => ingredNames[groupId]).join(',')}
            </StyledText>
          ) : null}

          {dest != null ? (
            <Flex gridGap={SPACING.spacing4} alignItems={ALIGN_CENTER}>
              <StyledText desktopStyle="bodyDefaultRegular">
                {t('protocol_steps:dispensed')}
              </StyledText>
              {volumeTag}
              <StyledText desktopStyle="bodyDefaultRegular">
                {t('protocol_steps:from')}
              </StyledText>
              <DeckInfoLabel
                deckLabel={t('protocol_steps:well_name', {
                  wellName: dest.well,
                })}
              />
            </Flex>
          ) : null}
        </Flex>
      </ListItem>
    </Flex>
  )
}

export const Substep = React.memo(SubstepComponent)
