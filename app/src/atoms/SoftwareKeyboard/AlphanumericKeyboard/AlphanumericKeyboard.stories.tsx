import { useRef, useState } from 'react'
import { Provider } from 'react-redux'
import { legacy_createStore } from 'redux'

import {
  DIRECTION_COLUMN,
  Flex,
  InputField,
  POSITION_ABSOLUTE,
  SPACING,
  VIEWPORT,
} from '@opentrons/components'

import { configReducer } from '/app/redux/config/reducer'

import { AlphanumericKeyboard } from '.'

import type { Meta, StoryObj } from '@storybook/react'
import type { Store, StoreEnhancer } from 'redux'
import type { KeyboardReactInterface } from 'react-simple-keyboard'

const dummyConfig = {
  config: {
    isOnDevice: false,
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

const meta: Meta<typeof AlphanumericKeyboard> = {
  title: 'ODD/Atoms/SoftwareKeyboard/AlphanumericKeyboard',
  component: AlphanumericKeyboard,
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

type Story = StoryObj<typeof AlphanumericKeyboard>

const Keyboard = (): JSX.Element => {
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [value, setValue] = useState<string>('')
  const keyboardRef = useRef<KeyboardReactInterface | null>(null)
  const inputElementRef = useRef<HTMLInputElement>(null)
  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
      <form id="test_form">
        <InputField
          ref={inputElementRef}
          value={value}
          type="text"
          placeholder="When focusing, the keyboard shows up"
          onFocus={() => {
            setShowKeyboard(true)
          }}
          onChange={e => {
            setValue(e.target.value)
          }}
        />
      </form>
      <Flex position={POSITION_ABSOLUTE} top="20%" left="0" width="64rem">
        {showKeyboard && (
          <AlphanumericKeyboard
            keyboardRef={keyboardRef}
            inputElementRef={inputElementRef}
          />
        )}
      </Flex>
    </Flex>
  )
}

export const AlphanumericSoftwareKeyboard: Story = {
  render: () => <Keyboard />,
}
