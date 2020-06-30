// @flow
// main application wrapper component
import * as React from 'react'
import { hot } from 'react-hot-loader/root'
import cx from 'classnames'

import { DefinitionRoute } from '../../definitions'
import { useFilters } from '../../filters'
import { Nav, Breadcrumbs } from '../Nav'
import { Sidebar } from '../Sidebar'
import { LabwareList } from '../LabwareList'
import { LabwareDetails } from '../LabwareDetails'
import type { DefinitionRouteRenderProps } from '../../definitions'
import styles from './styles.css'

import { Page } from './Page'

export function AppComponent(props: DefinitionRouteRenderProps): React.Node {
  const { definition, location } = props
  const scrollRef = React.useRef<HTMLDivElement | null>(null)
  const filters = useFilters(location)
  const detailPage = Boolean(definition)

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
    window.scrollTo(0, 0)
  }, [location.pathname, location.search])

  return (
    <div
      className={cx(styles.app, {
        [styles.is_detail_page]: detailPage,
      })}
    >
      <Nav />
      {detailPage && <Breadcrumbs />}
      <Page
        scrollRef={scrollRef}
        detailPage={detailPage}
        sidebar={<Sidebar filters={filters} />}
        content={
          definition ? (
            <LabwareDetails definition={definition} />
          ) : (
            <LabwareList filters={filters} />
          )
        }
      />
    </div>
  )
}

export function AppWithRoute(): React.Node {
  return <DefinitionRoute render={props => <AppComponent {...props} />} />
}

export const App: React.AbstractComponent<{||}> = hot(AppWithRoute)
