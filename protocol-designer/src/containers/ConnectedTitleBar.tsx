import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'

import { TitleBar, Icon, IconName } from '@opentrons/components'
import { getLabwareDisplayName } from '@opentrons/shared-data'
import styles from './TitleBar.css'
import { START_TERMINAL_TITLE, END_TERMINAL_TITLE } from '../constants'
import { selectors as labwareIngredSelectors } from '../labware-ingred/selectors'
import { selectors as uiLabwareSelectors } from '../ui/labware'
import { selectors as stepFormSelectors } from '../step-forms'
import {
  getSelectedStepTitleInfo,
  getSelectedTerminalItemId,
  getWellSelectionLabwareKey,
  actions as stepsActions,
} from '../ui/steps'
import { END_TERMINAL_ITEM_ID, START_TERMINAL_ITEM_ID } from '../steplist'
import { selectors as fileDataSelectors } from '../file-data'
import { closeIngredientSelector } from '../labware-ingred/actions'
import { stepIconsByType } from '../form-types'
import { selectors } from '../navigation'
interface TitleWithIconProps {
  iconName: IconName | null | undefined
  text: string | null | undefined
}

function TitleWithIcon(props: TitleWithIconProps): JSX.Element {
  const { iconName, text } = props
  return (
    <div>
      {iconName && <Icon className={styles.icon} name={iconName} />}
      <div className={styles.icon_inline_text}>{text}</div>
    </div>
  )
}

interface TitleProps {
  text: string | null | undefined
}

const Title = (props: TitleProps): JSX.Element => (
  <div className={styles.title_wrapper}>
    <div className={styles.icon_inline_text}>{props.text}</div>
  </div>
)

export const ConnectedTitleBar = (): JSX.Element => {
  const { t } = useTranslation(['nav', 'application'])
  const dispatch = useDispatch()
  const selectedLabwareId = useSelector(
    labwareIngredSelectors.getSelectedLabwareId
  )
  const _page = useSelector(selectors.getCurrentPage)
  const labwareNicknamesById = useSelector(
    uiLabwareSelectors.getLabwareNicknamesById
  )
  const fileName = useSelector(fileDataSelectors.protocolName)
  const labwareEntities = useSelector(stepFormSelectors.getLabwareEntities)
  const selectedStepInfo = useSelector(getSelectedStepTitleInfo)
  const selectedTerminalId = useSelector(getSelectedTerminalItemId)
  const labwareNames = useSelector(uiLabwareSelectors.getLabwareNicknamesById)
  const drilledDownLabwareId = useSelector(
    labwareIngredSelectors.getDrillDownLabwareId
  )
  const wellSelectionLabwareKey = useSelector(getWellSelectionLabwareKey)

  // TODO(mc, 2019-06-27): µL to uL replacement needed to handle CSS capitalization
  const labwareNickname =
    selectedLabwareId != null
      ? labwareNames[selectedLabwareId].replace('µL', 'uL')
      : null
  const labwareEntity =
    selectedLabwareId != null ? labwareEntities[selectedLabwareId] : null

  const liquidPlacementMode = selectedLabwareId != null

  let title: React.ReactNode = <></>
  let subtitle: string | null = null
  let backButtonLabel: string | undefined
  let _wellSelectionMode: boolean = false
  let _liquidPlacementMode: boolean = false

  switch (_page) {
    case 'liquids':
    case 'file-detail': {
      title = <>{t([`title.${_page}`, fileName])}</>
      subtitle = t([`subtitle.${_page}`, ''])
      break
    }
    case 'file-splash':
    case 'settings-features':
    case 'settings-app': {
      title = <Title text={t([`title.${_page}`, fileName])} />
      subtitle = t([`subtitle.${_page}`, ''])
      break
    }
    case 'steplist':
    default: {
      // NOTE: this default case error should never be reached, it's just a sanity check
      if (_page !== 'steplist')
        console.error(
          'ConnectedTitleBar got an unsupported page, returning steplist instead'
        )
      if (liquidPlacementMode) {
        _liquidPlacementMode = liquidPlacementMode
        title = labwareNickname
        // TODO(mc, 2019-06-27): µL to uL replacement needed to handle CSS capitalization
        subtitle =
          labwareEntity &&
          getLabwareDisplayName(labwareEntity.def).replace('µL', 'uL')
        backButtonLabel = 'Deck'
      }

      if (selectedTerminalId === START_TERMINAL_ITEM_ID) {
        subtitle = START_TERMINAL_TITLE
      } else if (selectedTerminalId === END_TERMINAL_ITEM_ID) {
        subtitle = END_TERMINAL_TITLE
        if (drilledDownLabwareId) {
          backButtonLabel = 'Deck'
          const labwareDef = labwareEntities[drilledDownLabwareId].def
          const nickname = labwareNicknamesById[drilledDownLabwareId]
          // TODO(mc, 2019-06-27): µL to uL replacement needed to handle CSS capitalization
          title = nickname.replace('µL', 'uL')
          subtitle =
            labwareDef && getLabwareDisplayName(labwareDef).replace('µL', 'uL')
        }
      } else if (selectedStepInfo) {
        const stepTitle =
          selectedStepInfo.stepName ||
          t(`application:stepType.${selectedStepInfo.stepType}`)
        if (wellSelectionLabwareKey) {
          // well selection modal
          _wellSelectionMode = true
          title = (
            <TitleWithIcon
              iconName={stepIconsByType[selectedStepInfo.stepType]}
              text={stepTitle}
            />
          )

          subtitle = labwareNames[wellSelectionLabwareKey]
          backButtonLabel = 'Back'
        } else {
          subtitle = stepTitle
        }
      }
    }
  }

  let onBackClick

  if (_page === 'steplist') {
    if (_liquidPlacementMode) {
      onBackClick = () => dispatch(closeIngredientSelector())
    } else if (_wellSelectionMode) {
      onBackClick = () => dispatch(stepsActions.clearWellSelectionLabwareKey())
    } else if (backButtonLabel) {
      onBackClick = () => {}
    }
  }
  return (
    <TitleBar
      id="TitleBar_main"
      title={title}
      subtitle={subtitle}
      backButtonLabel={backButtonLabel}
      onBackClick={onBackClick}
      className={styles.sticky_bar}
    />
  )
}
