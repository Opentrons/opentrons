import * as React from 'react'
import { connect } from 'react-redux'
import { format } from 'date-fns'

import {
  getProtocolName,
  getProtocolAuthor,
  getProtocolLastUpdated,
  getProtocolMethod,
  getProtocolDescription,
} from '../../../redux/protocol'

import { LabeledValue } from '@opentrons/components'
import { InfoSection } from './InfoSection'
import { SectionContentHalf, CardRow } from '../../../atoms/layout'

import type { State } from '../../../redux/types'

interface SP {
  name?: string | null
  author?: string | null
  lastUpdated?: number | null
  method?: string | null
  description?: string | null
}

type Props = SP

const INFO_TITLE = 'Information'
const DESCRIPTION_TITLE = 'Description'
const DATE_FORMAT = 'PPpp'

export const InformationCard = connect(
  mapStateToProps,
  {}
)(InformationCardComponent)

function InformationCardComponent(props: Props): JSX.Element {
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
