```js
const [state, setState] = React.useState({
  isChecked1: false,
  isChecked2: true,
})
;<div>
  <CheckboxField
    label="Check Box 1"
    className="display-block"
    onChange={() => setState({ ...state, isChecked1: !state.isChecked1 })}
    value={state.isChecked1}
  />
  <CheckboxField
    label="Check Box 2 (with error)"
    className="display-block"
    onChange={() => setState({ ...state, isChecked2: !state.isChecked2 })}
    value={state.isChecked2}
    error="error string example"
  />
</div>
```

Optional interminate prop for mixed values

```js
const [state, setState] = React.useState({
  isChecked: false,
  isIndeterminate: true,
})
;<div>
  <CheckboxField
    label="Shared Feild Check Box"
    className="display-block"
    onChange={() =>
      setState({
        ...state,
        isChecked: !state.isChecked,
        isIndeterminate: false,
      })
    }
    value={state.isChecked}
    isIndeterminate={state.isIndeterminate}
  />
</div>
```
