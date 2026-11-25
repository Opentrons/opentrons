import * as React from 'react'

import { CustomizeExpandButton, StyledText } from '../..'
import { STYLE_PROPS } from '../../primitives'
import { ListButton as ListButtonComponent } from './index'
import {
  ListButtonAccordion,
  ListButtonAccordionContainer,
} from './ListButtonChildren/index'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof ListButtonComponent> = {
  title: 'Helix/Atoms/ListButton',
  component: ListButtonComponent,
  argTypes: {
    // Disable all StyleProps
    ...Object.fromEntries(
      [...STYLE_PROPS, 'as', 'ref', 'theme', 'forwardedAs'].map(prop => [
        prop,
        { table: { disable: true } },
      ])
    ),
    type: {
      control: {
        type: 'select',
        options: ['noActive', 'success', 'warning', 'onColor'],
      },
    },
  },
}

export default meta

type Story = StoryObj<typeof ListButtonComponent>
type ListButtonComponentProps = React.ComponentProps<typeof ListButtonComponent>

const Template = (args: ListButtonComponentProps): React.ReactNode => {
  const [containerExpand, setContainerExpand] = React.useState<boolean>(false)
  const [buttonValue, setButtonValue] = React.useState<string | null>(null)
  const [nestedButtonValue, setNestedButtonValue] = React.useState<
    string | null
  >(null)

  return (
    <ListButtonComponent
      {...args}
      onClick={() => {
        setContainerExpand(!containerExpand)
      }}
    >
      <ListButtonAccordion
        key="main"
        mainHeadline="Main heading, click to expand accordion"
        headline="accordion heading"
        isExpanded={containerExpand}
      >
        <ListButtonAccordionContainer id="mainAccordionContainer">
          <>
            <CustomizeExpandButton
              enableStackingFF={false}
              key="buttonNested"
              allowInputField={false}
              loadName="mockloadname0"
              isSelected={buttonValue === 'radio button nested'}
              buttonValue="radio button nested"
              buttonText="Radio button, click to expand nested accordion"
              onChange={e => {
                e.stopPropagation()
                setButtonValue('radio button nested')
              }}
            />

            {buttonValue === 'radio button nested' ? (
              <ListButtonAccordionContainer id="nestedAccordionContainer">
                <ListButtonAccordion
                  key="child"
                  isNested
                  headline="nested accordion heading"
                  isExpanded={buttonValue === 'radio button nested'}
                >
                  <>
                    <CustomizeExpandButton
                      enableStackingFF={false}
                      allowInputField={false}
                      loadName="mockloadname1"
                      isSelected={nestedButtonValue === 'radio button1'}
                      buttonValue="radio button1"
                      buttonText="nested button"
                      onChange={() => {
                        setNestedButtonValue('radio button1')
                      }}
                    />
                    {nestedButtonValue === 'radio button1' ? (
                      <StyledText desktop="bodyDefaultRegular">
                        Nested button option
                      </StyledText>
                    ) : null}
                  </>
                  <CustomizeExpandButton
                    enableStackingFF={false}
                    allowInputField={false}
                    loadName="mockloadname2"
                    isSelected={nestedButtonValue === 'radio button2'}
                    buttonValue="radio button2"
                    buttonText="nested button 2"
                    onChange={() => {
                      setNestedButtonValue('radio button2')
                    }}
                  />
                  <CustomizeExpandButton
                    enableStackingFF={false}
                    allowInputField={false}
                    loadName="mockloadname3"
                    isSelected={nestedButtonValue === 'radio button3'}
                    buttonValue="radio button3"
                    buttonText="nested button 3"
                    onChange={() => {
                      setNestedButtonValue('radio button3')
                    }}
                  />
                </ListButtonAccordion>
              </ListButtonAccordionContainer>
            ) : null}
          </>
          <>
            <CustomizeExpandButton
              enableStackingFF={false}
              key="buttonNonNested"
              allowInputField={false}
              loadName="mockloadname4"
              isSelected={buttonValue === 'radio button non nest'}
              buttonValue="radio button non nest"
              buttonText="Radio button without nested"
              onChange={() => {
                setButtonValue('radio button non nest')
              }}
            />

            {buttonValue === 'radio button non nest' ? (
              <StyledText desktop="bodyDefaultRegular">
                Non nested button option
              </StyledText>
            ) : null}
          </>
        </ListButtonAccordionContainer>
      </ListButtonAccordion>
    </ListButtonComponent>
  )
}
export const ListButton: Story = {
  render: Template,
  args: {
    type: 'noActive',
  },
}
