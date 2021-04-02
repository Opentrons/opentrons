// app tests
import * as React from 'react'
import { shallow } from 'enzyme'

import { AppComponent } from '..'

jest.mock('../../../definitions')

describe('App', () => {
  it('component renders without definition', () => {
    const tree = shallow(
      <AppComponent
        location={{ search: '' } as any}
        history={{} as any}
        match={{} as any}
        definition={null}
      />
    )

    expect(tree).toMatchSnapshot()
  })

  it('component renders with definition', () => {
    const tree = shallow(
      <AppComponent
        location={{ search: '' } as any}
        history={{} as any}
        match={{} as any}
        definition={
          {
            metadata: { displayCategory: 'wellPlate' },
            brand: { brand: 'generic' },
          } as any
        }
      />
    )

    expect(tree).toMatchSnapshot()
  })
})
