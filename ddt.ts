/// <reference path='./typings/tsd.d.ts' />

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

    static fromEvent   = (event : JQueryEventObject) => new DDTPoint(event.pageX, event.pageY);
    static fromElement = (element : Element)         => DDTPoint.fromJQuery($(element));

    static fromJQuery(jquery : JQuery) {
        var offset = jquery.offset();

        return new DDTPoint(offset.left, offset.top);
    }

    private static enumToAxis = (axis : DDTAxis) => axis === DDTAxis.X ? 'x' : 'y';
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
    static defineSelector(selectorName : string, rules : Object, newElement : boolean = false) {
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

        var sheet = <CSSStyleSheet> element.sheet;
        sheet.addRule(selectorName, DDTCSS.rulesToCSS(rules), 0);

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


    /**
     * Get the amount of padding and border an element has on its left side
     */
    static getLeftPaddingAndBorder(element : JQuery) : number {
        return toNumber(element.css('border-left-width')) +
               toNumber(element.css('border-top-width'));
    }

    static getParentWithSelector(el : JQuery, selector : string, topEl = document.body) : JQuery {
        var worker = (jq : JQuery) => {
            if (jq.is(selector)) {
                return jq;
            }

            if (jq.is(topEl)) {
                return null;
            }

            return worker(jq.parent());
        };

        return worker(el);
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

        this.emitter.trigger('ddt.position', [new DDTPoint(pos.left, pos.top)]);
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
    verticalOnly    : boolean;
    bindToTable     : boolean;
    rowSelector     : string;
    handleSelector  : string;
    ignoreSelector  : string;
    cursor          : string;
    valueAttribute  : string;
    shadowContainer : Element;
    containment     : Element;
}

export class DragAndDropTable {

    public emitter : EventEmitter;
    public options : DragAndDropTableOptions;

    public static defaultOptions : DragAndDropTableOptions = {
        verticalOnly    : true,
        containment     : null,
        bindToTable     : true,
        ignoreSelector  : null,
        rowSelector     : 'tbody > tr',
        handleSelector  : null,
        shadowContainer : document.body,
        cursor          : 'default',
        valueAttribute  : 'data-value'
    };

    private table      : DDTTable;
    private $rows      : JQuery;
    private lastValues : any[];

    private couldHaveChanged = false;

    private _options         = { enabled : false };

    private static window    = new DDTElement($(window));
    private static $document = $(document);

    private cache : {
        tableOffset ?: number;
        rowPoints ?: DDTPoint[];
    } = {};

    constructor(table : JQuery) {
        this.options    = _.clone(DragAndDropTable.defaultOptions);
        this.table      = new DDTTable(table);
        this.emitter    = new EventEmitter();
        this.$rows      = this.getRows();
        this.lastValues = this.calculateValues();

        this.wireEvents();
    }

    wireEvents() {
        this.table.element.on('mousedown', e => {

            if (!this.isEnabled() || e.which !== 1) {
                return;
            }

            var $row = this.getRowFromEvent(e);

            if (!$row) {
                return;
            }

            if (this.options.ignoreSelector && $row.is(this.options.ignoreSelector)) {
                return;
            }

            this.dragRow($row, DDTPoint.fromEvent(e))
        });
    }

    dragRow(rowElement : JQuery, mousePosition : DDTPoint) {
        var row         = new DDTRow(rowElement);
        var shadow      = this.table.createShadow(row);
        var rowPosition = DDTPoint.fromJQuery(rowElement);
        var diff        = mousePosition.minus(rowPosition);
        var tbody       = this.table.element.children('tbody');
        var offBy       = this.calculateOffBy(rowElement[0], tbody);
        var cssEl       = DDTCSS.defineSelector('body', { cursor : this.options.cursor }, true);

        this.cache.tableOffset = this.table.offsetTop();
        this.cacheRowPoints();

        shadow.element.appendTo(this.options.shadowContainer);
        shadow.emitter.on('ddt.position', (point : DDTPoint) => this.dragged(row, shadow, point));

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
    toggleEnabled() { this._options.enabled ? this.disable() : this.enable(); }

    isEnabled = () => this._options.enabled;

    private getMovingAxis    = () => this.options.verticalOnly ? [DDTAxis.Y] : [DDTAxis.X, DDTAxis.Y];
    private getRows          = () => this.table.element.find(this.options.rowSelector);
    private calculateValues  = () => _.map(this.$rows, row => $(row).attr(this.options.valueAttribute));
    private getEventSelector = () => this.options.handleSelector || this.options.rowSelector;

    private cacheRowPoints() {
        this.cache.rowPoints   = _.map(this.getRows(), tr => DDTPoint.fromElement(tr));
    }

    private getRowFromEvent(e : JQueryEventObject) {
        var $target = $(e.target);
        var selector = this.getEventSelector();
        var node = this.table.getNode();

        var clicked = DDTElement.getParentWithSelector($target, selector, node);

        if (!clicked || !this.options.handleSelector) {
            return clicked;
        }

        return DDTElement.getParentWithSelector(clicked, this.options.rowSelector, node);
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

    private calculateOffBy(row : Element, tbody : JQuery) : DDTPoint {
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
        this.emitter.trigger('ddt.order', [values]);
        
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
}

export function init(table : JQuery) : DragAndDropTable {
    return new DragAndDropTable(table);
}

DDTCSS.defineClass(DDTElement.notVisible, { visibility: 'hidden'});
DDTCSS.defineClass(DDTElement.shadowTable, { position : 'absolute !important', zIndex: 999999 });
DDTCSS.defineSelector('.' + DDTElement.noSelect + ', .' + DDTElement.noSelect + ' *', {
    WebkitUserSelect : 'none',
    MsUserSelect     : 'none',
    OUserSelect      : 'none',
    userSelect       : 'none'
});
