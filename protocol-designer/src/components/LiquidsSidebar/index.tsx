import * as React from 'react'
import { connect } from 'react-redux'
import { i18n } from '../../localization'
import {
  DeprecatedPrimaryButton,
  SidePanel,
  truncateString,
} from '@opentrons/components'
import { PDTitledList } from '../lists'
import { swatchColors } from '../swatchColors'
import listButtonStyles from '../listButtons.css'

import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'
import { OrderedLiquids } from '../../labware-ingred/types'
import * as labwareIngredActions from '../../labware-ingred/actions'
import { BaseState, ThunkDispatch } from '../../types'

import styles from './styles.css'

interface SP {
  liquids: OrderedLiquids
  selectedLiquid?: string | null
}

interface DP {
  createNewLiquid: () => unknown
  selectLiquid: (liquidId: string) => unknown
}

type Props = SP & DP

function LiquidsSidebarComponent(props: Props): JSX.Element {
  const { liquids, selectedLiquid, createNewLiquid, selectLiquid } = props
  return (
    <SidePanel title="Liquids">
      {liquids.map(({ ingredientId, name, displayColor }) => (
        <PDTitledList
          key={ingredientId}
          selected={selectedLiquid === ingredientId}
          onClick={() => selectLiquid(ingredientId)}
          iconName="circle"
          iconProps={{
            style: {
              fill: displayColor ?? swatchColors(ingredientId),
            },
            ...{
              className: styles.liquid_icon_container,
            },
          }}
          title={
            truncateString(name ?? '', 25) ??
            `Unnamed Ingredient ${ingredientId}`
          } // fallback, should not happen
        />
      ))}
      <div className={listButtonStyles.list_item_button}>
        <DeprecatedPrimaryButton iconName="water" onClick={createNewLiquid}>
          {i18n.t('button.new_liquid')}
        </DeprecatedPrimaryButton>
      </div>
    </SidePanel>
  )
}

function mapStateToProps(state: BaseState): SP {
  const selectedLiquidGroup = labwareIngredSelectors.getSelectedLiquidGroupState(
    state
  )
  return {
    liquids: labwareIngredSelectors.allIngredientNamesIds(state),
    selectedLiquid: selectedLiquidGroup && selectedLiquidGroup.liquidGroupId,
  }
}

function mapDispatchToProps(dispatch: ThunkDispatch<any>): DP {
  return {
    selectLiquid: liquidGroupId =>
      dispatch(labwareIngredActions.selectLiquidGroup(liquidGroupId)),
    createNewLiquid: () =>
      dispatch(labwareIngredActions.createNewLiquidGroup()),
  }
}

export const LiquidsSidebar = connect(
  mapStateToProps,
  mapDispatchToProps
)(LiquidsSidebarComponent)
