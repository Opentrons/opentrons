// TODO: Ian 2018-10-09 figure out what belongs in LiquidsSidebar vs IngredientsList after #2427
import * as React from 'react'
import { useSelector } from 'react-redux'
import { SingleLabwareLiquidState } from '@opentrons/step-generation'
import { IconButton, SidePanel, truncateString } from '@opentrons/components'
import { sortWells } from '@opentrons/shared-data'
import { i18n } from '../../localization'
import { selectors } from '../../labware-ingred/selectors'
import { PDTitledList, PDListItem } from '../lists'
import { TitledListNotes } from '../TitledListNotes'
import { swatchColors } from '../swatchColors'
import { LabwareDetailsCard } from './LabwareDetailsCard'
import { LiquidGroupsById, LiquidGroup } from '../../labware-ingred/types'
import styles from './IngredientsList.css'

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

  const showName = ingredGroup.serialize

  const [expanded, setExpanded] = React.useState(true)

  const toggleAccordion = (): void => setExpanded(!expanded)

  const wellsWithIngred = Object.keys(labwareWellContents)
    .sort(sortWells)
    .filter(well => labwareWellContents[well][groupId])
  const liquidDisplayColors = useSelector(selectors.getLiquidDisplayColors)

  if (wellsWithIngred.length < 1) {
    // do not show liquid card if it has no instances for this labware
    return null
  }
  const truncatedName =
    ingredGroup.name != null ? truncateString(ingredGroup.name, 25) : null
  return (
    <PDTitledList
      title={truncatedName ?? i18n.t('card.unnamedLiquid')}
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
        <span>{i18n.t('card.well')}</span>
        <span>{i18n.t('application.units.microliter')}</span>
        {showName && <span>{i18n.t('card.name')}</span>}
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

  return (
    <PDListItem border hoverable>
      <span>{wellName}</span>
      <span>
        {volume ? volume + ` ${i18n.t('application.units.microliter')}` : '-'}
      </span>
      {name && <span>{name}</span>}
      {canDelete && (
        <IconButton
          className={styles.close_icon}
          name="close"
          onClick={() =>
            window.confirm(
              `Are you sure you want to delete well ${wellName} ?`
            ) &&
            removeWellsContents({ liquidGroupId: groupId, wells: [wellName] })
          }
        />
      )}
    </PDListItem>
  )
}

type Props = CommonProps & {
  liquidGroupsById: LiquidGroupsById
  labwareWellContents: SingleLabwareLiquidState
  selectedIngredientGroupId?: string | null
}

export function IngredientsList(props: Props): JSX.Element {
  const {
    labwareWellContents,
    liquidGroupsById,
    removeWellsContents,
    selectedIngredientGroupId,
  } = props

  return (
    <SidePanel title={i18n.t('nav.nameAndLiquids')}>
      <LabwareDetailsCard />

      {Object.keys(liquidGroupsById).map(groupIdForCard => (
        <LiquidGroupCard
          key={groupIdForCard}
          removeWellsContents={removeWellsContents}
          labwareWellContents={labwareWellContents}
          ingredGroup={liquidGroupsById[groupIdForCard]}
          groupId={groupIdForCard}
          selected={selectedIngredientGroupId === groupIdForCard}
        />
      ))}
    </SidePanel>
  )
}
