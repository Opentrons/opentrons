import React from 'react'
import { OutlineButton } from '@opentrons/components'
import { i18n } from '../localization'
import styles from './FlexProtocolEditor/FlexComponents.css'
import { StyledText } from './FlexProtocolEditor/StyledText'
import { actions as loadFileActions } from '../load-file'
import { MapDispatchToPropsParam, connect, useDispatch } from 'react-redux'
import { ThunkDispatch } from '../types'
import { actions as navActions } from '../navigation'
import { setRobotType } from '../load-file/actions'
import {
  OT2_STANDARD_DECKID,
  OT2_STANDARD_MODEL,
  OT3_STANDARD_DECKID,
  OT3_STANDARD_MODEL,
} from '@opentrons/shared-data'

type Props = React.ComponentProps<typeof LandingPage>
export interface PageProps {
  setPageProps: (type: string) => void
}

function LandingPage(props: {
  goToOT3FilePage: () => void
  goToOT2FilePage: () => void
}): JSX.Element {
  const { goToOT3FilePage, goToOT2FilePage } = props
  const dispatch = useDispatch()

  return (
    <div className={styles.pd_landing_page}>
      <StyledText as="h1">{i18n.t('flex.landing_page.welcome')}</StyledText>
      <img
        className={styles.ot_flex_logo}
        src={require('../images/ot_logo.png')}
      />
      <div className={styles.flex_landing_buttons_wrapper}>
        <OutlineButton
          className={styles.flex_landing_button}
          onClick={() => goToOT3FilePage()}
        >
          <StyledText as="h4">
            {i18n.t('flex.landing_page.create_flex_protocol')}
          </StyledText>
        </OutlineButton>
        <OutlineButton
          className={styles.flex_landing_button}
          onClick={() => goToOT2FilePage()}
        >
          <StyledText as="h4">
            {i18n.t('flex.landing_page.create_ot2_protocol')}
          </StyledText>
        </OutlineButton>
        <OutlineButton Component="label" className={styles.flex_landing_button}>
          <StyledText as="h4">
            {i18n.t('flex.landing_page.import_protocol')}
          </StyledText>
          <input
            type="file"
            onChange={fileChangeEvent => {
              dispatch(loadFileActions.loadProtocolFile(fileChangeEvent))
            }}
          />
        </OutlineButton>
      </div>
    </div>
  )
}

const mapDispatchToProps: MapDispatchToPropsParam<
  { dispatch: ThunkDispatch<any> },
  {}
> = dispatch => ({
  dispatch,
})

function mergeProps(
  stateProps: any,
  dispatchProps: {
    dispatch: ThunkDispatch<any>
  }
): Props {
  const { _initialDeckSetup, ...passThruProps } = stateProps
  const { dispatch } = dispatchProps
  return {
    ...passThruProps,
    goToOT3FilePage: () => {
      dispatch(
        setRobotType({ model: OT3_STANDARD_MODEL, deckId: OT3_STANDARD_DECKID })
      )
      dispatch(navActions.navigateToPage('new-flex-file-form'))
    },
    goToOT2FilePage: () => {
      dispatch(
        setRobotType({ model: OT2_STANDARD_MODEL, deckId: OT2_STANDARD_DECKID })
      )
      dispatch(navActions.navigateToPage('file-splash'))
    },
  }
}

export const LandingPageComponent = connect(
  null,
  mapDispatchToProps,
  mergeProps
)(LandingPage)
