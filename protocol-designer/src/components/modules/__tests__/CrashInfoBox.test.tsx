import * as React from 'react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { CrashInfoBox } from '../CrashInfoBox'
import { i18n } from '../../../localization'
import { renderWithProviders } from '../../../__testing-utils__'

describe('CrashInfoBox', () => {
  let props: React.ComponentProps<typeof CrashInfoBox>
  beforeEach(() => {
    props = {}
  })
  afterEach(() => {
    cleanup()
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
    renderWithProviders(<CrashInfoBox {...props} />, { i18nInstance: i18n })
    screen.getByText('Potential pipette-module collisions')
    screen.getByText('Potential module-labware collisions')
    screen.getByText('Potential module-module collisions')
  })
  it('should only render PipetteModuleCollisions when a mag mod is on deck', () => {
    props = {
      ...props,
      showMagPipetteCollisons: true,
    }
    renderWithProviders(<CrashInfoBox {...props} />, { i18nInstance: i18n })
    screen.getByText('Potential pipette-module collisions')
    expect(screen.queryByText('Potential module-labware collisions')).toBeNull()
    expect(screen.queryByText('Potential module-module collisions')).toBeNull()
  })
  it('should only render PipetteModuleCollisions when a temp mod is on deck', () => {
    props = {
      ...props,
      showTempPipetteCollisons: true,
    }
    renderWithProviders(<CrashInfoBox {...props} />, { i18nInstance: i18n })
    screen.getByText('Potential pipette-module collisions')
    expect(screen.queryByText('Potential module-labware collisions')).toBeNull()
    expect(screen.queryByText('Potential module-module collisions')).toBeNull()
  })
})
