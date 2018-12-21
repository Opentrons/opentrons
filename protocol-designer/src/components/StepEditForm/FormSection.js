// @flow
import * as React from 'react'
import startCase from 'lodash/startCase'
import {IconButton, HoverTooltip} from '@opentrons/components'

import i18n from '../../localization'
import styles from './FormSection.css'

type Props = {
  sectionName?: string,
  headerRow?: React.Node,
  children?: React.Node,
}
type State = {collapsed?: boolean}

class FormSection extends React.Component<Props, State> {
  state = {collapsed: true}

  handleClick = (e: SyntheticEvent<>) => {
    this.setState({collapsed: !this.state.collapsed})
  }
  render () {
    return (
      <div className={styles.form_section}>
        <div className={styles.title}>{startCase(this.props.sectionName)}</div>

        <div className={styles.content}>
          {this.props.headerRow}
          {this.state.collapsed !== true && this.props.children}
        </div>

        <HoverTooltip tooltipComponent={i18n.t('tooltip.advanced_settings')}>
          {(hoverTooltipHandlers) => (
            <div {...hoverTooltipHandlers} onClick={this.handleClick} className={styles.carat} >
              <IconButton name='settings' hover={!this.state.collapsed} />
            </div>
          )}
        </HoverTooltip>
      </div>
    )
  }
}

export default FormSection
