// @flow
// app tests
import * as React from 'react'
import { shallow } from 'enzyme'

import { AppComponent } from '..'

jest.mock('../../../definitions')

describe('App', () => {
  test('component renders without definition', () => {
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

  test('component renders with definition', () => {
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
