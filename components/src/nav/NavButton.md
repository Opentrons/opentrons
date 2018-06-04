Basic Usage:

```js
<div style={{width: '5rem'}}>
  <NavButton
    onClick={() => alert('you clicked me')}
    iconName='ot-connect'
  />
</div>
```
Disabled:

```js
<div style={{width: '5rem'}}>
  <NavButton
    onClick={() => alert('you clicked me')}
    iconName='ot-connect'
    disabled
  />
</div>
```

Currently Selected:

```js
<div style={{width: '5rem'}}>
  <NavButton
    onClick={() => alert('you clicked me')}
    iconName='ot-connect'
    selected
  />
</div>
```

Optional Title:

```js
<div style={{width: '5rem'}}>
  <NavButton
    onClick={() => alert('you clicked me')}
    title='connect'
    iconName='ot-connect'
    title='connect'
  />
</div>
```
