import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { clsx } from 'clsx'

import {
  ALIGN_CENTER,
  ALIGN_FLEX_END,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  Divider,
  Flex,
  Icon,
  LiquidIcon,
  ListButton,
  SPACING,
  StyledText,
  Tag,
  TEXT_DECORATION_UNDERLINE,
} from '@opentrons/components'

import { removeWellsContents } from '/protocol-designer/labware-ingred/actions'
import { selectors as labwareIngredSelectors } from '/protocol-designer/labware-ingred/selectors'
import { getLabwareEntities } from '/protocol-designer/step-forms/selectors'
import lineClampStyles from '/protocol-designer/styles/lineclamp.module.css'
import * as wellContentsSelectors from '/protocol-designer/top-selectors/well-contents'

import { WellContents } from './WellContents'

import type { ReactNode } from 'react'
import type { SelectedContainerId } from '/protocol-designer/labware-ingred/reducers'
import type { LiquidInfo } from './LiquidToolbox'

interface LiquidCardProps {
  info: LiquidInfo
}

export function LiquidCard({ info }: LiquidCardProps): ReactNode {
  const { name, color, liquidClassDisplayName, liquidIndex } = info
  const { t } = useTranslation('liquids')
  const dispatch = useDispatch()
  const [isExpanded, setIsExpanded] = useState<boolean>(false)
  const labwareId = useSelector(labwareIngredSelectors.getSelectedLabwareId)
  const selectedLabwareIds = useSelector(
    labwareIngredSelectors.getSelectedLabwareIds
  )
  const labwareEntities = useSelector(getLabwareEntities)
  const selectedLabwareDef =
    labwareId != null ? labwareEntities[labwareId] : null
  const liquidsWithDescriptions = useSelector(
    labwareIngredSelectors.allIngredientGroupFields
  )
  const orderedWells = selectedLabwareDef?.def.ordering.flat() ?? []
  const allWellContentsForActiveItem = useSelector(
    wellContentsSelectors.getAllWellContentsForActiveItem
  )
  const wellContents =
    allWellContentsForActiveItem != null && labwareId != null
      ? allWellContentsForActiveItem[labwareId]
      : null
  const liquidsInLabware =
    wellContents != null
      ? Object.values(wellContents).flatMap(content => content.groupIds)
      : null
  const uniqueLiquids = Array.from(new Set(liquidsInLabware))

  const fullWellsByLiquid = uniqueLiquids.reduce<Record<string, string[]>>(
    (acc, liq) => {
      if (allWellContentsForActiveItem != null && labwareId != null) {
        const wellContents = allWellContentsForActiveItem[labwareId] ?? {}
        Object.entries(wellContents).forEach(([wellName, well]) => {
          const { groupIds } = well
          if (groupIds.includes(liq)) {
            if (liq in acc) {
              acc[liq] = [...acc[liq], wellName]
            } else {
              acc[liq] = [wellName]
            }
          }
        })
      }
      return acc
    },
    {}
  )

  const handleClearLiquid = (
    labwareId: SelectedContainerId,
    wells: string[]
  ): void => {
    if (labwareId != null) {
      dispatch(
        removeWellsContents({
          labwareId: selectedLabwareIds ?? labwareId,
          wells,
        })
      )
    } else {
      console.error('Could not clear selected liquid - no labware ID')
    }
  }

  return (
    <ListButton
      type="noActive"
      flexDirection={DIRECTION_COLUMN}
      key={name}
      onClick={() => {
        setIsExpanded(prev => !prev)
      }}
      padding="0"
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        padding={SPACING.spacing12}
        gridGap={SPACING.spacing4}
      >
        <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing16}>
          <LiquidIcon color={color} size="medium" />
          <Flex
            flexDirection={DIRECTION_COLUMN}
            width="12.375rem"
            gridGap={SPACING.spacing4}
          >
            <StyledText
              desktopStyle="bodyDefaultSemiBold"
              className={clsx(
                lineClampStyles.line_clamp,
                lineClampStyles.word_break_all
              )}
              style={{ WebkitLineClamp: 3 }}
            >
              {name}
            </StyledText>
            {liquidClassDisplayName != null ? (
              <Tag
                text={liquidClassDisplayName}
                type="default"
                shrinkToContent
              />
            ) : null}
            <StyledText
              desktopStyle="bodyDefaultRegular"
              className={clsx(
                lineClampStyles.line_clamp,
                lineClampStyles.word_break_all
              )}
              style={{ WebkitLineClamp: 3 }}
            >
              {info.liquidIndex != null
                ? liquidsWithDescriptions[info.liquidIndex].description
                : null}
            </StyledText>
          </Flex>
          <Flex>
            <Icon
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size="2rem"
            />
          </Flex>
        </Flex>
        <Btn
          onClick={() => {
            if (labwareId != null) {
              handleClearLiquid(labwareId, fullWellsByLiquid[info.liquidIndex])
            }
          }}
          alignSelf={ALIGN_FLEX_END}
        >
          <StyledText
            desktopStyle="bodyDefaultRegular"
            textDecoration={TEXT_DECORATION_UNDERLINE}
          >
            {t('delete')}
          </StyledText>
        </Btn>
      </Flex>
      {isExpanded ? (
        <>
          <Divider borderColor={COLORS.grey40} />
          <Flex
            flexDirection={DIRECTION_COLUMN}
            padding={`${SPACING.spacing8} ${SPACING.spacing12} ${SPACING.spacing12}`}
          >
            <Flex gridGap={SPACING.spacing4} color={COLORS.grey60}>
              <StyledText width="50%" desktopStyle="bodyDefaultRegular">
                {t('well')}
              </StyledText>
              <Flex width="50%">
                <StyledText desktopStyle="bodyDefaultRegular">
                  {t('microliters')}
                </StyledText>
              </Flex>
            </Flex>
            <Divider borderColor={COLORS.grey40} />
            {info.liquidIndex != null
              ? fullWellsByLiquid[info.liquidIndex]
                  ?.sort((a, b) =>
                    orderedWells.indexOf(b) > orderedWells.indexOf(a) ? -1 : 1
                  )
                  .map((wellName, wellliquidIndex) => {
                    const volume =
                      wellContents != null
                        ? wellContents[wellName].ingreds[liquidIndex].volume
                        : 0
                    return (
                      <>
                        <WellContents wellName={wellName} volume={volume} />
                        {wellliquidIndex <
                        fullWellsByLiquid[liquidIndex].length - 1 ? (
                          <Divider borderColor={COLORS.grey40} />
                        ) : null}
                      </>
                    )
                  })
              : null}
          </Flex>
        </>
      ) : null}
    </ListButton>
  )
}
