// @flow
import * as React from 'react'
import {Switch, Route} from 'react-router-dom'

import {getDefinition} from '../../definitions'
import {getFilters} from '../../filters'
import {getPublicPath} from '../../public-path'
import Sidebar from '../Sidebar'
import LabwareList, {NoResults} from '../LabwareList'
import LabwareDetails from '../LabwareDetails'
import styles from './styles.css'

import type {Location} from 'react-router-dom'

export type PageProps = {
  location: Location,
}

export default function Page (props: PageProps) {
  const filters = getFilters(props.location)

  return (
    <div className={styles.page_scroller}>
      <div className={styles.page}>
        <Sidebar filters={filters} />
        <section className={styles.content}>
          <div className={styles.content_container}>
            <Switch>
              <Route
                path={`${getPublicPath()}:loadName`}
                render={routeProps => {
                  const {loadName} = routeProps.match.params
                  const definition = getDefinition(loadName)

                  return definition ? (
                    <LabwareDetails definition={definition} />
                  ) : (
                    <NoResults />
                  )
                }}
              />
              <Route render={() => <LabwareList filters={filters} />} />
            </Switch>
          </div>
        </section>
      </div>
    </div>
  )
}
