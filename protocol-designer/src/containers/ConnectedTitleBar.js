// @flow
import * as React from 'react'
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'

import {TitleBar, Icon, humanizeLabwareType, type IconName} from '@opentrons/components'
import styles from './TitleBar.css'
import i18n from '../localization'
import {START_TERMINAL_TITLE, END_TERMINAL_TITLE} from '../constants'
import {selectors as labwareIngredSelectors} from '../labware-ingred/reducers'
import {
  selectors as steplistSelectors,
  actions as steplistActions,
  END_TERMINAL_ITEM_ID,
  START_TERMINAL_ITEM_ID,
} from '../steplist'
import {selectors as fileDataSelectors} from '../file-data'
import {closeIngredientSelector} from '../labware-ingred/actions'
import {stepIconsByType} from '../form-types'
import {selectors, type Page} from '../navigation'

import type {BaseState} from '../types'

type Props = React.ElementProps<typeof TitleBar>
type DP = { onBackClick: $PropertyType<Props, 'onBackClick'> }
type SP = $Diff<Props, DP> & {
  _page: Page,
  _liquidPlacementMode?: boolean,
  _wellSelectionMode?: boolean,
}

type TitleWithIconProps = {
  iconName?: ?IconName,
  text?: ?string,
}

function TitleWithIcon (props: TitleWithIconProps) {
  const {iconName, text} = props
  return (
    <div>
      {iconName &&
        <Icon className={styles.icon} name={iconName} />}
      <div className={styles.icon_inline_text}>{text}</div>
    </div>
  )
}

function mapStateToProps (state: BaseState): SP {
  const _page = selectors.getCurrentPage(state)
  const fileName = fileDataSelectors.protocolName(state)
  const selectedStep = steplistSelectors.getSelectedStep(state)
  const selectedTerminalId = steplistSelectors.getSelectedTerminalItemId(state)
  const labware = labwareIngredSelectors.getSelectedLabware(state)
  const labwareNames = labwareIngredSelectors.getLabwareNames(state)
  const labwareNickname = labware && labware.id && labwareNames[labware.id]
  const drilledDownLabwareId = labwareIngredSelectors.getDrillDownLabwareId(state)
  const liquidPlacementMode = !!labwareIngredSelectors.getSelectedLabware(state)
  const wellSelectionLabwareKey = steplistSelectors.getWellSelectionLabwareKey(state)

  switch (_page) {
    case 'liquids':
    case 'file-splash':
    case 'file-detail':
    case 'settings-features':
    case 'settings-app':
      return {
        _page,
        title: i18n.t([`nav.title.${_page}`, fileName]),
        subtitle: i18n.t([`nav.subtitle.${_page}`, '']),
      }
    case 'steplist':
    default: {
      // NOTE: this default case error should never be reached, it's just a sanity check
      if (_page !== 'steplist') console.error('ConnectedTitleBar got an unsupported page, returning steplist instead')
      if (liquidPlacementMode) {
        return {
          _page,
          _liquidPlacementMode: liquidPlacementMode,
          title: labwareNickname || null,
          subtitle: labware && humanizeLabwareType(labware.type),
          backButtonLabel: 'Deck',
        }
      }
      let subtitle
      let backButtonLabel
      let title
      if (selectedTerminalId === START_TERMINAL_ITEM_ID) {
        subtitle = START_TERMINAL_TITLE
      } else if (selectedTerminalId === END_TERMINAL_ITEM_ID) {
        subtitle = END_TERMINAL_TITLE
        if (drilledDownLabwareId) {
          backButtonLabel = 'Deck'
          const drilledDownLabware = labwareIngredSelectors.getLabwareById(state)[drilledDownLabwareId]
          title = drilledDownLabware && drilledDownLabware.name
          subtitle = drilledDownLabware && humanizeLabwareType(drilledDownLabware.type)
        }
      } else if (selectedStep) {
        if (wellSelectionLabwareKey) { // well selection modal
          return {
            _page,
            _wellSelectionMode: true,
            title: <TitleWithIcon
              iconName={selectedStep && stepIconsByType[selectedStep.stepType]}
              text={selectedStep && selectedStep.title}
            />,
            subtitle: labwareNames[wellSelectionLabwareKey],
            backButtonLabel: 'Back',
          }
        } else {
          subtitle = selectedStep.title
        }
      }
      return { _page: 'steplist', title: title || fileName, subtitle, backButtonLabel }
    }
  }
}

function mergeProps (stateProps: SP, dispatchProps: {dispatch: Dispatch<*>}): Props {
  const {_page, _liquidPlacementMode, _wellSelectionMode, ...props} = stateProps
  const {dispatch} = dispatchProps

  let onBackClick

  if (_page === 'steplist') {
    if (_liquidPlacementMode) {
      onBackClick = () => dispatch(closeIngredientSelector())
    } else if (_wellSelectionMode) {
      onBackClick = () => dispatch(steplistActions.clearWellSelectionLabwareKey())
    } else if (props.backButtonLabel) {
      onBackClick = () => {}
    }
  }

  return {
    ...props,
    onBackClick,
  }
}

const StickyTitleBar = (props) => (
  <TitleBar {...props} className={styles.sticky_bar} />
)

export default connect(mapStateToProps, null, mergeProps)(StickyTitleBar)
