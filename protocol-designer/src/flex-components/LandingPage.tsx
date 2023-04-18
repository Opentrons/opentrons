import * as React from 'react'
import { Icon, OutlineButton } from '@opentrons/components'
import { Link } from 'react-router-dom'
import { i18n } from '../localization'
import styles from './FlexComponents.css'

function LandingPageComponent(): JSX.Element {
  const navData: Props[] = [
    {
      innerText: i18n.t('flex.landing_page.create_flex_protocol'),
      link: 'ot-flex',
    },
    {
      innerText: i18n.t('flex.landing_page.create_ot2_protocol'),
      link: 'ot-2',
    },
  ]

  return (
    <div className={styles.pd_landing_page}>
      <h1>{i18n.t('flex.landing_page.welcome')}</h1>
      <Icon name={'ot-flex-logo'} className={styles.ot_flex_logo} />
      <div className={styles.flex_landing_buttons_wrapper}>
        <ButtonGroup nav={navData} />
        <OutlineButton Component="label" className={styles.flex_landing_button}>
          {i18n.t('flex.landing_page.import_protocol')}
          <input type="file" />
        </OutlineButton>
      </div>
    </div>
  )
}

function ButtonGroup(props: any): any {
  const { nav } = props
  return Boolean(nav)
    ? nav.map((item: any, index: string) => {
      return (
        <Link to={item.link} key={index}>
          <OutlineButton className={styles.flex_landing_button}>
            {item.innerText}
          </OutlineButton>
        </Link>
      )
    })
    : null
}

export interface Props {
  innerText: string
  link: string
}

export const LandingPage = LandingPageComponent
