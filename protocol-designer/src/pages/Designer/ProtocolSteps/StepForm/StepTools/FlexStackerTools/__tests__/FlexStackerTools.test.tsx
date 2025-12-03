import { ComponentProps } from 'react'
import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FLEX_STACKER_MODULE_TYPE } from '@opentrons/shared-data'
import { TimelineFrame } from '@opentrons/step-generation'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'

import { FlexStackerTools } from '..'

const render = (props: ComponentProps<typeof FlexStackerTools>) => {
  return renderWithProviders(<FlexStackerTools {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('FlexStackerTools', () => {
  let props: ComponentProps<typeof FlexStackerTools>
  beforeEach(() => {
    props = {
      propsForFields: {} as any,
      formData: { moduleId: 'mockId' } as any,
      toolboxStep: 0,
      showFormErrors: false,
      focusHandlers: {} as any,
      tab: 'aspirate',
      setTab: vi.fn(),
      setShowFormErrors: vi.fn(),
      robotState: {
        pipettes: {},
        labware: {},
        tipState: {
          tipracks: {},
          pipettes: {},
        },
        liquidState: {
          pipettes: {},
          labware: {},
          trashBins: {},
          wasteChute: {},
        },
        modules: {
          mockId: {
            moduleState: {
              type: FLEX_STACKER_MODULE_TYPE,
              maxPoolCount: 6,
              storedLabwareDetails: {
                primaryLabware: {
                  loadName: 'mockLabwareId',
                  namespace: 'mockLabwareNamespace',
                  version: 1,
                },
                lidLabware: {
                  loadName: 'mockLidLabwareId',
                  namespace: 'mockLidLabwareNamespace',
                  version: 1,
                },
                initialCount: 1,
              },
              labwareInHopper: ['mockLabwareId'],
              labwareOnShuttle: null,
            },
          },
        },
      } as any,
      flexStackerOptions: [{ name: 'mock module', value: 'mockId' }],
    }
  })

  it('should render view only', () => {
    render(props)
    expect(screen.getByText('Choose option')).toBeInTheDocument()
    expect(screen.getByText('Shuttle')).toBeInTheDocument()
    expect(screen.getByText('Stacker')).toBeInTheDocument()
    expect(screen.getByText('Module controls')).toBeInTheDocument()
    expect(screen.getByText('Refill')).toBeInTheDocument()
    const retrieveButton = screen.getByRole('radio', { name: 'retrieve' })
    expect(retrieveButton).toHaveAttribute('aria-disabled')
    expect(screen.getByText('Empty')).toBeInTheDocument()
  })

  it('should render view with labware in hopper', () => {
    props.robotState = {
      ...(props.robotState as TimelineFrame),
      modules: {
        ...props.robotState?.modules,
        mockId: {
          moduleState: {
            type: FLEX_STACKER_MODULE_TYPE,
            maxPoolCount: 6,
            storedLabwareDetails: {
              primaryLabware: {
                loadName: 'mockLabwareId',
                namespace: 'mockLabwareNamespace',
                version: 1,
              },
              lidLabware: {
                loadName: 'mockLidLabwareId',
                namespace: 'mockLidLabwareNamespace',
                version: 1,
              },
              initialCount: 1,
            },
            labwareInHopper: ['mockLabwareId'],
            labwareOnShuttle: null,
          },
        },
      } as any,
    }
    render(props)
    expect(screen.getByText('1/6 labware filled')).toBeInTheDocument()
    expect(screen.getByText('mockLabwareId')).toBeInTheDocument()
    expect(screen.getByText('mockLidLabwareId')).toBeInTheDocument()
    expect(screen.getByText('Quantity: 1')).toBeInTheDocument()
  })

  it('should render view with no labware in hopper', () => {
    props.robotState = {
      ...(props.robotState as TimelineFrame),
      modules: {
        ...props.robotState?.modules,
        mockId: {
          moduleState: {
            ...props.robotState?.modules?.mockId?.moduleState,
            labwareInHopper: [],
            storedLabwareDetails: null,
            labwareOnShuttle: null,
          },
        },
      } as any,
    }
    render(props)
    expect(screen.getByText('No labware stored on stacker')).toBeInTheDocument()
  })

  it('should render view with labware on shuttle', () => {
    props.robotState = {
      ...(props.robotState as TimelineFrame),
      modules: {
        ...props.robotState?.modules,
        mockId: {
          moduleState: {
            ...props.robotState?.modules?.mockId?.moduleState,
            labwareOnShuttle: [
              {
                primaryLabwareId: 'mockLabwareId',
                adapterLabwareId: null,
                lidLabwareId: null,
              },
            ],
          },
        },
      } as any,
    }
    render(props)
    expect(screen.getByText('Shuttle')).toBeInTheDocument()
    expect(screen.getByText('mockLabwareId')).toBeInTheDocument()
    expect(screen.queryByText('Quantity: 0')).not.toBeInTheDocument()
  })

  it('should render view with no labware on shuttle', () => {
    props.robotState = {
      ...(props.robotState as TimelineFrame),
      modules: {
        ...props.robotState?.modules,
        mockId: {
          moduleState: {
            ...props.robotState?.modules?.mockId?.moduleState,
            labwareOnShuttle: null,
          },
        },
      } as any,
    }
    render(props)
    expect(screen.getByText('No labware on shuttle')).toBeInTheDocument()
  })
})
