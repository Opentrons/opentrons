`96-flat` example, with row/column labels and with well A1 filled:

```js
<svg height='200' width='300' viewBox='0 0 125 90'>
  <Plate
    containerType='96-flat'
    wellContents={{A1: {fillColor: 'green'}}}
  />
</svg>
```

Tip racks take `tipPropsByWellName` and not `wellContents`.

```js
<svg height='200' width='300' viewBox='0 0 125 90'>
  <Plate
    containerType='tiprack-200ul'
    tipPropsByWellName={{A1: {empty: true}, B3: {highlighted: true}}}
  />
</svg>
```

Fallback plate for when the `containerType` is not in `default-containers.json`

```js
<svg height='200' width='300' viewBox='0 0 125 90'>
  <Plate
    containerType='custom-container-not-in-default-containers'
  />
</svg>
```
