// @flow
// app tests
import { shallow } from 'enzyme'
import * as React from 'react'

import { AppComponent } from '..'

jest.mock('../../../definitions')

describe('App', () => {
  it('component renders without definition', () => {
    const tree = shallow(
      <AppComponent
        location={({ search: '' }: any)}
        history={({}: any)}
        match={({}: any)}
        definition={null}
      />
    )

    expect(tree).toMatchSnapshot()
  })

  it('component renders with definition', () => {
    const tree = shallow(
      <AppComponent
        location={({ search: '' }: any)}
        history={({}: any)}
        match={({}: any)}
        definition={
          ({
            metadata: { displayCategory: 'wellPlate' },
            brand: { brand: 'generic' },
          }: any)
        }
      />
    )

    expect(tree).toMatchSnapshot()
  })
})
