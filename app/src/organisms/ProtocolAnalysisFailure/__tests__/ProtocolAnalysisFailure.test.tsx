import * as React from 'react'
import '../../../pages/ProtocolDetails/__tests__/node_modules/@testing-library/jest-dom'
import { renderWithProviders } from '@opentrons/components'
import { StaticRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'
import { i18n } from '../../../i18n'

import { ProtocolAnalysisFailure } from '..'
import { analyzeProtocol } from '../../../redux/protocol-storage'

const render = (
  props: Partial<React.ComponentProps<typeof ProtocolAnalysisFailure>> = {}
) => {
  return renderWithProviders(
    <StaticRouter>
      <ProtocolAnalysisFailure
        {...{
          protocolKey: 'fakeProtocolKey',
          errors: ['fake analysis error'],
          ...props,
        }}
      />
    </StaticRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('ProtocolAnalysisFailure', () => {
  it('renders banner with no modal by default', () => {
    const [{ queryByRole }] = render()
    expect(queryByRole('button', { name: 'close' })).toBeNull()
  })
  it('renders modal after clicking view details', () => {
    const [{ getByRole, queryByRole }] = render()
    const viewDetailsButton = getByRole('button', { name: 'error details' })
    fireEvent.click(viewDetailsButton)
    const closeButton = getByRole('button', { name: 'close' })
    fireEvent.click(closeButton)
    expect(queryByRole('button', { name: 'close' })).toBeNull()
  })
  it('dispatches reanalyze action on click', () => {
    const [{ getByRole }, store] = render()
    const reanalyzeButton = getByRole('button', { name: 'Reanalyze' })
    fireEvent.click(reanalyzeButton)
    expect(store.dispatch).toHaveBeenCalledWith(
      analyzeProtocol('fakeProtocolKey')
    )
  })
})
