// @flow
import * as React from 'react'
import omit from 'lodash/omit'
import reduce from 'lodash/reduce'
import {connect} from 'react-redux'
import {
  swatchColors,
  Labware,
  LabwareLabels,
  MIXED_WELL_COLOR,
  type Channels,
} from '@opentrons/components'

import {getCollidingWells} from '../../utils'
import {SELECTABLE_WELL_CLASS} from '../../constants'
import {getWellSetForMultichannel} from '../../well-selection/utils'
import SelectionRect from '../SelectionRect.js'
import type {ContentsByWell, Wells} from '../../labware-ingred/types'

import * as wellContentsSelectors from '../../top-selectors/well-contents'
import {selectors} from '../../labware-ingred/reducers'
import {selectors as steplistSelectors} from '../../steplist'
import type {GenericRect} from '../../collision-types'
import type {BaseState} from '../../types'

type LabwareProps = React.ElementProps<typeof Labware>

export type Props = {
  wellContents: ContentsByWell,
  getTipProps?: $PropertyType<LabwareProps, 'getTipProps'>,
  containerType: string,
  updateSelectedWells: (Wells) => mixed,

  // used by container
  containerId: string,
  pipetteChannels?: ?Channels,
}

// TODO Ian 2018-07-20: make sure '__air__' or other pseudo-ingredients don't get in here
function getFillColor (groupIds: Array<string>): ?string {
  if (groupIds.length === 0) return null
  if (groupIds.length === 1) return swatchColors(Number(groupIds[0]))
  return MIXED_WELL_COLOR
}

class SelectableLabware extends React.Component<Props, State> {
  constructor (props) {
    super(props)
    const initialSelectedWells = reduce(this.props.wellContents, (acc, well) => (
      well.highlighted ? {...acc, [well]: well} : acc
    ), {})
    this.state = {selectedWells: initialSelectedWells, highlightedWells: {}}
  }

  _getWellsFromRect = (rect: GenericRect): * => {
    const selectedWells = getCollidingWells(rect, SELECTABLE_WELL_CLASS)
    return this._wellsFromSelected(selectedWells)
  }

  _wellsFromSelected = (selectedWells: Wells): Wells => {
    // Returns PRIMARY WELLS from the selection.
    if (this.props.pipetteChannels === 8) {
      // for the wells that have been highlighted,
      // get all 8-well well sets and merge them
      const primaryWells: Wells = Object.keys(selectedWells).reduce((acc: Wells, well: string): Wells => {
        const wellSet = getWellSetForMultichannel(this.props.containerType, well)
        if (!wellSet) return acc

        const primaryWell = wellSet[0]

        return { ...acc, [primaryWell]: primaryWell }
      }, {})

      return primaryWells
    }

    // single-channel or ingred selection mode
    return selectedWells
  }

  handleSelectionMove = (e, rect) => {
    if (!e.shiftKey) {
      this.setState({highlightedWells: this._getWellsFromRect(rect)})
    }
  }
  handleSelectionDone = (e, rect) => {
    const wells = this._getWellsFromRect(rect)
    const nextSelectedWells = e.shiftKey
      ? omit(this.state.selectedWells, Object.keys(wells))
      : {...this.state.selectedWells, ...wells}
    this.setState({selectedWells: nextSelectedWells, highlightedWells: {}})
    this.props.updateSelectedWells(nextSelectedWells)
  }

  render () {
    const {wellContents, getTipProps, containerType} = this.props

    const getWellProps = (wellName) => {
      const well = wellContents[wellName]

      return {
        selectable: true,
        wellName,
        highlighted: Object.keys(this.state.highlightedWells).includes(wellName),
        selected: Object.keys(this.state.selectedWells).includes(wellName),
        error: well.error,
        maxVolume: well.maxVolume,
        fillColor: getFillColor(well.groupIds),
      }
    }

    return (
      <SelectionRect svg onSelectionMove={this.handleSelectionMove} onSelectionDone={this.handleSelectionDone}>
        <Labware labwareType={containerType} getWellProps={getWellProps} getTipProps={getTipProps} />
        <LabwareLabels labwareType={containerType} />
      </SelectionRect>
    )
  }
}

type SP = $Diff<Props, MP>

function mapStateToProps (state: BaseState, ownProps: OP): SP {
  // const {selectable} = ownProps
  const selectedContainerId = selectors.getSelectedContainerId(state)
  const containerId = ownProps.containerId || selectedContainerId

  if (containerId === null) {
    console.error('SelectablePlate: No container is selected, and no containerId was given to Connected SelectablePlate')
    return {containerId: '', wellContents: {}, containerType: ''}
  }

  const labware = selectors.getLabware(state)[containerId]
  const allWellContentsForSteps = wellContentsSelectors.allWellContentsForSteps(state)
  let wellContents: ContentsByWell = {}

  const stepId = steplistSelectors.getActiveItem(state).id
  // TODO: Ian 2018-07-31 replace with util function, "findIndexOrNull"?
  const orderedSteps = steplistSelectors.orderedSteps(state)
  const timelineIdx = orderedSteps.includes(stepId)
    ? orderedSteps.findIndex(id => id === stepId)
    : null

  if ((timelineIdx != null)) {
    wellContents = (allWellContentsForSteps[timelineIdx])
      // Valid non-end step
      ? allWellContentsForSteps[timelineIdx][containerId]
      // Erroring step: show last valid well contents in timeline
      : wellContentsSelectors.lastValidWellContents(state)[containerId]
  }

  return {
    containerId,
    wellContents,
    containerType: labware ? labware.type : 'missing labware',
  }
}

export default connect(mapStateToProps)(SelectableLabware)
