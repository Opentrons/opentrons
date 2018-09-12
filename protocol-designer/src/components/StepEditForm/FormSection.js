// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import startCase from 'lodash/startCase'
import cx from 'classnames'
import {IconButton} from '@opentrons/components'

import {selectors as steplistSelectors} from '../../steplist'
import {collapseFormSection} from '../../steplist/actions'
import type {BaseState, ThunkDispatch} from '../../types'
import styles from './FormSection.css'

// TODO: get these from src/steplist/types.js
type OP = {sectionName: 'aspirate' | 'dispense'}
type FormSectionProps = {
  sectionName?: string,
  children?: React.Node,
  className?: string,
  /** if defined, carat shows */
  onCollapseToggle?: (event: SyntheticEvent<>) => mixed,
  collapsed?: boolean,
}

const FormSection = (props: FormSectionProps) => {
  const childrenArray = React.Children.toArray(props.children)
  return (
    <div className={cx(styles.form_section, props.className)}>
      <div className={styles.title}>{startCase(props.sectionName)}</div>

      <div className={styles.content}>
        {/* First child always visible, following children only visible if not collapsed */}
        {childrenArray[0]}
        {props.collapsed !== true && childrenArray.slice(1)}
      </div>

      {props.collapsed !== undefined && // if doesn't exist in redux
        <div onClick={props.onCollapseToggle} className={styles.carat}>
          <IconButton
            name='settings'
            hover={!props.collapsed}
          />
        </div>
      }
    </div>
  )
}

const FormSectionSTP = (state: BaseState, ownProps: OP) => ({
  collapsed: steplistSelectors.formSectionCollapse(state)[ownProps.sectionName],
})
const FormSectionDTP = (dispatch: ThunkDispatch<*>, ownProps: OP) => ({
  onCollapseToggle: () => dispatch(collapseFormSection(ownProps.sectionName)),
})
const ConnectedFormSection = connect(FormSectionSTP, FormSectionDTP)(FormSection)

export default ConnectedFormSection
