// @flow
import * as React from 'react'
import {AlertItem} from '@opentrons/components'
import i18n from '../../localization'
import type {CommandCreatorError, CommandCreatorWarning} from '../../step-generation'
import ErrorContents from './ErrorContents'
import WarningContents from './WarningContents'

/* TODO:  BC 2018-09-13 this component is an abstraction that is meant to be shared for timeline
* and form level alerts. Currently it is being used in TimelineAlerts, but it should be used in
* FormAlerts as well. This change will also include adding form level alert copy to i18n
* see #1814 for reference
*/
type Props = {
  level: 'timeline' | 'form',
  errors: Array<CommandCreatorError>,
  warnings: Array<CommandCreatorWarning>,
  dismissWarning: (CommandCreatorWarning) => mixed,
}

class Alerts extends React.Component<Props> {
  makeHandleCloseWarning = (warning: CommandCreatorWarning) => () => {
    this.props.dismissWarning(warning)
  }

  render () {
    return (
      <React.Fragment>
        {this.props.errors.map((error, key) => (
          <AlertItem
            type='warning'
            key={`error:${key}`}
            title={i18n.t(`alert.${this.props.level}.error.${error.type}.title`, error.message)}
            onCloseClick={undefined}>
            <ErrorContents level={this.props.level} errorType={error.type} />
          </AlertItem>
        ))}
        {this.props.warnings.map((warning, key) => (
          <AlertItem
            type='warning'
            key={`warning:${key}`}
            title={i18n.t(`alert.${this.props.level}.warning.${warning.type}.title`, warning.message)}
            onCloseClick={this.makeHandleCloseWarning(warning)}>
            <WarningContents level={this.props.level} warningType={warning.type} />
          </AlertItem>
        ))}
      </React.Fragment>
    )
  }
}

export default Alerts
