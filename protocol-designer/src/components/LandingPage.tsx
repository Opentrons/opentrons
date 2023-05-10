import React from 'react'
import { OutlineButton } from '@opentrons/components'
import { i18n } from '../localization'
import { CreateFlexFileForm } from './FlexProtocolEditor'
import styles from './FlexProtocolEditor/FlexComponents.css'
import { StyledText } from './FlexProtocolEditor/StyledText'
import { selectPageForms } from './FlexProtocolEditor/constant'
import { ProtocolEditor } from './ProtocolEditor'
import { actions as loadFileActions } from '../load-file'
import { useDispatch } from 'react-redux'

export interface PageProps {
  setPageProps: (type: string) => void
}

function LandingPageComponent(props: PageProps): JSX.Element {
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
          onClick={() => props.setPageProps(selectPageForms.newFlexFileForm)}
        >
          <StyledText as="h4">
            {i18n.t('flex.landing_page.create_flex_protocol')}
          </StyledText>
        </OutlineButton>
        <OutlineButton
          className={styles.flex_landing_button}
          onClick={() => props.setPageProps(selectPageForms.protocolEditor)}
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
              props.setPageProps(selectPageForms.protocolEditor)
            }}
          />
        </OutlineButton>
      </div>
    </div>
  )
}

export const selectRobotPage = (
  page: string,
  setPage: (newPage: string) => void
): JSX.Element | null => {
  switch (page) {
    case selectPageForms.newFlexFileForm:
      return (
        <ProtocolEditor>
          <CreateFlexFileForm setPageProps={setPage} />
        </ProtocolEditor>
      )
    case selectPageForms.protocolEditor:
      return <ProtocolEditor />
    case selectPageForms.defaultLandingPage:
      return <LandingPageComponent setPageProps={setPage} />
    default:
      return null
  }
}
