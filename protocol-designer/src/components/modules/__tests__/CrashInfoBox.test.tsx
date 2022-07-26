import * as React from 'react'
import { render } from '@testing-library/react'
import { CrashInfoBox } from '../CrashInfoBox'

describe('CrashInfoBox', () => {
  let props: React.ComponentProps<typeof CrashInfoBox>
  beforeEach(() => {
    props = {}
  })
  it('should render PipetteModuleCollisions, ModuleLabwareCollisions, and ModuleModuleCollisions when a heater shaker is on deck', () => {
    props = {
      ...props,
      showHeaterShakerLabwareCollisions: true,
      showHeaterShakerModuleCollisions: true,
      showHeaterShakerPipetteCollisions: true,
      showMagPipetteCollisons: true,
      showTempPipetteCollisons: true,
    }
    const { getByText } = render(<CrashInfoBox {...props} />)
    getByText('Potential pipette-module collisions')
    getByText('Potential module-labware collisions')
    getByText('Potential module-module collisions')
  })
  it('should only render PipetteModuleCollisions when a mag mod is on deck', () => {
    props = {
      ...props,
      showMagPipetteCollisons: true,
    }
    const { getByText, queryByText } = render(<CrashInfoBox {...props} />)
    getByText('Potential pipette-module collisions')
    expect(queryByText('Potential module-labware collisions')).toBeNull()
    expect(queryByText('Potential module-module collisions')).toBeNull()
  })
  it('should only render PipetteModuleCollisions when a temp mod is on deck', () => {
    props = {
      ...props,
      showTempPipetteCollisons: true,
    }
    const { getByText, queryByText } = render(<CrashInfoBox {...props} />)
    getByText('Potential pipette-module collisions')
    expect(queryByText('Potential module-labware collisions')).toBeNull()
    expect(queryByText('Potential module-module collisions')).toBeNull()
  })
})
