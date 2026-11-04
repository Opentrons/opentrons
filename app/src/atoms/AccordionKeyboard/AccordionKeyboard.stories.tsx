import { useRef, useState } from 'react'
import { Provider } from 'react-redux'
import { legacy_createStore } from 'redux'

import {
  DIRECTION_COLUMN,
  InputField,
  POSITION_ABSOLUTE,
  SPACING,
  VIEWPORT,
} from '@opentrons/components'

import { configReducer } from '/app/redux/config/reducer'

import { AccordionKeyboard as AccordionKeyboardComponent } from '.'
import { FullKeyboard } from '../SoftwareKeyboard'

import type { Meta, StoryObj } from '@storybook/react'
import type { Store, StoreEnhancer } from 'redux'
import type { ReactNode } from 'react'
import type { KeyboardReactInterface } from 'react-simple-keyboard'

const dummyConfig = {
  config: {
    isOnDevice: true,
    language: {
      appLanguage: 'en',
      systemLanguage: null,
    },
  },
} as any
const store: Store<any> = legacy_createStore(
  configReducer,
  dummyConfig as StoreEnhancer
)

const meta: Meta<typeof AccordionKeyboard> = {
  title: 'ODD/Atoms/AccordionKeyboard',
  component: AccordionKeyboardComponent,
  ...VIEWPORT.touchScreenViewport,
  decorators: [
    Story => (
      <Provider store={store}>
        <Story />
      </Provider>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof AccordionKeyboardComponent>

const Keyboard = (): ReactNode => {
  const [value, setValue] = useState('')
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(true)
  const keyboardRef = useRef<KeyboardReactInterface | null>(null)
  const inputElementRef = useRef<HTMLInputElement>(null)
  return (
    <div style={{ flexDirection: DIRECTION_COLUMN, gap: SPACING.spacing16 }}>
      <form id="test_form">
        <InputField
          ref={inputElementRef}
          value={value}
          type="text"
          onChange={e => {
            setValue(e.target.value)
          }}
        />
      </form>
      <div
        style={{
          position: POSITION_ABSOLUTE,
          top: '20%',
          left: '0%',
          width: '64rem',
        }}
      >
        <AccordionKeyboardComponent
          isOpen={isKeyboardOpen}
          onToggle={() => {
            setIsKeyboardOpen(prev => !prev)
          }}
        >
          <FullKeyboard
            keyboardRef={keyboardRef}
            inputElementRef={inputElementRef}
          />
        </AccordionKeyboardComponent>
      </div>
    </div>
  )
}

export const AccordionKeyboard: Story = {
  render: () => <Keyboard />,
}
