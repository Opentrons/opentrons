import * as React from 'react'
import { Icon, OutlineButton } from '@opentrons/components'
import { Link } from 'react-router-dom'
import { i18n } from '../localization'
import { StyledText } from './protocol-editor/StyledText'
import styles from './protocol-editor/FlexComponents.css'

export interface Props {
  loadFile: (event: React.ChangeEvent<HTMLInputElement>) => unknown
}

export function LandingPageComponent(props: Props): JSX.Element {
  const navData = [
    {
      innerText: i18n.t('flex.landing_page.create_flex_protocol'),
      link: 'ot-flex',
    },
    {
      innerText: i18n.t('flex.landing_page.create_ot2_protocol'),
      link: 'ot-2',
    }
  ]

  const {
    loadFile,
  } = props

  return (
    <div className={styles.pd_landing_page}>
      <StyledText as="h1">{i18n.t('flex.landing_page.welcome')}</StyledText>
      <Icon name={'ot-flex-logo'} className={styles.ot_flex_logo} />
      <div className={styles.flex_landing_buttons_wrapper}>
        <ButtonGroup nav={navData} />
        <OutlineButton Component="label" className={styles.flex_landing_button}>
          <StyledText as="h4">
            {i18n.t('flex.landing_page.import_protocol')}
          </StyledText>
          <input type="file" onChange={loadFile} />
        </OutlineButton>
      </div>
      <Link to="file-tab" className='file_tab' />
    </div>
  )
}

function ButtonGroup(props: any): any {
  const { nav } = props
  return Boolean(nav)
    ? nav.map((item: any, index: string) => {
      return (
        <Link to={item.link} key={index}>
          <OutlineButton className={[styles.flex_landing_button,"ot-2"]}>
            <StyledText as="h4">{item.innerText}</StyledText>
          </OutlineButton>
        </Link>
      )
    })
    : null
}

export const LandingPage = LandingPageComponent
