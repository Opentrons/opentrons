// @flow
import React from 'react'
import {connect} from 'react-redux'

import {Deck} from '@opentrons/components'

import IngredientSelectionModal from '../components/IngredientSelectionModal.js'
import LabwareContainer from '../containers/LabwareContainer.js'
import LabwareDropdown from '../containers/LabwareDropdown.js'

import {closeIngredientSelector} from '../labware-ingred/actions'
import {selectors} from '../labware-ingred/reducers'
import {selectors as steplistSelectors} from '../steplist/reducers'

const ingredSelModIsVisible = activeModals => activeModals.ingredientSelection && activeModals.ingredientSelection.slot

// TODO Ian 2017-12-04 make proper component
const ConnectedIngredSelModal = connect(
  state => ({
    visible: ingredSelModIsVisible(selectors.activeModals(state)) // TODO Ian 2018-02-16 does `visible` prop do anything?
  }),
  {
    onClose: closeIngredientSelector
  }
)(IngredientSelectionModal)

function mapStateToProps (state) {
  return {
    deckSetupMode: steplistSelectors.deckSetupMode(state)
  }
}

// TODO Ian 2018-02-16 this will be broken apart and incorporated into ProtocolEditor
function DeckSetup (props: {deckSetupMode: boolean}) {
  if (!props.deckSetupMode) {
    // Temporary quickfix: if we're not in deck setup mode,
    // hide the labware dropdown and ingredient selection modal
    return <Deck LabwareComponent={LabwareContainer} />
  }
  return (
    <div>
      <LabwareDropdown />
      <ConnectedIngredSelModal />
      <Deck LabwareComponent={LabwareContainer} />
    </div>
  )
}

export default connect(mapStateToProps, () => ({}))(DeckSetup)
