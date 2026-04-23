import '@opentrons/protocol-visualization/styles'

import { ProtocolVisualization } from '@opentrons/protocol-visualization'

import StackerAnalysis from './StackerAnalysis.json'

import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'

import './styles.css'

const analysis = StackerAnalysis as unknown as ProtocolAnalysisOutput

export function App(): JSX.Element {
  return (
    <div className="app_container">
      <header className="demo_header">
        <h1>JS package testing</h1>
        <p className="demo_lead">
          Local packed builds of <code>@opentrons/components</code>,{' '}
          <code>@opentrons/shared-data</code>,{' '}
          <code>@opentrons/step-generation</code>, and{' '}
          <code>@opentrons/protocol-visualization</code>.
        </p>
        <nav className="demo_nav" aria-label="On this page">
          <a href="#protocol-visualization">Protocol visualization</a>
        </nav>
      </header>

      <section id="protocol-visualization" className="demo_section">
        <h2>Protocol visualization</h2>
        <div
          data-testid="protocol-visualization-container"
          className="protocol_visualization_demo"
        >
          <ProtocolVisualization analysis={analysis} groupedCommands={null} />
        </div>
      </section>
    </div>
  )
}
