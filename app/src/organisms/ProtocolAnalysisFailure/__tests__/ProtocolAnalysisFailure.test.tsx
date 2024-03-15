import * as React from 'react'
import { StaticRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import { renderWithProviders } from '../../../__testing-utils__'
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
    render()
    expect(screen.queryByRole('button', { name: 'close' })).toBeNull()
  })
  it('renders modal after clicking view details', () => {
    render()
    const viewDetailsButton = screen.getByRole('button', {
      name: 'error details',
    })
    fireEvent.click(viewDetailsButton)
    const closeButton = screen.getByRole('button', { name: 'close' })
    fireEvent.click(closeButton)
    expect(screen.queryByRole('button', { name: 'close' })).toBeNull()
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
