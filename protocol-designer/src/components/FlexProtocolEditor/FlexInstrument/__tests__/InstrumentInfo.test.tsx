import * as React from 'react'
import { shallow } from 'enzyme'
import { InstrumentInfo, InstrumentInfoProps } from '../InstrumentInfo'

describe('InstrumentInfoComponent', () => {
  it('renders correctly with all props provided', () => {
    const props: InstrumentInfoProps = {
      mount: 'left',
      isDisabled: false,
      className: 'test-class',
      pipetteSpecs: {
        displayCategory: 'GEN2',
        channels: 1,
      },
      infoClassName: 'test-info-class',
      showMountLabel: true,
      description: 'This is a pipette',
      tiprackModel: 'opentrons_96_tiprack_300ul',
      children: <div>Test Child Component</div>,
    }

    const wrapper = shallow(<InstrumentInfo {...props} />)
    expect(wrapper).toMatchSnapshot()
  })

  it('renders correctly with minimum required props provided', () => {
    const props: InstrumentInfoProps = {
      mount: 'left',
      description: 'This is a pipette',
      isDisabled: false,
    }

    const wrapper = shallow(<InstrumentInfo {...props} />)
    expect(wrapper).toMatchSnapshot()
  })

  it('renders correctly with long description', () => {
    const props: InstrumentInfoProps = {
      mount: 'left',
      description:
        'This is a very long description that should still render correctly even though it takes up multiple lines and is quite verbose.',
      isDisabled: false,
    }

    const wrapper = shallow(<InstrumentInfo {...props} />)
    expect(wrapper).toMatchSnapshot()
  })
})
