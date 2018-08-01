// @flow
import * as React from 'react'
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'

import {TitleBar, Icon, humanizeLabwareType, type IconName} from '@opentrons/components'
import styles from './TitleBar.css'
import {START_TERMINAL_TITLE, END_TERMINAL_TITLE} from '../constants'
import {selectors as labwareIngredSelectors} from '../labware-ingred/reducers'
import {
  selectors as steplistSelectors,
  END_TERMINAL_ITEM_ID,
  START_TERMINAL_ITEM_ID
} from '../steplist'
import {selectors as fileDataSelectors} from '../file-data'
import {closeIngredientSelector} from '../labware-ingred/actions'
import {stepIconsByType} from '../form-types'
import {selectors, type Page} from '../navigation'
import {closeWellSelectionModal} from '../well-selection/actions'

import type {BaseState} from '../types'

type Props = React.ElementProps<typeof TitleBar>
type DP = { onBackClick: $PropertyType<Props, 'onBackClick'> }
type SP = $Diff<Props, DP> & {_page: Page}

type TitleWithIconProps = {
  iconName?: ?IconName,
  text?: ?string
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
  const _page = selectors.currentPage(state)
  const fileName = fileDataSelectors.protocolName(state)
  const selectedStep = steplistSelectors.getSelectedStep(state)
  const selectedTerminalId = steplistSelectors.getSelectedTerminalItemId(state)
  const labware = labwareIngredSelectors.getSelectedContainer(state)
  const labwareNames = labwareIngredSelectors.getLabwareNames(state)
  const labwareNickname = labware && labware.id && labwareNames[labware.id]

  switch (_page) {
    case 'file-splash':
      return { _page, title: 'Opentrons Protocol Designer' }
    case 'file-detail':
      return {_page, title: fileName, subtitle: 'FILE DETAILS'}
    case 'ingredient-detail': {
      return {
        _page,
        title: labwareNickname,
        subtitle: labware && humanizeLabwareType(labware.type),
        backButtonLabel: 'Deck'
      }
    }
    case 'well-selection-modal':
      return {
        _page,
        title: <TitleWithIcon
          iconName={selectedStep && stepIconsByType[selectedStep.stepType]}
          text={selectedStep && selectedStep.title}
        />,
        subtitle: labwareNickname
      }
    case 'steplist':
    default: {
      // NOTE: this default case error should never be reached, it's just a sanity check
      if (_page !== 'steplist') console.error('ConnectedTitleBar got an unsupported page, returning steplist instead')
      let subtitle
      if (selectedTerminalId === START_TERMINAL_ITEM_ID) {
        subtitle = START_TERMINAL_TITLE
      } else if (selectedTerminalId === END_TERMINAL_ITEM_ID) {
        subtitle = END_TERMINAL_TITLE
      } else if (selectedStep) {
        subtitle = selectedStep.title
      }
      return { _page: 'steplist', title: fileName, subtitle }
    }
  }
}

function mergeProps (stateProps: SP, dispatchProps: {dispatch: Dispatch<*>}): Props {
  const {_page, ...props} = stateProps
  const {dispatch} = dispatchProps

  let onBackClick

  if (_page === 'ingredient-detail') {
    onBackClick = () => dispatch(closeIngredientSelector())
  }

  if (_page === 'well-selection-modal') {
    onBackClick = () => dispatch(closeWellSelectionModal())
  }

  return {
    ...props,
    onBackClick
  }
}

export default connect(mapStateToProps, null, mergeProps)(TitleBar)
