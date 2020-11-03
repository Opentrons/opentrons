// @flow
// top nav bar component
import * as React from 'react'
import { SubdomainNav } from '../SubdomainNav'
import { MainNav } from '../MainNav'
import styles from './styles.css'
import navData from './nav.json'

export { Breadcrumbs } from './Breadcrumbs'

export function Nav(): React.Node {
  const { navigationList, subdomainList, homeUrl: url } = navData
  const [navigation, setNavigation] = React.useState(navigationList)
  const [homeUrl, setHomeUrl] = React.useState(url)
  const [subdomain, setSubdomain] = React.useState(subdomainList)

  React.useEffect(() => {
    window
      .fetch('https://opentrons.com/api/navigationData.json')
      .then(response => {
        response.json().then(data => {
          if (data && data.homeUrl) {
            setSubdomain(data.subdomainList)
            setNavigation(data.navigationList)
            setHomeUrl(data.homeUrl)
          }
        })
      })
      .catch(e => console.error(e))
  }, [])

  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.subdomain_nav_wrapper}>
          <div className={styles.nav_container}>
            <SubdomainNav subdomainList={subdomain} homeUrl={homeUrl} />
          </div>
        </div>
        <div className={styles.main_nav_wrapper}>
          <div className={styles.nav_container}>
            <MainNav navigationList={navigation} homeUrl={homeUrl} />
          </div>
        </div>
      </nav>
    </>
  )
}
