Basic Usage:

```js
<div style={{width: '5rem'}}>
  <NavButton
    onClick={() => alert('you clicked me')}
    iconName='connect'
  />
</div>
```
Disabled:

```js
<div style={{width: '5rem'}}>
  <NavButton
    onClick={() => alert('you clicked me')}
    iconName='connect'
    disabled
  />
</div>
```

Currently Selected:

```js
<div style={{width: '5rem'}}>
  <NavButton
    onClick={() => alert('you clicked me')}
    iconName='connect'
    isCurrent={true}
  />
</div>
```

Optional Title:

```js
<div style={{width: '5rem'}}>
  <NavButton
    onClick={() => alert('you clicked me')}
    title='connect'
    iconName='connect'
    title='connect'
  />
</div>
```
