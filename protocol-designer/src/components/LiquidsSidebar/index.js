// @flow
import { PrimaryButton, SidePanel, swatchColors } from '@opentrons/components'
import * as React from 'react'
import { connect } from 'react-redux'

import * as labwareIngredActions from '../../labware-ingred/actions'
import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'
import type { OrderedLiquids } from '../../labware-ingred/types'
import { i18n } from '../../localization'
import type { BaseState, ThunkDispatch } from '../../types'
import listButtonStyles from '../listButtons.css'
import { PDTitledList } from '../lists'

type SP = {|
  liquids: OrderedLiquids,
  selectedLiquid: ?string,
|}

type DP = {|
  createNewLiquid: () => mixed,
  selectLiquid: (liquidId: string) => mixed,
|}

type Props = {| ...SP, ...DP |}

function LiquidsSidebarComponent(props: Props) {
  const { liquids, selectedLiquid, createNewLiquid, selectLiquid } = props
  return (
    <SidePanel title="Liquids">
      {liquids.map(({ ingredientId, name }) => (
        <PDTitledList
          key={ingredientId}
          selected={selectedLiquid === ingredientId}
          onClick={() => selectLiquid(ingredientId)}
          iconName="circle"
          iconProps={{ style: { fill: swatchColors(Number(ingredientId)) } }}
          title={name || `Unnamed Ingredient ${ingredientId}`} // fallback, should not happen
        />
      ))}
      <div className={listButtonStyles.list_item_button}>
        <PrimaryButton iconName="water" onClick={createNewLiquid}>
          {i18n.t('button.new_liquid')}
        </PrimaryButton>
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

function mapDispatchToProps(dispatch: ThunkDispatch<*>): DP {
  return {
    selectLiquid: liquidGroupId =>
      dispatch(labwareIngredActions.selectLiquidGroup(liquidGroupId)),
    createNewLiquid: () =>
      dispatch(labwareIngredActions.createNewLiquidGroup()),
  }
}

export const LiquidsSidebar: React.AbstractComponent<{||}> = connect<
  Props,
  {||},
  SP,
  DP,
  _,
  _
>(
  mapStateToProps,
  mapDispatchToProps
)(LiquidsSidebarComponent)
