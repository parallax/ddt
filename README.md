ddt - Drag and Drop Tables (v0.6.2)
===

DDT (Drag and Drop Tables) is a library that adds drag and drop reordering support to HTML tables. 

**This library does not support any version of IE currently. You can track IE support at [Issue #46](https://github.com/parallax/ddt/issues/46).**

## Install

```
$ bower install ddt --save
```

## Tests

While most of DDT is not yet covered with tests (see [Issue #40](https://github.com/parallax/ddt/issues/40) for more info), there are some. We use the Karma test runner for these. To run our tests, simply run the following (you'll need gulp).

```
$ npm install
$ gulp test
```

## Requirements

 - [jQuery](http://jquery.com) (Version 1.8.3+)
 - [Lo-Dash](http://lodash.com/) (Version 2.4.1+)
 - [eventEmitter](https://github.com/Wolfy87/EventEmitter) (Version 4.2.7+)
 - [RequireJS](http://requirejs.org/)

Although DDT may work with other versions of these libaries, this use is untested and you may run into issues.

## Usage

```js
require(['ddt'], function(ddt) {
	var table = ddt.init($(yourElementHere)); 
	
	// This is likely to change
	table.on('reorder', function(newOrder) {
	    // newOrder is an array with the new order of the rows
	});
});
```

And then just add `data-value` attributes to each of your `<tr>` tags in your HTML like so.

```html
<table>
	<tr data-value="1">
		<td>A</td>
		<td>B</td>
		<td>C</td>
	</tr>
	<tr data-value="2">
        <td>D</td>
        <td>E</td>
        <td>F</td>
    </tr>
</table>
```

## Browser Support

DDT aims to support the following browsers completely

 - Chrome 18+
 - Firefox (?)
 - Safari 6+

We will be supporting IE at some point in the future. Follow this development at  [Issue #46](https://github.com/parallax/ddt/issues/46).

There is currently no support for touch. We plan to investigate supporting touch some time in the future. Follow support for this at [Issue #36](https://github.com/parallax/ddt/issues/36).

## Contributing

DDT is written in [TypeScript](http://www.typescriptlang.org/), a statically typed pre-processor for JavaScript written by Microsoft. Because of this, all contribution must be written in TypeScript. You can compile the typescript files in the same way we do using [gulp.js](http://gulpjs.com/), like so.

```
$ npm install
$ gulp compile
```

Besides that, please follow our standard style guide that is in place throughout the library.

## API

While there may be other symbols accessible to you, these are not documented nor standard and can change from version to version so it is advisable that you only use the API described below.

### ddt.init

```typescript
export declare function init(table: JQuery, options?: DragAndDropTableOptions): DragAndDropTable;
```

This is how you apply ddt to a specific table. This returns an instance of the DragAndDrop class and is the only global function that you can use.

#### Example

```js
var table = ddt.init($('table'), {
    // options
});
```

#### Options

```typescript
export interface DragAndDropTableOptions {
    // Restrict drag and drop movement to the vertical access only
    verticalOnly    ?: boolean;

    // Contain the drag and drop movement to within the table
    bindToTable     ?: boolean;

    // The cursor to change to while dragging
    cursor          ?: string;

    // The attribute to get the value for each row from
    valueAttribute  ?: string;

    // The container to add the fake table row to
    shadowContainer ?: Element;

    // A custom element to contain the drag and drag movement within
    containment     ?: Element;
}
```

#### Defaults

```typescript

export class DragAndDropTable extends EventEmitter {
    public static defaultOptions : DragAndDropTableOptions = {
        verticalOnly    : true,
        containment     : null,
        bindToTable     : true,
        shadowContainer : document.body,
        cursor          : 'default',
        valueAttribute  : 'data-value'
    };
}
```

### DragAndDropTable.on (eventEmitter.on)

```typescript
class EventEmitter {
    on(evt:string, listener:Function):EventEmitter;
}
```

This is how you listen for events from the library. Currently the only events we have are the following

 ```
  - reorder => Triggered when rows are reordered
 ```

#### Example

 ```js
 table.on('reorder', function(newOrder) {

 });
 ```
