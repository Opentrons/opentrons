// @flow
import * as React from 'react'
import { mountWithStore } from '@opentrons/components/__utils__'
import { act } from 'react-dom/test-utils'

import { AskForCalibrationBlockModal } from '../AskForCalibrationBlockModal'
import { useAskForCalibrationBlock } from '../useAskForCalibrationBlock'
import { SecondaryBtn, PrimaryBtn, CheckboxField } from '@opentrons/components'
import { setUseTrashSurfaceForTipCal } from '../../../calibration'

describe('useAskForCalibrationBlock', () => {
  const onComplete = jest.fn()
  let showCalBlock
  const TestUseAskForCalibrationBlock = () => {
    const [invoker, modal] = useAskForCalibrationBlock(onComplete, 'fake title')
    React.useEffect(() => {
      showCalBlock = invoker
    })
    return <>{modal}</>
  }

  afterEach(() => {
    jest.resetAllMocks()
  })

  const mount = (initialValue: boolean | null) => {
    return mountWithStore(<TestUseAskForCalibrationBlock />, {
      initialState: {
        config: { calibration: { useTrashSurfaceForTipCal: initialValue } },
      },
    })
  }

  const findCalBlockModal = wrapper => wrapper.find(AskForCalibrationBlockModal)
  const findHaveBlock = wrapper => findCalBlockModal(wrapper).find(PrimaryBtn)
  const findUseTrash = wrapper => findCalBlockModal(wrapper).find(SecondaryBtn)
  const findRemember = wrapper =>
    findCalBlockModal(wrapper)
      .find(CheckboxField)
      .first()

  it('renders a modal when the stored setting is null', () => {
    const { wrapper } = mount(null)
    expect(wrapper.exists(AskForCalibrationBlockModal)).toBe(false)
    act(() => showCalBlock(null))
    wrapper.update()
    expect(wrapper.exists(AskForCalibrationBlockModal)).toBe(true)
  })
  const BLOCK_NONNULLS = [true, false]
  BLOCK_NONNULLS.forEach(val => {
    it(`does not render a modal when the stored setting is ${String(
      val
    )}`, () => {
      const { wrapper } = mount(val)
      expect(wrapper.exists(AskForCalibrationBlockModal)).toBe(false)
      act(() => showCalBlock(null))
      wrapper.update()
      expect(wrapper.exists(AskForCalibrationBlockModal)).toBe(false)
    })
    it(`immediately calls the onComplete when the stored setting is ${String(
      val
    )}`, () => {
      const { wrapper } = mount(val)
      expect(wrapper.exists(AskForCalibrationBlockModal)).toBe(false)
      act(() => showCalBlock(null))
      wrapper.update()
      expect(wrapper.exists(AskForCalibrationBlockModal)).toBe(false)
      expect(onComplete).toHaveBeenCalledWith(!val)
    })
    it(`immediately calls an overridden onComplete when the stored setting is ${String(
      val
    )}`, () => {
      const { wrapper } = mount(val)
      expect(wrapper.exists(AskForCalibrationBlockModal)).toBe(false)
      const newOnComplete = jest.fn()
      act(() => showCalBlock(newOnComplete))
      wrapper.update()
      expect(wrapper.exists(AskForCalibrationBlockModal)).toBe(false)
      expect(newOnComplete).toHaveBeenCalledWith(!val)
      expect(onComplete).not.toHaveBeenCalled()
    })
  })

  const SPECS = [
    {
      it: 'stops rendering the modal when block is picked but not saved',
      which: findHaveBlock,
      save: false,
      savedVal: null,
    },
    {
      it: 'stops rendering the modal when trash is picked but not saved',
      which: findUseTrash,
      save: false,
      savedVal: null,
    },
    {
      it: 'stops rendering the modal when block is picked and saved',
      which: findHaveBlock,
      save: true,
      savedVal: true,
    },
    {
      it: 'stops rendering the modal when trash is picked and saved',
      which: findUseTrash,
      save: true,
      savedVal: false,
    },
  ]
  SPECS.forEach(spec => {
    it(spec.it, () => {
      const { wrapper, store } = mount(null)
      expect(wrapper.exists(AskForCalibrationBlockModal)).toBe(false)
      act(() => showCalBlock(null))
      wrapper.update()
      expect(wrapper.exists(AskForCalibrationBlockModal)).toBe(true)
      findRemember(wrapper).invoke('onChange')({
        currentTarget: { checked: spec.save },
      })

      act(() => spec.which(wrapper).invoke('onClick')())
      wrapper.update()
      if (spec.save) {
        expect(store.dispatch).toHaveBeenCalledWith(
          setUseTrashSurfaceForTipCal(!spec.savedVal)
        )
      } else {
        expect(store.dispatch).not.toHaveBeenCalled()
      }
      expect(wrapper.exists(AskForCalibrationBlockModal)).toBe(false)
    })
  })
})
