import { LabwareOffsetTabs } from '..'
import { i18n } from '../../../i18n'
import { renderWithProviders } from '@opentrons/components'
import * as React from 'react'

const mockTableComponent = <div>Table Component</div>
const mockJupyterComponent = <div>Jupyter Component</div>
const mockCLIComponent = <div>CLI Component</div>

const render = () => {
  return renderWithProviders(
    <LabwareOffsetTabs
      TableComponent={mockTableComponent}
      JupyterComponent={mockJupyterComponent}
      CommandLineComponent={mockCLIComponent}
    />,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('LabwareOffsetTabs', () => {
  it('renders the TableComponent by default', () => {
    const { getByText } = render()
    expect(getByText('Table Component')).toBeVisible()
  })

  it('renders the JupyterComponent when Juypter Notebook tab is clicked', () => {
    const { getByText } = render()
    getByText('Jupyter Notebook').click()
    expect(getByText('Jupyter Component')).toBeVisible()
  })

  it('renders the CommandLineComponent when Command Line Interface tab is clicked', () => {
    const { getByText } = render()
    getByText('Command Line Interface (SSH)').click()
    expect(getByText('CLI Component')).toBeVisible()
  })
})
