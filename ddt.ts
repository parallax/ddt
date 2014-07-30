/// <reference path='typings/tsd.d.ts' />

import $            = require('jquery');
import _            = require('lodash');
import EventEmitter = require('eventEmitter');

// Simple parseInt wrapper
var toNumber = (n : any) => parseInt(n, 10) || 0;

/**
 * An enum representing the two different axis
 */
export enum DDTAxis { X, Y }

/**
 * The result of a bounds calculation.
 */
export enum DDTBounds { LOW, IN, HIGH }

/**
 * Interface for an object containing pageX and pageY events
 */
export interface DDTMouseEvent {
    pageX : number;
    pageY : number;
}

/**
 * Little any key vs any value map
 */
export class DDTMap<K,V> {
    private keys : K[];
    private values : V[];

    constructor() {
        this.keys = [];
        this.values = [];
    }

    has(key : K) {
        return this.keys.indexOf(key) > -1;
    }

    get(key : K) : V {
        if (!this.has(key)) {
            throw new Error('Value for key ' + key + ' not found');
        }

        return this.values[this.keys.indexOf(key)];
    }

    set(key : K, value : V) : DDTMap<K, V> {
        if (this.keys.indexOf(key) === -1) {
            this.keys.push(key);
        }

        this.values[this.keys.indexOf(key)] = value;

        return this;
    }

    remove(key : K) : DDTMap<K, V> {
        if (this.has(key)) {
            this.values[this.keys.indexOf(key)] = undefined;
            this.keys[this.keys.indexOf(key)]   = undefined;
        }

        return this;
    }
}

/**
 * A class representing a point which we use across the whole library
 */
export class DDTPoint {

    [key : string] : any;

    x : number;
    y : number;

    constructor(x : number, y : number) {
        this.x = x;
        this.y = y;
    }

    minus(point : DDTPoint) { return new DDTPoint(this.x - point.x, this.y - point.y); }
    add(point : DDTPoint)   { return new DDTPoint(this.x + point.x, this.y + point.y); }


    gt(point : DDTPoint, axis : DDTAxis) {
        var key = DDTPoint.enumToAxis(axis);

        return this[key] > point[key];
    }

    lt(point : DDTPoint, axis : DDTAxis) {
        var key = DDTPoint.enumToAxis(axis);

        return this[key] < point[key];
    }

    /**
     * Add a certain amount to a specific axis
     */
    addToAxis(size : number, axis : DDTAxis) {
        var point = [this.x, this.y];

        point[axis === DDTAxis.X ? 0 : 1] += size;

        return new DDTPoint(point[0], point[1]);
    }

    /**
     * Calculation taken from jQuery UI sortable.
     *
     * Used to calculate if a point is over another point by a certain amount
     */
    isOverAxis(point : DDTPoint, size : number, axis : DDTAxis) {
        return this.gt(point, axis) && this.lt(point.addToAxis(size, axis), axis);
    }

    static fromEvent   = (event   : DDTMouseEvent)   => new DDTPoint(event.pageX, event.pageY);
    static fromElement = (element : Element)         => DDTPoint.fromJQuery($(element));

    static fromJQuery(jquery : JQuery) {
        var offset = jquery.offset() || { top : 0, left : 0 };

        return new DDTPoint(offset.left || 0, offset.top || 0 );
    }

    static enumToAxis = (axis : DDTAxis) => axis === DDTAxis.X ? 'x' : 'y';
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

    static styleElement : HTMLStyleElement;
    static currentIndexes : DDTMap<HTMLStyleElement, number>;

    /**
     * Define a specific selector with some rules for it
     */
    static defineSelector(selectorName : string, rules : Object, newElement : boolean = false) {

        if (!DDTCSS.currentIndexes) {
            DDTCSS.currentIndexes = new DDTMap<HTMLStyleElement, number>();
        }

        var element : HTMLStyleElement;

        if (newElement || !DDTCSS.styleElement) {
            element = document.createElement('style');
            // Apparently we need a text node inside the style tag or this won't work.
            // This hasn't been tessed
            element.appendChild(document.createTextNode(''));

            document.head.appendChild(element);
        } else {
            element = DDTCSS.styleElement;
        }

        if (!newElement) {
            DDTCSS.styleElement = element;
        }

        if (!DDTCSS.currentIndexes.has(element)) {
            DDTCSS.currentIndexes.set(element, 0);
        }

        var sheet = <CSSStyleSheet> element.sheet;
        sheet.insertRule(selectorName + '{ ' + DDTCSS.rulesToCSS(rules) + ' }', DDTCSS.currentIndexes.get(element));

        DDTCSS.currentIndexes.set(element, DDTCSS.currentIndexes.get(element) + 1);

        return element;
    }

    static defineClass(className : string, rules : Object, newElement : boolean = false) {
        return DDTCSS.defineSelector('.' + className, rules, newElement);
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

    /**
     * Remove our node
     *
     * @todo Add support for when extra elements are created
     */
    static cleanup = () => {
        if (DDTCSS.currentIndexes) {
            DDTCSS.currentIndexes.remove(DDTCSS.styleElement);
        }

        DDTCSS.currentIndexes = null;

        if (DDTCSS.styleElement) {
            DDTCSS.styleElement.parentNode.removeChild(DDTCSS.styleElement);
        }

        DDTCSS.styleElement = undefined;
    }
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
    static noSelect    = 'DDTNoSelect';

    element : JQuery;
    emitter : EventEmitter;

    constructor(element : JQuery) {
        this.element = element;
        this.emitter = new EventEmitter();
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
     * Calculate if an element is in the bounds of its parent
     */
    calculateBounds(parent : DDTElement, diffY : number = 0, positions : DDTPoint = null, parentOffset = parent.offsetTop()) : DDTBounds {
        // Just some calculations
        var ourOffset    = positions ? positions.y : this.offsetTop();
        var ourHeight    = this.element.outerHeight();
        var parentHeight = parent.element.outerHeight();

        if (ourOffset < parentOffset) {
            return DDTBounds.LOW;
        }

        if (ourOffset + ourHeight < parentOffset + parentHeight + diffY) {
            return DDTBounds.IN;
        }

        return DDTBounds.HIGH;
    }

    /**
     * Deep clone an element, with the ability to ignore elements
     */
    clone(ignoreElements : Element[] = [], copyStyles : boolean = false) : DDTElement {

        var cloneFn = (el:JQuery) => {
            var clone = $(document.createElement(el[0].tagName));
            var children = el.children();

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

    static cloneUniqueStyles(element : Element, clone : Element, ignore : string[] = []) {
        clone.setAttribute('style', DDTCSS.rulesToCSS(DDTElement.getUniqueStyles(element, ignore)));
    }

    static cloneAttributes(element : Element, clone : Element, ignore : string[] = ['id']) {
        var attrs = Array.prototype.slice.call(element.attributes);

        if (ignore) {
            attrs = attrs.filter((attr : Attr) => ignore.indexOf(attr.name) === -1);
        }

        attrs.forEach((attr : Attr) => clone.setAttribute(attr.name, attr.value));
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
    attachToCursor(container : JQuery, diff : DDTPoint = null, axis : DDTAxis[] = null, bound : Element = null) {

        var bodyElement = new DDTElement($('body'));
        var boundElement : DDTElement;

        if (bound) {
            boundElement = new DDTElement($(bound));
        }

        bodyElement.notSelectable();

        var updateFunction = (event : JQueryEventObject) => {
            var position = DDTPoint.fromEvent(event);

            if (diff) {
                position = position.minus(diff);
            }

            if (boundElement) {
                var borders = DDTElement.getVerticalBorders(this.element.find('> tbody > tr > td').eq(0));
                var bounds  = this.calculateBounds(boundElement, borders, position);

                if (bounds !== DDTBounds.IN) {
                    var newPos = boundElement.offsetTop();

                    if (bounds === DDTBounds.HIGH) {
                        newPos += boundElement.element.height() - this.element.height() + borders;
                    }

                    position = new DDTPoint(position.x, newPos);
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

    setPosition(point : DDTPoint, axis : DDTAxis[] = null) {

        if (!axis) {
            axis = [DDTAxis.X, DDTAxis.Y]
        }

        var obj : { top ?: number; left ?: number; } = {};

        if (axis.indexOf(DDTAxis.X) > -1) {
            obj.left = point.x;
        }

        if (axis.indexOf(DDTAxis.Y) > -1) {
            obj.top = point.y;
        }

        this.element.css(obj);

        var pos = this.element.offset();

        this.emitter.trigger('position', [new DDTPoint(pos.left, pos.top)]);
    }
}

// @todo Investigate removing this
export class DDTRow extends DDTElement {}

// @todo Investigate removing this
export class DDTShadowRow extends DDTRow {}

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

export class DragAndDropTable extends EventEmitter {
    public options : DragAndDropTableOptions;

    public static defaultOptions : DragAndDropTableOptions = {
        verticalOnly    : true,
        containment     : null,
        bindToTable     : true,
        shadowContainer : document.body,
        cursor          : 'default',
        valueAttribute  : 'data-value'
    };

    public static hasCreatedSelectors = false;

    private table      : DDTTable;
    private $rows      : JQuery;
    private lastValues : any[];

    private couldHaveChanged = false;

    private _options         = { enabled : false };

    private static window    = new DDTElement($(window));
    private static $document = $(document);

    private rowSelector = '> tbody > tr';

    private cache : {
        tableOffset ?: number;
        rowPoints ?: DDTPoint[];
    } = {};

    constructor(table : JQuery, options : DragAndDropTableOptions = {}) {
        super();
        this.options    = _.clone(DragAndDropTable.defaultOptions);
        this.table      = new DDTTable(table);
        this.$rows      = this.getRows();
        this.lastValues = this.calculateValues();

        _.extend(this.options, options);

        this.wireEvents();
        DragAndDropTable.createSelectors();
    }

    wireEvents() {
        this.table.element.on('mousedown', this.rowSelector, e => {

            if (!this.isEnabled() || e.which !== 1) {
                return;
            }

            e.stopImmediatePropagation();

            var $row = $(e.currentTarget);
            this.dragRow($row, DDTPoint.fromEvent(e))
        });
    }

    dragRow(rowElement : JQuery, mousePosition : DDTPoint) {
        var row         = new DDTRow(rowElement);
        var shadow      = this.table.createShadow(row);
        var rowPosition = DDTPoint.fromJQuery(rowElement);
        var diff        = mousePosition.minus(rowPosition);
        var tbody       = this.table.element.children('tbody');
        var offBy       = DragAndDropTable.calculateOffBy(rowElement[0], tbody);
        var cssEl       = DDTCSS.defineSelector('body', { cursor : this.options.cursor }, true);

        this.cache.tableOffset = this.table.offsetTop();
        this.cacheRowPoints();

        shadow.element.appendTo(this.options.shadowContainer);
        shadow.emitter.on('position', (point : DDTPoint) => this.dragged(row, shadow, point));

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

        DragAndDropTable.$document.one('mouseup', () => this.endDrag(row, shadow, cssEl));
    }


    disable()       { this._options.enabled = false; }
    enable()        { this._options.enabled = true; }

    isEnabled = () => this._options.enabled;

    private getMovingAxis    = () => this.options.verticalOnly ? [DDTAxis.Y] : [DDTAxis.X, DDTAxis.Y];
    private getRows          = () => this.table.element.find(this.rowSelector);
    private calculateValues  = () => _.map(this.$rows, row => $(row).attr(this.options.valueAttribute));

    private cacheRowPoints() {
        this.cache.rowPoints   = _.map(this.getRows(), tr => DDTPoint.fromElement(tr));
    }

    private getBindingElement() {
        
        if (this.options.containment) {
            return this.options.containment;
        }

        if (this.options.bindToTable) {
            return this.table.getTbody();
        }

        return null;
    }

    private static calculateOffBy(row : Element, tbody : JQuery) : DDTPoint {
        var styles = window.getComputedStyle(row);
        var minus  = [0, 0]; 

        if (styles.getPropertyValue('border-collapse') === 'separate') {
            minus[1] = toNumber(styles.getPropertyValue('border-spacing').split(' ')[1]);
        } else {
            minus[0] = (toNumber(tbody.css('border-right-width')) - toNumber(tbody.css('border-left-width'))) / 2;
        }

        return new DDTPoint(minus[0], minus[1]);
    }

    private dragged(row : DDTRow, shadow : DDTShadowTable, point : DDTPoint) {
        this.handleScrolling(shadow);
        this.handleRowSwapping(row, shadow, point);
    }

    private endDrag(row : DDTRow, shadow : DDTShadowTable, cssEl : HTMLStyleElement) {
        shadow.element.remove();
        row.show();
        cssEl.parentNode.removeChild(cssEl);

        if (this.couldHaveChanged) {

            var values = this.calculateValues();
            
            if (this.hasChanged(values)) {
                this.emitValues(values);
            }

            this.couldHaveChanged = false;
            this.$rows      = null;
        }
    }

    private handleRowSwapping(row : DDTRow, shadow : DDTShadowTable, point : DDTPoint) {
        var rows = this.$rows = this.getRows();
        var node = row.getNode();

        _.each(rows, (tr, i) => {
            if (tr === node) {
                return;
            }

            var cachedPoint = this.cache.rowPoints[i];
            var toSwapWith = this.calculateRowToSwapWith(tr, point, shadow, cachedPoint);

            if (toSwapWith && row.getNode() !== toSwapWith[0]) {
                this.swap(row, new DDTElement(toSwapWith), shadow);

                return false;
            }
        });
    }

    private hasChanged(values : any[] = this.calculateValues()) {
        return _.some(values, (val, i) => val !== this.lastValues[i]);
    }

    private emitValues(values : any[] = this.calculateValues()) {
        this.trigger('reorder', [values]);
        
        this.lastValues = values;
    }

    private swap(row : DDTRow, toSwapWith : DDTElement, shadow : DDTShadowTable) {
        row.swap(toSwapWith);
        DDTElement.cloneUniqueStyles(row.element[0], shadow.row.element[0], ['visibility']);
        shadow.fixBackgroundColor(row);

        this.couldHaveChanged = true;
        this.cacheRowPoints();
    }

    private calculateRowToSwapWith(currentRow : Element, point : DDTPoint, shadow : DDTShadowTable, rowCoords : DDTPoint = DDTPoint.fromElement(currentRow)) {
        var $tr         = $(currentRow);
        var limits      = shadow.calculateBounds(this.table, 0, null, this.cache.tableOffset);

        var toSwapWith : JQuery;

        if (limits === DDTBounds.LOW) {
            toSwapWith = $(this.$rows[0]);
        } else if (limits === DDTBounds.HIGH) {
            toSwapWith = $(_.last(this.$rows));
        } else if (point.isOverAxis(rowCoords, $tr.height() / 2, DDTAxis.Y)) {
            toSwapWith = $tr;
        }

        return toSwapWith;
    }

    private handleScrolling(shadow : DDTShadowTable) {
        if (shadow.calculateBounds(this.table, shadow.row.element.outerHeight()) !== DDTBounds.IN) {
            return;
        }

        switch (shadow.calculateBounds(DragAndDropTable.window)) {
            case DDTBounds.HIGH:
                document.body.scrollTop += 5;
            break;

            case DDTBounds.LOW:
                document.body.scrollTop -= 5;
            break;
        }
    }

    static createSelectors() {
        if (DragAndDropTable.hasCreatedSelectors) {
            return;
        }

        DragAndDropTable.hasCreatedSelectors = true;

        DDTCSS.defineClass(DDTElement.notVisible, { visibility: 'hidden'});
        DDTCSS.defineClass(DDTElement.shadowTable, { position : 'absolute !important', zIndex: 999999 });
        DDTCSS.defineSelector('.' + DDTElement.noSelect + ', .' + DDTElement.noSelect + ' *', {
            WebkitUserSelect : 'none',
            MozUserSelect    : 'none',
            MsUserSelect     : 'none',
            OUserSelect      : 'none',
            userSelect       : 'none'
        });
    }
}

export function init(table : JQuery, options : DragAndDropTableOptions = {}) : DragAndDropTable {
    return new DragAndDropTable(table, options);
}
