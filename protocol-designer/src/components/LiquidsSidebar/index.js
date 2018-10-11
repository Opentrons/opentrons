// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {SidePanel, swatchColors} from '@opentrons/components'
import {PDTitledList} from '../lists'

import {selectors as labwareIngredSelectors} from '../../labware-ingred/reducers'
import type {OrderedLiquids} from '../../labware-ingred/types'
import type {BaseState} from '../../types'

type Props = {
  liquids: OrderedLiquids,
  selectedLiquid: ?string,
  handleClickLiquid: (liquidId: string) => () => mixed,
}

type SP = {
  liquids: $PropertyType<Props, 'liquids'>,
  selectedLiquid: $PropertyType<Props, 'selectedLiquid'>,
}

type DP = $Diff<Props, SP>

function LiquidsSidebar (props: Props) {
  const {liquids, selectedLiquid, handleClickLiquid} = props
  return (
    <SidePanel title='Liquids'>
      {liquids.map(({ingredientId, name}) => (
        <PDTitledList
          key={ingredientId}
          selected={selectedLiquid === ingredientId}
          onClick={handleClickLiquid(ingredientId)}
          iconName='circle'
          iconProps={{style: {fill: swatchColors(Number(ingredientId))}}}
          title={name || `Unnamed Ingredient ${ingredientId}`} // fallback, should not happen
        />
      ))}
    </SidePanel>
  )
}

function mapStateToProps (state: BaseState): SP {
  return {
    liquids: labwareIngredSelectors.allIngredientNamesIds(state),
    selectedLiquid: '0', // TODO: Ian 2018-10-09 implement in #2427
  }
}

function mapDispatchToProps (dispatch: Dispatch<*>): DP {
  return {
    handleClickLiquid: (liquidId) => () => console.log('TODO: select liquid', liquidId), // TODO: Ian 2018-10-09 implement in #2427
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(LiquidsSidebar)
