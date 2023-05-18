import React from 'react'
import { OutlineButton } from '@opentrons/components'
import { i18n } from '../localization'

import styles from './FlexProtocolEditor/FlexComponents.css'
import { StyledText } from './FlexProtocolEditor/StyledText'

import { actions as loadFileActions } from '../load-file'
import { connect, useDispatch } from 'react-redux'
import { ThunkDispatch } from '../types'
import { actions as navActions } from '../navigation'

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
              goToOT2FilePage()
            }}
          />
        </OutlineButton>
      </div>
    </div>
  )
}

function mergeProps(
  stateProps: SP,
  dispatchProps: {
    dispatch: ThunkDispatch<any>
  }
): Props {
  const { _initialDeckSetup, ...passThruProps } = stateProps
  const { dispatch } = dispatchProps
  return {
    ...passThruProps,
    goToOT3FilePage: () => {
      dispatch(navActions.navigateToPage('new-flex-file-form'))
    },
    goToOT2FilePage: () => {
      dispatch(navActions.navigateToPage('file-splash'))
    },
  }
}

export const LandingPageComponent = connect(null, null, mergeProps)(LandingPage)
