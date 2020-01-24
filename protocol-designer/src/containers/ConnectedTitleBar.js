// @flow
import * as React from 'react'
import type { Dispatch } from 'redux'
import { connect } from 'react-redux'

import { TitleBar, Icon, type IconName } from '@opentrons/components'
import { getLabwareDisplayName } from '@opentrons/shared-data'
import styles from './TitleBar.css'
import { i18n } from '../localization'
import { START_TERMINAL_TITLE, END_TERMINAL_TITLE } from '../constants'
import { selectors as labwareIngredSelectors } from '../labware-ingred/selectors'
import { selectors as uiLabwareSelectors } from '../ui/labware'
import { selectors as stepFormSelectors } from '../step-forms'
import {
  getSelectedStep,
  getSelectedTerminalItemId,
  getWellSelectionLabwareKey,
  actions as stepsActions,
} from '../ui/steps'
import { END_TERMINAL_ITEM_ID, START_TERMINAL_ITEM_ID } from '../steplist'
import { selectors as fileDataSelectors } from '../file-data'
import { closeIngredientSelector } from '../labware-ingred/actions'
import { stepIconsByType } from '../form-types'
import { selectors, type Page } from '../navigation'

import type { TitleBarProps } from '@opentrons/components'
import type { BaseState } from '../types'

type Props = React.ElementProps<typeof TitleBar>

type DP = {| onBackClick: $PropertyType<Props, 'onBackClick'> |}

type SP = {|
  ...$Diff<$Exact<Props>, DP>,
  _page: Page,
  _liquidPlacementMode?: boolean,
  _wellSelectionMode?: boolean,
|}

type TitleWithIconProps = {
  iconName?: ?IconName,
  text?: ?string,
}

function TitleWithIcon(props: TitleWithIconProps) {
  const { iconName, text } = props
  return (
    <div>
      {iconName && <Icon className={styles.icon} name={iconName} />}
      <div className={styles.icon_inline_text}>{text}</div>
    </div>
  )
}

type TitleWithBetaTagProps = { text?: ?string }

const TitleWithBetaTag = (props: TitleWithBetaTagProps) => (
  <div className={styles.title_wrapper}>
    <div className={styles.icon_inline_text}>{props.text}</div>
    <div className={styles.beta_tag}>{i18n.t('application.beta')}</div>
  </div>
)

function mapStateToProps(state: BaseState): SP {
  const selectedLabwareId = labwareIngredSelectors.getSelectedLabwareId(state)
  const _page = selectors.getCurrentPage(state)
  const fileName = fileDataSelectors.protocolName(state)
  const selectedStep = getSelectedStep(state)
  const selectedTerminalId = getSelectedTerminalItemId(state)
  const labwareNames = uiLabwareSelectors.getLabwareNicknamesById(state)
  const drilledDownLabwareId = labwareIngredSelectors.getDrillDownLabwareId(
    state
  )
  const wellSelectionLabwareKey = getWellSelectionLabwareKey(state)

  // TODO(mc, 2019-06-27): µL to uL replacement needed to handle CSS capitalization
  const labwareNickname =
    selectedLabwareId != null
      ? labwareNames[selectedLabwareId].replace('µL', 'uL')
      : null
  const labwareEntity =
    selectedLabwareId != null
      ? stepFormSelectors.getLabwareEntities(state)[selectedLabwareId]
      : null
  const liquidPlacementMode = selectedLabwareId != null

  switch (_page) {
    case 'liquids':
    case 'file-detail':
      return {
        _page,
        title: i18n.t([`nav.title.${_page}`, fileName]),
        subtitle: i18n.t([`nav.subtitle.${_page}`, '']),
      }
    case 'file-splash':
    case 'settings-features':
    case 'settings-app':
      return {
        _page,
        title: (
          <TitleWithBetaTag text={i18n.t([`nav.title.${_page}`, fileName])} />
        ),
        subtitle: i18n.t([`nav.subtitle.${_page}`, '']),
      }
    case 'steplist':
    default: {
      // NOTE: this default case error should never be reached, it's just a sanity check
      if (_page !== 'steplist')
        console.error(
          'ConnectedTitleBar got an unsupported page, returning steplist instead'
        )
      if (liquidPlacementMode) {
        return {
          _page,
          _liquidPlacementMode: liquidPlacementMode,
          title: labwareNickname,
          // TODO(mc, 2019-06-27): µL to uL replacement needed to handle CSS capitalization
          subtitle:
            labwareEntity &&
            getLabwareDisplayName(labwareEntity.def).replace('µL', 'uL'),
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
          const labwareDef = stepFormSelectors.getLabwareEntities(state)[
            drilledDownLabwareId
          ].def
          const nickname = uiLabwareSelectors.getLabwareNicknamesById(state)[
            drilledDownLabwareId
          ]
          // TODO(mc, 2019-06-27): µL to uL replacement needed to handle CSS capitalization
          title = nickname.replace('µL', 'uL')
          subtitle =
            labwareDef && getLabwareDisplayName(labwareDef).replace('µL', 'uL')
        }
      } else if (selectedStep) {
        if (wellSelectionLabwareKey) {
          // well selection modal
          return {
            _page,
            _wellSelectionMode: true,
            title: (
              <TitleWithIcon
                iconName={
                  selectedStep && stepIconsByType[selectedStep.stepType]
                }
                text={selectedStep && selectedStep.title}
              />
            ),
            subtitle: labwareNames[wellSelectionLabwareKey],
            backButtonLabel: 'Back',
          }
        } else {
          subtitle = selectedStep.title
        }
      }
      return {
        _page: 'steplist',
        title: title || fileName || '',
        subtitle,
        backButtonLabel,
      }
    }
  }
}

function mergeProps(
  stateProps: SP,
  dispatchProps: { dispatch: Dispatch<*> }
): Props {
  const {
    _page,
    _liquidPlacementMode,
    _wellSelectionMode,
    ...props
  } = stateProps
  const { dispatch } = dispatchProps

  let onBackClick

  if (_page === 'steplist') {
    if (_liquidPlacementMode) {
      onBackClick = () => dispatch(closeIngredientSelector())
    } else if (_wellSelectionMode) {
      onBackClick = () => dispatch(stepsActions.clearWellSelectionLabwareKey())
    } else if (props.backButtonLabel) {
      onBackClick = () => {}
    }
  }

  return {
    ...props,
    onBackClick,
  }
}

const StickyTitleBar = (props: TitleBarProps) => (
  <TitleBar {...props} className={styles.sticky_bar} />
)

export const ConnectedTitleBar = connect<Props, {||}, SP, {||}, _, _>(
  mapStateToProps,
  null,
  mergeProps
)(StickyTitleBar)
