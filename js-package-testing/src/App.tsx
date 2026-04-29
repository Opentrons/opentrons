import '@opentrons/protocol-visualization/styles'

import { ProtocolDeck } from '@opentrons/components'
import { AnnotatedSteps } from '@opentrons/protocol-visualization'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

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
          <a href="#protocol-deck">ProtocolDeck</a>
          <a href="#protocol-visualization">Protocol visualization</a>
        </nav>
      </header>

      <section id="protocol-deck" className="demo_section">
        <h2>ProtocolDeck</h2>
        <p>
          From <code>@opentrons/components</code> using the same StackerAnalysis
          fixture as before.
        </p>

        <div className="analysis_info">
          <h3>Analysis</h3>
          <p>
            <strong>Protocol:</strong> {analysis.metadata.protocolName}
          </p>
          <p>
            <strong>Robot type:</strong> {analysis.robotType}
          </p>
          <p>
            <strong>FLEX_ROBOT_TYPE:</strong> {FLEX_ROBOT_TYPE}
          </p>
        </div>

        <div
          data-testid="protocol-deck-container"
          className="protocol_deck_container"
        >
          <h3>ProtocolDeck</h3>
          <ProtocolDeck
            protocolAnalysis={analysis as any}
            baseDeckProps={{
              showSlotLabels: true,
              showExpansion: true,
            }}
            showLabwareLabels
          />
        </div>
      </section>

      <section id="protocol-visualization" className="demo_section">
        <h2>Protocol visualization</h2>
        <p>
          <code>@opentrons/protocol-visualization</code> currently exports{' '}
          <strong>AnnotatedSteps</strong>, which covers the listed steps UI
          (virtualized list, grouped steps, per-command rows, and the analysis
          error modal). Run analysis fixtures are shared with the deck section
          above.
        </p>
        <div
          data-testid="annotated-steps-container"
          className="annotated_steps_demo"
        >
          <AnnotatedSteps analysis={analysis} groupedCommands={null} />
        </div>
      </section>
    </div>
  )
}
