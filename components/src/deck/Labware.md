`96-flat` example

```js
<svg height='200' width='300' viewBox='0 0 125 90'>
  <Labware
    labwareType='96-flat'
    getWellProps={(wellName) => (wellName === 'A2') ? {fillColor: 'green'} : null }
  />
</svg>
```

Tip rack example

```js
<svg height='200' width='300' viewBox='0 0 125 90'>
  <Labware
    labwareType='tiprack-200ul'
    getTipProps={(wellName) => (wellName === 'B3') ? {empty: true} : null }
  />
</svg>
```

Fallback plate for when the `labwareType` is not in `shared-data`

```js
<svg height='200' width='300' viewBox='0 0 125 90'>
  <Labware
    labwareType='custom-labware-thingie'
  />
</svg>
```
