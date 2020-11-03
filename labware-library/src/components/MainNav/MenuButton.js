// @flow
import * as React from 'react'
import styles from './MainNav.module.css'

import type { MobileNavProps } from './types'

export function MenuButton(props: MobileNavProps): React.Node {
  return (
    <button onClick={props.onMobileClick} className={styles.nav_button}>
      {!props.isMobileOpen ? (
        <img
          src={`data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMzFweCIgaGVpZ2h0PSIyM3B4IiB2aWV3Qm94PSIwIDAgMzEgMjMiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDU3ICg4MzA3NykgLSBodHRwczovL3NrZXRjaC5jb20gLS0+CiAgICA8dGl0bGU+bmF2IG1vYmlsZTwvdGl0bGU+CiAgICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICAgIDxnIGlkPSJQYWdlLTEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPgogICAgICAgIDxnIGlkPSJtb2JpbGVfMzc1cHgiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0zMjQuMDAwMDAwLCAtMTkuMDAwMDAwKSIgZmlsbD0iIzAwMDAwMCI+CiAgICAgICAgICAgIDxnIGlkPSIwMC1OYXYiPgogICAgICAgICAgICAgICAgPGcgaWQ9Inx8fC1pY29uIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgzMDIuMDAwMDAwLCAwLjAwMDAwMCkiPgogICAgICAgICAgICAgICAgICAgIDxnIGlkPSJuYXYtbW9iaWxlIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgyMi4wMDAwMDAsIDE5LjM4NDYxNSkiPgogICAgICAgICAgICAgICAgICAgICAgICA8cmVjdCBpZD0iUmVjdGFuZ2xlIiB4PSIwIiB5PSIwIiB3aWR0aD0iMzEiIGhlaWdodD0iMy4zOTIzMDc2OSIgcng9IjEiPjwvcmVjdD4KICAgICAgICAgICAgICAgICAgICAgICAgPHJlY3QgaWQ9IlJlY3RhbmdsZS1Db3B5IiB4PSIwIiB5PSI5LjM4NjIzNDgyIiB3aWR0aD0iMzEiIGhlaWdodD0iMy4zOTIzMDc2OSIgcng9IjEiPjwvcmVjdD4KICAgICAgICAgICAgICAgICAgICAgICAgPHJlY3QgaWQ9IlJlY3RhbmdsZS1Db3B5LTIiIHg9IjAiIHk9IjE4Ljc3MjQ2OTYiIHdpZHRoPSIzMSIgaGVpZ2h0PSIzLjM5MjMwNzY5IiByeD0iMSI+PC9yZWN0PgogICAgICAgICAgICAgICAgICAgIDwvZz4KICAgICAgICAgICAgICAgIDwvZz4KICAgICAgICAgICAgPC9nPgogICAgICAgIDwvZz4KICAgIDwvZz4KPC9zdmc+`}
          alt="Mobile menu open"
        />
      ) : (
        <img
          src={
            'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNSIgaGVpZ2h0PSIyNSIgdmlld0JveD0iMCAwIDI1IDI1Ij4KICAgIDxnIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICAgICAgPHJlY3Qgd2lkdGg9IjMxIiBoZWlnaHQ9IjMuMjUiIHg9Ii0zIiB5PSIxMSIgcng9IjEiIHRyYW5zZm9ybT0icm90YXRlKDQ1IDEyLjUgMTIuNjI1KSIvPgogICAgICAgIDxyZWN0IHdpZHRoPSIzMSIgaGVpZ2h0PSIzLjI1IiB4PSItMyIgeT0iMTEuNDI4IiByeD0iMSIgdHJhbnNmb3JtPSJyb3RhdGUoLTQ1IDEyLjUgMTMuMDUzKSIvPgogICAgPC9nPgo8L3N2Zz4K'
          }
          alt="Mobile menu open"
        />
      )}
    </button>
  )
}
