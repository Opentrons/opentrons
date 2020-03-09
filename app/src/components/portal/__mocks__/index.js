// @flow
// mock portal for enzyme tests
import * as React from 'react'

type Props = {| children: React.Node |}

export const Portal = ({ children }: Props) => <>{children}</>
