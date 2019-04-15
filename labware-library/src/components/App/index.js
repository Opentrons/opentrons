// @flow
// main application wrapper component
import * as React from 'react'
import { hot } from 'react-hot-loader/root'
import cx from 'classnames'

import { DefinitionRoute } from '../../definitions'
import { getFilters } from '../../filters'
import Nav, { Breadcrumbs } from '../Nav'
import Sidebar from '../Sidebar'
import Page from './Page'
import LabwareList from '../LabwareList'
import LabwareDetails from '../LabwareDetails'
import styles from './styles.css'

import type { DefinitionRouteRenderProps } from '../../definitions'

export class App extends React.Component<DefinitionRouteRenderProps> {
  componentDidUpdate(prevProps: DefinitionRouteRenderProps): void {
    if (this.props.location.pathname !== prevProps.location.pathname) {
      window.scrollTo(0, 0)
    }
  }

  render() {
    const { definition, location } = this.props
    const filters = getFilters(location, definition)
    const breadcrumbsVisibile = Boolean(definition)

    return (
      <div
        className={cx(styles.app, {
          [styles.breadcrumbs_visible]: breadcrumbsVisibile,
        })}
      >
        <Nav />
        {breadcrumbsVisibile && <Breadcrumbs definition={definition} />}
        <Page
          sidebarLargeOnly={breadcrumbsVisibile}
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
}

export function AppWithRoute() {
  return <DefinitionRoute render={props => <App {...props} />} />
}

export default hot(AppWithRoute)
