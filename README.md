ddt - Drag and Drop Tables (v0.5)
===

DDT (Drag and Drop Tables) is a library that adds drag and drop reordering support to HTML tables. 

**This does not support IE at the moment and we do not currently intend to make it support IE in the foreseeable future**

## Todo

 - Tests

## Install

```
$ bower install ddt --save
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

## Bindings

**@todo Document these bindings**

Knockout comes with bindings for Knockout and jQuery. Simply include the relevant files to add these. We currently have bindings for the following libraries

 - jQuery
 - Knockout

## Browser Support

DDT aims to support the following browsers completely

 - Chrome
 - Firefox
 - Safari

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
export declare function init(table: JQuery): DragAndDropTable;
```

This is how you apply ddt to a specific table. This returns an instance of the DragAndDrop class and is the only global function that you can use.

#### Example

```js
var table = ddt.init($('table'));
```

### DragAndDropTable.on (eventEmitter.on)

```typescript
class EventEmitter {
    on(evt:string, listener:Function):EventEmitter;
    on(evt:RegExp, listener:Function):EventEmitter;
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
