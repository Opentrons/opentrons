// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { format } from 'date-fns'

import { LabeledValue } from '@opentrons/components'
import {
  getProtocolName,
  getProtocolAuthor,
  getProtocolLastUpdated,
  getProtocolMethod,
  getProtocolDescription,
} from '../../protocol'
import { SectionContentHalf, CardRow } from '../layout'

import type { State, Dispatch } from '../../types'
import { InfoSection } from './InfoSection'

type OP = {||}

type SP = {|
  name: ?string,
  author: ?string,
  lastUpdated: ?number,
  method: ?string,
  description: ?string,
|}

type Props = {| ...OP, ...SP, dispatch: Dispatch |}

const INFO_TITLE = 'Information'
const DESCRIPTION_TITLE = 'Description'
const DATE_FORMAT = 'PPpp'

export const InformationCard: React.AbstractComponent<OP> = connect<
  Props,
  OP,
  SP,
  _,
  _,
  _,
  _
>(mapStateToProps)(InformationCardComponent)

function InformationCardComponent(props: Props) {
  const { name, author, method, description } = props
  const lastUpdated = props.lastUpdated
    ? format(props.lastUpdated, DATE_FORMAT)
    : '-'

  return (
    <>
      <InfoSection title={INFO_TITLE}>
        <CardRow>
          <SectionContentHalf>
            <LabeledValue label="Protocol Name" value={name || '-'} />
          </SectionContentHalf>
          <SectionContentHalf>
            <LabeledValue label="Organization/Author" value={author || '-'} />
          </SectionContentHalf>
        </CardRow>
        <CardRow>
          <SectionContentHalf>
            <LabeledValue label="Last Updated" value={lastUpdated} />
          </SectionContentHalf>
          <SectionContentHalf>
            <LabeledValue label="Creation Method" value={method || '-'} />
          </SectionContentHalf>
        </CardRow>
      </InfoSection>
      {description && (
        <InfoSection title={DESCRIPTION_TITLE}>
          <p>{description}</p>
        </InfoSection>
      )}
    </>
  )
}

function mapStateToProps(state: State): SP {
  return {
    name: getProtocolName(state),
    author: getProtocolAuthor(state),
    lastUpdated: getProtocolLastUpdated(state),
    method: getProtocolMethod(state),
    description: getProtocolDescription(state),
  }
}
