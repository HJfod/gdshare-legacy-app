```<select-menu>```

Selection menu

 * size: `int` How many items should be shown at once
 * multiple: `bool` If included, user can select multiple items `optional`
 * options: `string[]` Menu options `optional`
 * menu: `string` Search box link `optional`
 * empty-text: `string` The text to display when search results return empty / there are no menu items.

```<c-h>```

SVG character

 * a: `string` The character to display

```<app-tab>```

Tab selector

 * link: `string` What page this tab controls
 * default: `boolean` Whether this tab is the default or not `optional`

```<app-page>```

Tab page

 * link: `string` What tab controls this page

 ```<check-box>```

Custom checkbox

  * var: `string` What variable in `global` this checkbox controls `optional`

```<search-box>```

A searchbox for `<select-menu>`

 * menu: `string` What menu this box should search

```<t-dark>```

Lower opacity text

```<roll-over>```

Rollover menu, must only contain one `<roll-text>` and one `<roll-content>` child

```<roll-text>```

Rollover menu text

```<roll-content>```

Rollover menu content