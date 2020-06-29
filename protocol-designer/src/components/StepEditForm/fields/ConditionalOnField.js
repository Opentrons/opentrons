// @flow
import * as React from 'react'
import { connect } from 'react-redux'

import type { StepFieldName } from '../../../form-types'
import { selectors as stepFormSelectors } from '../../../step-forms'
import type { BaseState } from '../../../types'

type OP = {|
  name: StepFieldName,
  condition: (value: mixed) => boolean,
  children: React.Node,
|}

type SP = {|
  value: mixed,
|}

type Props = { ...OP, ...SP }

function ConditionalOnFieldComponent(props: Props) {
  return props.condition(props.value) ? props.children : null
}

function STP(state: BaseState, ownProps: OP): SP {
  const formData = stepFormSelectors.getUnsavedForm(state)
  return {
    value: formData ? formData[ownProps.name] : null,
  }
}

export const ConditionalOnField: React.AbstractComponent<OP> = connect<
  Props,
  OP,
  SP,
  _,
  _,
  _
>(STP)(ConditionalOnFieldComponent)
