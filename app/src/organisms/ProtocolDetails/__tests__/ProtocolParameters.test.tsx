import * as React from 'react'
import { describe, it, vi, beforeEach, afterEach } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { storedProtocolData } from '../../../redux/protocol-storage/__fixtures__'
import { ProtocolParameters } from '../ProtocolParameters'

import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'

const render = (props: React.ComponentProps<typeof ProtocolParameters>) => {
  return renderWithProviders(<ProtocolParameters {...props} />, {
    i18nInstance: i18n,
  })
}

const mockMostRecentAnalysis: ProtocolAnalysisOutput = storedProtocolData.mostRecentAnalysis as ProtocolAnalysisOutput

describe('ProtocolParameters', () => {
  let props: React.ComponentProps<typeof ProtocolParameters>

  beforeEach(() => {
    props = {
      analysis: mockMostRecentAnalysis,
    }
  })

  it('should render banner', () => {
    render(props)
    screen.getByText('Listed values are view-only')
    screen.getByText('Start setup to customize values')
  })

  it('should render table header', () => {})

  it('should render parameters default information', () => {})

  it('should render empty display when protocol does not have any parameter', () => {})
})
