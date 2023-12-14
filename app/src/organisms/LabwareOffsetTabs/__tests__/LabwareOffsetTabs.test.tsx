import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { LabwareOffsetTabs } from '..'
import { fireEvent, screen } from '@testing-library/react'

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
    render()
    expect(screen.getByText('Table Component')).toBeVisible()
  })

  it('renders the JupyterComponent when Juypter Notebook tab is clicked', () => {
    render()
    fireEvent.click(screen.getByText('Jupyter Notebook'))
    expect(screen.getByText('Jupyter Component')).toBeVisible()
  })

  it('renders the CommandLineComponent when Command Line Interface tab is clicked', () => {
    render()
    fireEvent.click(screen.getByText('Command Line Interface (SSH)'))
    expect(screen.getByText('CLI Component')).toBeVisible()
  })
})
