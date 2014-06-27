/// <reference path='./typings/jquery/jquery.d.ts' />
/// <reference path='./typings/lodash/lodash.d.ts' />

import $ = require('jquery');
import _ = require('lodash');

// Simple parseInt wrapper
var toNumber = n => parseInt(n, 10) || 0;

/**
 * lib.d.ts doesn't include these properties on event for some reason.
 */
export interface Event {
    pageX : number;
    pageY : number;
}

/**
 * An enum representing the two different axis
 */
export enum DDTAxis { X, Y }
/**
 * The result of a bounds calculation.
 */
export enum DDTBoundsResult { LOW, IN, HIGH }

/**
 * A mini event emitter
 *
 * @todo Look at changing this to one that has already been written? 
 */
export class DDTEventEmitter {
    private handlers = {};

    public on(event : string, handler : Function) {
        if (!this.handlers[event]) {
            this.handlers[event] = [];
        }

        this.handlers[event].push(handler);
    }

    public off(event : string, handler : Function) {
        this.handlers[event].splice(this.handlers[event].indexOf(handler), 1);
    }

    public emit(event : string, args : any[]) {
        (this.handlers[event] || []).forEach(h => h.apply(this, args));
    }
}

/**
 * A class representing coords which we use across the whole library
 */
export class DDTCoords {

    x : number;
    y : number;

    constructor(x : number, y : number) {
        this.x = x;
        this.y = y;
    }

    minus(coords : DDTCoords) { return new DDTCoords(this.x - coords.x, this.y - coords.y); }
    add(coords : DDTCoords)   { return new DDTCoords(this.x + coords.x, this.y + coords.y); }


    gt(coords : DDTCoords, axis : DDTAxis) {
        var key = DDTCoords.enumToAxis(axis);

        return this[key] > coords[key];
    }

    lt(coords : DDTCoords, axis : DDTAxis) {
        var key = DDTCoords.enumToAxis(axis);

        return this[key] < coords[key];
    }

    /**
     * Add a certain amount to a specific axis
     */
    addToAxis(size : number, axis : DDTAxis) {
        var coords = [this.x, this.y];

        coords[axis === DDTAxis.X ? 0 : 1] += size;

        return new DDTCoords(coords[0], coords[1]);
    }

    /**
     * Calculation taken from jQuery UI sortable.
     *
     * Used to calculate if a coords is over another coords by a certain amount
     */
    isOverAxis(coords : DDTCoords, size : number, axis : DDTAxis) {
        return this.gt(coords, axis) && this.lt(coords.addToAxis(size, axis), axis);
    }

    static fromEvent(event : Event)       { return new DDTCoords(event.pageX, event.pageY); }
    static fromElement(element : Element) { return DDTCoords.fromJQuery($(element)); }

    static fromJQuery(jquery : JQuery) {
        var offset = jquery.offset();

        return new DDTCoords(offset.left, offset.top);
    }

    private static enumToAxis(axis : DDTAxis) { return axis === DDTAxis.X ? 'x' : 'y'; }
}

/**
 * Used for managing CSS within the library.
 *
 * Using this class we have a nice API for defining new selectors. 
 *
 * @note This probably doesn't work in any kind of IE, but it's possible for it to by
 *       using style.innerText directly. We can probably look at using that in the future.
 */
export class DDTCSS {

    private static styleElement : HTMLStyleElement;

    /**
     * Define a specific selector with some rules for it
     */
    static defineSelector(selectorName : string, rules : Object) {
        if (!DDTCSS.styleElement) {
            DDTCSS.styleElement = document.createElement('style');
            // Apparently we need a text node inside the style tag or this won't work.
            // This hasn't been tessed
            DDTCSS.styleElement.appendChild(document.createTextNode(''));

            document.head.appendChild(DDTCSS.styleElement);
        }


        var sheet = <CSSStyleSheet> DDTCSS.styleElement.sheet;
        sheet.addRule(selectorName, DDTCSS.rulesToCSS(rules), 0);
    }

    static defineClass(className : string, rules : Object) {
        return DDTCSS.defineSelector('.' + className, rules);
    }

    /**
     * Convert an object of rules into a cssText string.   
     */
    static rulesToCSS(rules : Object) : string {
        return _.chain(rules)
            .pairs()
            .map(p => [this.arrowCase(p[0]), ':', p[1], ';'])
            .flatten()
            .join('')
        .value();
    }

    /**
     * Convert CamelCase to -camel-case
     */
    static arrowCase(name : string) { return name.replace(/([A-Z])/g, '-$1').toLowerCase(); }
}

/**
 * An interface for dealing with elements in our library.
 * 
 * Has some really useful helper functions
 */
export class DDTElement {

    // Some class names
    static notVisible  = 'DDTNotVisible';
    static shadowTable = 'DDTShadowTable';
    static shadowRow   = 'DDTShadowRow';
    static noSelect    = 'DDTNoSelect';

    element : JQuery;
    emitter : DDTEventEmitter;

    constructor(element : JQuery) {
        this.element = element;
        this.emitter = new DDTEventEmitter();
    }

    /**
     * Get the HTMLElement from the jQuery object
     */
    getNode()       { return this.element[0]; }

    /**
     * Get the offset top of an element from a parent.
     */
    offsetTop()     { return (this.element.offset() || { top : 0  }).top; }

    show()          { this.element.removeClass(DDTElement.notVisible); }
    hide()          { this.element.addClass(DDTElement.notVisible); }
    notSelectable() { this.element.addClass(DDTElement.noSelect); }
    selectable()    { this.element.removeClass(DDTElement.noSelect); }

    /**
     * Swap two elements in the dom
     *
     * @see http://stackoverflow.com/a/698440/851985
     */
    swap(element : DDTElement) {
        var ourNode       = this.getNode();
        var theirNode     = element.getNode();
        var ourNodeParent = ourNode.parentNode;
        var sibling       = ourNode.nextSibling === theirNode ? ourNode : ourNode.nextSibling;

        theirNode.parentNode.insertBefore(ourNode, theirNode);
        ourNodeParent.insertBefore(theirNode, sibling);
    }

    /**
     * Get the amount of padding and border an element has on its left side
     */
    static getLeftPaddingAndBorder(element : JQuery) : number {
        return toNumber(element.css('border-left-width')) +
               toNumber(element.css('border-top-width'));
    }

    /**
     * Calculate if an element is in the bounds of its parent
     */
    calculateBounds(parent : DDTElement, diffY : number = 0, positions : DDTCoords = null) : DDTBoundsResult {
        // Just some calculations
        var ourOffset    = positions ? positions.y : this.offsetTop();
        var ourHeight    = this.element.outerHeight();
        var parentOffset = parent.offsetTop();
        var parentHeight = parent.element.outerHeight();

        if (ourOffset < parentOffset) {
            return DDTBoundsResult.LOW;
        }

        if (ourOffset + ourHeight < parentOffset + parentHeight + diffY) {
            return DDTBoundsResult.IN;
        }

        return DDTBoundsResult.HIGH;
    }

    /**
     * Deep clone an element, with the ability to ignore elements
     */
    clone(ignoreElements : Element[] = [], copyStyles : boolean = false) : DDTElement {

        var cloneFn = (el : JQuery) => {
            var clone     = $(document.createElement(el[0].tagName));
            var children  = el.children();

            if (copyStyles) {
                DDTElement.cloneAttributes(el[0], clone[0], ['class', 'id']);
                DDTElement.cloneUniqueStyles(el[0], clone[0]);
            } else {
                DDTElement.cloneAttributes(el[0], clone[0]);
            }

            if (!children.length) {
                // If we have no children, just set our text value. This is usually for table cells.
                clone.text(el.text());
            } else {

                el.children().each((idx, cEl) => {
                    // If we've not been told to ignore this element, clone it and append it to the parent
                    if (ignoreElements.indexOf(cEl) === -1) {
                        clone.append(cloneFn($(cEl)));
                    }                    
                });
            }

            return clone;
        };

        return new DDTElement(cloneFn(this.element));
    }

    static getUniqueStyles(element : Element, ignore : string[] = []) : Object {
        var ourStyles = window.getComputedStyle(element);
        var dummy     = document.createElement(element.tagName);
        document.body.appendChild(dummy);

        var dummyStyles = window.getComputedStyle(dummy);

        var pairs = _.chain(ourStyles)
            .pairs()
            .map(p => {
                var k = DDTCSS.arrowCase(p[0]);

                if (!ourStyles.getPropertyValue(k) || dummyStyles.getPropertyValue(k) === ourStyles.getPropertyValue(k)) {
                    return null;
                }

                return p;
            })
            .filter(p => !!p)
            .filter(p => ignore.indexOf(p[0]) === -1)
        .value();

        dummy.parentNode.removeChild(dummy);

        return _.object(pairs);
    }

    static cloneStyles(element : Element, clone : Element) {
        clone.setAttribute('style', window.getComputedStyle(element).cssText);
    }

    static cloneUniqueStyles(element : Element, clone : Element, ignore : string[] = []) {
        clone.setAttribute('style', DDTCSS.rulesToCSS(DDTElement.getUniqueStyles(element, ignore)));
    }

    static cloneAttributes(element : Element, clone : Element, ignore : string[] = ['id']) {
        var attrs = Array.prototype.slice.call(element.attributes);

        if (ignore) {
            attrs = attrs.filter(attr => ignore.indexOf(attr.name) === -1);
        }

        attrs.forEach(attr => clone.setAttribute(attr.name, attr.value));
    }

    static getInheritedBackgroundColor(el : JQuery) : string {
        var color = el.css('background-color');

        if (!el.is('body') && color === 'transparent' || color === 'rgba(0, 0, 0, 0)') {
            return DDTElement.getInheritedBackgroundColor(el.parent());
        }

        return color;
    }

    static getVerticalBorders(el : JQuery) : number {
        return toNumber(el.css('border-top-width')) + toNumber(el.css('border-bottom-width'));
    }
}

export class DDTPositionableElement extends DDTElement {

    /**
     * @todo This is far too messy, clean it up
     */
    attachToCursor(container : JQuery, diff : DDTCoords = null, axis : DDTAxis[] = null, bound : Element = null) {

        var bodyElement = new DDTElement($('body'));
        var boundElement : DDTElement;

        if (bound) {
            boundElement = new DDTElement($(bound));
        }

        bodyElement.notSelectable();

        var updateFunction = (event : Event) => {
            var position = DDTCoords.fromEvent(event);

            if (diff) {
                position = position.minus(diff);
            }

            if (boundElement) {
                var borders = DDTElement.getVerticalBorders(this.element.find('> tbody > tr > td').eq(0));
                var bounds = this.calculateBounds(boundElement, borders, position);

                if (bounds !== DDTBoundsResult.IN) {
                    var newPos = boundElement.offsetTop();

                    if (bounds === DDTBoundsResult.HIGH) {
                        newPos += boundElement.element.height() - this.element.height() + borders;
                    }

                    position = new DDTCoords(position.x, newPos);
                }
            }

            this.setPosition(position, axis);
        };

        container
            .on('mousemove', updateFunction)
            .one('mouseup', () => {
                container.off('mousemove', updateFunction);
                bodyElement.selectable();
            });
    }

    setPosition(coords : DDTCoords, axis : DDTAxis[] = null) {

        if (!axis) {
            axis = [DDTAxis.X, DDTAxis.Y]
        }

        var obj : { top ?: number; left ?: number; } = {};

        if (axis.indexOf(DDTAxis.X) > -1) {
            obj.left = coords.x;
        }

        if (axis.indexOf(DDTAxis.Y) > -1) {
            obj.top = coords.y;
        }

        this.element.css(obj);

        var pos = this.element.offset();

        this.emitter.emit('ddt.position', [new DDTCoords(pos.left, pos.top)]);
    }
}

export class DDTRow extends DDTElement {}

export class DDTShadowRow extends DDTRow {

    constructor(element : JQuery) {
        super(element);

        element.addClass(DDTElement.shadowRow);
    }
}

export class DDTTable extends DDTPositionableElement {
    createShadow(row : DDTRow) : DDTShadowTable {
        var tbody       = this.element.children('tbody');
        var clonedRow   = row.clone();
        var clonedTable = this.clone(Array.prototype.slice.call(this.element.children('tbody, thead, colgroup')));
        var shadowTable = new DDTShadowTable(clonedTable.element);
        var shadowRow   = new DDTShadowRow(clonedRow.element);

        var width : number;

        if (this.element.css('border-collapse') === 'collapse') {
            width = tbody.outerWidth() + (toNumber(tbody.css('border-left-width')) / 2) + (toNumber(tbody.css('border-right-width')) / 2);
        } else {
            width = toNumber(this.element.css('width'));
        }

        shadowTable.element.width(width);
        shadowTable.setShadowRow(shadowRow);
        shadowTable.fixBackgroundColor(row);
        shadowTable.fixColGroup(row);

        DDTElement.cloneUniqueStyles(this.getTbody(), shadowTable.getTbody());

        return shadowTable;
    }

    getTbody() : Element {
        return this.element.find('tbody')[0];
    }
}

export class DDTShadowTable extends DDTTable {

    public row : DDTShadowRow;

    constructor(element : JQuery) {
        super(element);

        if (!element.find('tbody').length) {
            $(document.createElement('tbody')).appendTo(element);
        }

        element.addClass(DDTElement.shadowTable);
    }

    setShadowRow(row : DDTShadowRow) {
        this.element.find('tbody').append(row.element);
        this.row = row;
    }

    fixBackgroundColor(row : DDTRow) {
        this.row.element.css('background', DDTElement.getInheritedBackgroundColor(row.element));
    }

    fixColGroup(row : DDTRow) {
        var colgroup = $(document.createElement('colgroup'));
        var cols : JQuery[];

        if (this.element.children('colgroup').length) {
            this.element.children('colgroup').remove();
        }

        cols = _.map(
            row.element.children('td'),
            td => $(document.createElement('col')).width($(td).outerWidth())
        );

        colgroup.append(cols);

        this.element.prepend(colgroup);
    }
}

export class DragAndDropTable {

    public emitter : DDTEventEmitter;

    public options = {
        verticalOnly : true,
        boundToTBody : true,
        rowSelector  : '> tbody > tr'
    };

    private table : DDTTable;
    private $rows : JQuery;

    private enabled          = true;
    private couldHaveChanged = false;

    private _options         = { enabled : false };

    private static window    = new DDTElement($(window));
    private static $document = $(document);

    private lastValues : any[];

    constructor(table : JQuery) {
        this.table      = new DDTTable(table);
        this.emitter    = new DDTEventEmitter();
        this.$rows      = this.getRows();
        this.lastValues = this.calculateValues();

        this.wireEvents();
    }

    wireEvents() {
        this.table.element.on('mousedown', this.options.rowSelector, e => {
            if (this.enabled && e.which === 1) {
                this.dragRow($(e.currentTarget), DDTCoords.fromEvent(e))
            }
        });
    }

    dragRow(rowElement : JQuery, mousePosition : DDTCoords) {
        var row         = new DDTRow(rowElement);
        var shadow      = this.table.createShadow(row);
        var rowPosition = DDTCoords.fromJQuery(rowElement);
        var diff        = mousePosition.minus(rowPosition);
        var tbody       = this.table.element.children('tbody');
        var offBy       = this.calculateOffBy(rowElement[0], tbody);

        shadow.element.appendTo('body');
        shadow.emitter.on('ddt.position', coords => this.dragged(row, shadow, coords));

        shadow.attachToCursor(
            DragAndDropTable.$document,
            diff.add(offBy),
            this.getMovingAxis(),
            this.getBindingElement()
        );

        // Set the initial position of the shadow
        shadow.setPosition(rowPosition.minus(offBy));

        // Hide the row that we've started to drag, as the shadow has replaced it
        row.hide();

        DragAndDropTable.$document.one('mouseup', () => this.endDrag(row, shadow));
    }


    disable()       { this._options.enabled = false; }
    enable()        { this._options.enabled = true; }
    toggleEnabled() { this._options.enabled ? this.disable() : this.enable(); }

    private getBindingElement() { return this.options.boundToTBody ? this.table.getTbody() : null }
    private getMovingAxis()     { return this.options.verticalOnly ? [DDTAxis.Y] : [DDTAxis.X, DDTAxis.Y]; }
    private getRows()           { return this.table.element.find(this.options.rowSelector); }
    private calculateValues()   { return _.map(this.$rows, row => $(row).data('value')); }

    private calculateOffBy(row : Element, tbody : JQuery) : DDTCoords {
        var styles = window.getComputedStyle(row);
        var minus  = [0, 0]; 

        if (styles['border-collapse'] === 'separate') {
            minus[1] = toNumber(styles['border-spacing'].split(' ')[1]);
        } else {
            minus[0] = (toNumber(tbody.css('border-right-width')) - toNumber(tbody.css('border-left-width'))) / 2;
        }

        return new DDTCoords(minus[0], minus[1]);
    }

    private dragged(row : DDTRow, shadow : DDTShadowTable, coords : DDTCoords) {
        this.handleScrolling(shadow);
        this.handleRowSwapping(row, shadow, coords);
    }

    private endDrag(row : DDTRow, shadow : DDTShadowTable) {
        shadow.element.remove();
        row.show();

        if (this.couldHaveChanged) {

            var values = this.calculateValues();
            
            if (this.hasChanged(values)) {
                this.emitValues(values);
            }

            this.couldHaveChanged = false;
            this.$rows      = null;
        }
    }

    private handleRowSwapping(row : DDTRow, shadow : DDTShadowTable, coords : DDTCoords) {
        var rows               = this.$rows = this.getRows();
        var node               = row.getNode();
        var rowsWithoutOurNode = _.filter(rows, tr => tr !== node);

        var res = _.some(rowsWithoutOurNode, tr => {
            var toSwapWith = this.calculateRowToSwapWith(tr, coords, shadow);

            if (toSwapWith && row.getNode() !== toSwapWith[0]) {
                this.swap(row, new DDTElement(toSwapWith), shadow);

                return true;
            }
        });

        if (res) {
            this.couldHaveChanged = true;
        }
    }

    private hasChanged(values : any[] = this.calculateValues()) {
        return _.some(values, (val, i) => val !== this.lastValues[i]);
    }


    private emitValues(values : any[] = this.calculateValues()) {
        this.emitter.emit('ddt.order', [values]);
        
        this.lastValues = values;
    }

    private swap(row : DDTRow, toSwapWith : DDTElement, shadow : DDTShadowTable) {
        row.swap(toSwapWith);
        DDTElement.cloneUniqueStyles(row.element[0], shadow.row.element[0], ['visibility']);
        shadow.fixBackgroundColor(row);
    }

    private calculateRowToSwapWith(currentRow : Element, coords : DDTCoords, shadow : DDTShadowTable) {
        var rowCoords   = DDTCoords.fromElement(currentRow);
        var $tr         = $(currentRow);
        var limits      = shadow.calculateBounds(this.table);

        var toSwapWith : JQuery;

        if (limits === DDTBoundsResult.LOW) {
            toSwapWith = $(this.$rows[0]);
        } else if (limits === DDTBoundsResult.HIGH) {
            toSwapWith = $(_.last(this.$rows));
        } else if (coords.isOverAxis(rowCoords, $tr.height() / 2, DDTAxis.Y)) {
            toSwapWith = $tr;
        }

        return toSwapWith;
    }

    private handleScrolling(shadow : DDTShadowTable) {
        if (shadow.calculateBounds(this.table, shadow.row.element.outerHeight()) !== DDTBoundsResult.IN) {
            return;
        }

        switch (shadow.calculateBounds(DragAndDropTable.window)) {
            case DDTBoundsResult.HIGH:
                document.body.scrollTop += 5;
            break;

            case DDTBoundsResult.LOW:
                document.body.scrollTop -= 5;
            break;
        }
    }
}

DDTCSS.defineClass(DDTElement.notVisible, { visibility: 'hidden'});
DDTCSS.defineClass(DDTElement.shadowTable, { position : 'absolute !important', zIndex: 999999 });
DDTCSS.defineClass(DDTElement.shadowRow, { position : 'relative !important ' });
DDTCSS.defineSelector('.' + DDTElement.noSelect + ', .' + DDTElement.noSelect + ' *', {
    WebkitUserSelect : 'none',
    MsUserSelect     : 'none',
    OUserSelect      : 'none',
    userSelect       : 'none',

    cursor           : 'default'
});
