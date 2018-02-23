// @flow
import * as React from 'react'
import type {Dispatch, BaseState} from '../types'
import {connect} from 'react-redux'

import {NavButton, VerticalNavBar} from '@opentrons/components'
import {type Page, actions, selectors} from '../navigation'
import styles from './NavBar.css'

type Props = {
  currentPage: Page,
  handleClick: Page => (e: ?SyntheticEvent<>) => void
}

function Nav (props: Props) {
  return (
    <VerticalNavBar className={styles.nav_bar}>
      <NavButton
        iconName='file'
        isCurrent={props.currentPage === 'file page'}
        onClick={props.handleClick('file page')} />

      <NavButton
        iconName='cog'
        isCurrent={props.currentPage === 'editor page'}
        onClick={props.handleClick('editor page')} />
    </VerticalNavBar>
  )
}

function mapStateToProps (state: BaseState) {
  return {
    currentPage: selectors.currentPage(state)
  }
}

function mapDispatchToProps (dispatch: Dispatch<*>) {
  return {
    handleClick: (pageName: Page) => () => dispatch(actions.navigateToPage(pageName))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Nav)
