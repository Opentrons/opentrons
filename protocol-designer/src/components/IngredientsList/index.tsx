// TODO: Ian 2018-10-09 figure out what belongs in LiquidsSidebar vs IngredientsList after #2427
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { SingleLabwareLiquidState } from '@opentrons/step-generation'
import { IconButton, SidePanel, truncateString } from '@opentrons/components'
import { sortWells } from '@opentrons/shared-data'
import * as wellSelectionSelectors from '../../top-selectors/well-contents'
import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'
import { PDTitledList, PDListItem } from '../lists'
import { TitledListNotes } from '../TitledListNotes'
import { swatchColors } from '../swatchColors'
import { LabwareDetailsCard } from './LabwareDetailsCard/LabwareDetailsCard'
import styles from './IngredientsList.module.css'

import type { SelectedContainerId } from '../../labware-ingred/reducers'
import type { LiquidGroup } from '../../labware-ingred/types'
import type { ThunkDispatch } from '../../types'

type RemoveWellsContents = (args: {
  liquidGroupId: string
  wells: string[]
}) => unknown

// Props used by both IngredientsList and LiquidGroupCard
export interface CommonProps {
  removeWellsContents: RemoveWellsContents
  selected?: boolean
}

type LiquidGroupCardProps = CommonProps & {
  groupId: string
  ingredGroup: LiquidGroup
  labwareWellContents: SingleLabwareLiquidState
}

const LiquidGroupCard = (props: LiquidGroupCardProps): JSX.Element | null => {
  const {
    ingredGroup,
    removeWellsContents,
    selected,
    groupId,
    labwareWellContents,
  } = props
  const { t } = useTranslation(['card', 'application'])
  const showName = ingredGroup.serialize

  const [expanded, setExpanded] = React.useState(true)

  const toggleAccordion = (): void => setExpanded(!expanded)

  const wellsWithIngred = Object.keys(labwareWellContents)
    .sort(sortWells)
    .filter(well => labwareWellContents[well][groupId])
  const liquidDisplayColors = useSelector(
    labwareIngredSelectors.getLiquidDisplayColors
  )

  if (wellsWithIngred.length < 1) {
    // do not show liquid card if it has no instances for this labware
    return null
  }
  const truncatedName =
    ingredGroup.name != null ? truncateString(ingredGroup.name, 25) : null
  return (
    <PDTitledList
      title={truncatedName ?? t('unnamedLiquid')}
      iconProps={{
        style: {
          fill: liquidDisplayColors[Number(groupId)] ?? swatchColors(groupId),
        },
      }}
      iconName="circle"
      onCollapseToggle={toggleAccordion}
      collapsed={!expanded}
      selected={selected}
      description={<TitledListNotes notes={ingredGroup.description} />}
    >
      <PDListItem className={styles.ingredient_row_header}>
        <span>{t('well')}</span>
        <span>{t('application:units.microliter')}</span>
        {showName && <span>{t('name')}</span>}
        <span />
      </PDListItem>

      {wellsWithIngred.map((well, i) => {
        const wellIngredForCard = labwareWellContents[well][groupId]
        const volume = wellIngredForCard && wellIngredForCard.volume

        if (volume == null) {
          // TODO: Ian 2018-06-07 use assert
          console.warn(
            `Got null-ish volume for well: ${well}, ingred: ${groupId}`
          )
          return null
        }

        return (
          <IngredIndividual
            key={well}
            name={showName ? `${ingredGroup.name || ''} ${i + 1}` : null}
            wellName={well}
            canDelete
            volume={volume}
            groupId={groupId}
            removeWellsContents={removeWellsContents}
          />
        )
      })}
    </PDTitledList>
  )
}

interface IndividProps {
  name?: string | null
  wellName: string
  volume: number
  // concentration?: string,
  canDelete: boolean
  groupId: string
  removeWellsContents: RemoveWellsContents
}

function IngredIndividual(props: IndividProps): JSX.Element {
  const {
    name,
    wellName,
    volume,
    // concentration, // TODO LATER Ian 2018-02-22: concentration is removed from MVP. Remove all traces of it, or add it back in
    canDelete,
    groupId,
    removeWellsContents,
  } = props
  const { t } = useTranslation('application')
  return (
    <PDListItem border hoverable>
      <span>{wellName}</span>
      <span>{volume ? volume + ` ${t('units.microliter')}` : '-'}</span>
      {name && <span>{name}</span>}
      {canDelete && (
        <IconButton
          className={styles.close_icon}
          name="close"
          onClick={() =>
            window.confirm(t('are_you_sure_delete_well', { well: wellName })) &&
            removeWellsContents({ liquidGroupId: groupId, wells: [wellName] })
          }
        />
      )}
    </PDListItem>
  )
}

export function IngredientsList(): JSX.Element {
  const selectedLabwareId = useSelector(
    labwareIngredSelectors.getSelectedLabwareId
  )
  const allLabwareWellContents = useSelector(
    labwareIngredSelectors.getLiquidsByLabwareId
  )

  const liquidGroupsById = useSelector(
    labwareIngredSelectors.getLiquidGroupsById
  )
  const selectedIngredientGroupId = useSelector(
    wellSelectionSelectors.getSelectedWellsCommonIngredId
  )
  const { t } = useTranslation('nav')
  const dispatch = useDispatch<ThunkDispatch<any>>()

  const labwareWellContents =
    (selectedLabwareId && allLabwareWellContents[selectedLabwareId]) || {}

  const removeWellsContents = (
    labwareId?: SelectedContainerId | null
  ): void => {
    if (labwareId != null) {
      dispatch(removeWellsContents(selectedLabwareId))
    }
  }
  return (
    <SidePanel title={t('nameAndLiquids')}>
      <LabwareDetailsCard />

      {Object.keys(liquidGroupsById).map(groupIdForCard => (
        <LiquidGroupCard
          key={groupIdForCard}
          removeWellsContents={() => removeWellsContents(selectedLabwareId)}
          labwareWellContents={labwareWellContents}
          ingredGroup={liquidGroupsById[groupIdForCard]}
          groupId={groupIdForCard}
          selected={selectedIngredientGroupId === groupIdForCard}
        />
      ))}
    </SidePanel>
  )
}
