import * as React from 'react'
import { mountWithStore } from '@opentrons/components/__utils__'
import { act } from 'react-dom/test-utils'

import { AskForCalibrationBlockModal } from '../AskForCalibrationBlockModal'
import { CheckboxField } from '@opentrons/components'
import { setUseTrashSurfaceForTipCal } from '../../../redux/calibration'

import type { WrapperWithStore } from '@opentrons/components/__utils__'

type RenderReturnType = WrapperWithStore<
  React.ComponentProps<typeof AskForCalibrationBlockModal>
>
describe('AskForCalibrationBlockModal', () => {
  let onResponse: jest.MockedFunction<() => {}>
  let render: (initialValue?: boolean | null) => RenderReturnType

  beforeEach(() => {
    onResponse = jest.fn()
    render = (initialValue = null) =>
      mountWithStore<React.ComponentProps<typeof AskForCalibrationBlockModal>>(
        <AskForCalibrationBlockModal
          onResponse={onResponse}
          titleBarTitle="Test Cal Flow"
          closePrompt={jest.fn()}
        />,
        {
          initialState: {
            config: { calibration: { useTrashSurfaceForTipCal: initialValue } },
          },
        }
      )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  const findCalBlockModal = (wrapper: RenderReturnType['wrapper']) =>
    wrapper.find(AskForCalibrationBlockModal)
  const findHaveBlock = (wrapper: RenderReturnType['wrapper']) =>
    findCalBlockModal(wrapper).find(
      'button[children="Continue with calibration block"]'
    )
  const findUseTrash = (wrapper: RenderReturnType['wrapper']) =>
    findCalBlockModal(wrapper).find('button[children="Use trash bin"]')
  const findRemember = (wrapper: RenderReturnType['wrapper']) =>
    findCalBlockModal(wrapper).find(CheckboxField).first()

  const SPECS = [
    {
      it: 'no dispatch when block is picked but not saved',
      save: false,
      savedVal: null,
      useTrash: false,
    },
    {
      it:
        'no dispatch (but yes intercom event) when trash is picked but not saved',
      save: false,
      savedVal: null,
      useTrash: true,
    },
    {
      it: 'dispatches config command when block is picked and saved',
      save: true,
      savedVal: true,
      useTrash: false,
    },
    {
      it:
        'dispatches config command and fires interocm event when trash is picked and saved',
      save: true,
      savedVal: false,
      useTrash: true,
    },
  ]
  SPECS.forEach(spec => {
    it(spec.it, () => {
      const { wrapper, store } = render(null)
      expect(wrapper.exists(AskForCalibrationBlockModal)).toBe(true)
      findRemember(wrapper).invoke('onChange')?.({
        currentTarget: { checked: spec.save },
      } as any)

      act(() => {
        spec.useTrash
          ? findUseTrash(wrapper).invoke('onClick')?.({} as React.MouseEvent)
          : findHaveBlock(wrapper).invoke('onClick')?.({} as React.MouseEvent)
      })
      if (spec.save) {
        wrapper.update()
        expect(store.dispatch).toHaveBeenCalledWith(
          setUseTrashSurfaceForTipCal(!spec.savedVal)
        )
      } else {
        expect(store.dispatch).not.toHaveBeenCalled()
      }
      expect(onResponse).toHaveBeenCalledWith(!spec.useTrash)
    })
  })
})
