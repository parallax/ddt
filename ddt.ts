/// <reference path='./typings/jquery/jquery.d.ts' />
/// <reference path='./typings/lodash/lodash.d.ts' />

import $ = require('jquery');
import _ = require('lodash');

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
export enum DDTAxis { X, Y };


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

    minus(coords : DDTCoords) {
        return new DDTCoords(this.x - coords.x, this.y - coords.y);
    }

    add(coords : DDTCoords) {
        return new DDTCoords(this.x + coords.x, this.y + coords.y);
    }

    /**
     * Add a certain amount to a specific axis
     */
    addToAxis(size : number, axis : DDTAxis) {
        if (axis === DDTAxis.X) {
            return new DDTCoords(this.x + size, this.y);
        }

        return new DDTCoords(this.x, this.y + size);
    }

    gt(coords : DDTCoords, axis: DDTAxis) {
        var key = DDTCoords.enumToAxis(key);
        return this[key] > coords[key];
    }

    lt(coords : DDTCoords, axis : DDTAxis) {
        var key = DDTCoords.enumToAxis(key);
        return this[key] < coords[key];
    }

    /**
     * Calculation taken from jQuery UI sortable.
     *
     * Used to calculate if a coords is over another coords by a certain amount
     */
    isOverAxis(coords : DDTCoords, size : number, axis : DDTAxis) {
        return this.gt(coords, axis) && this.lt(coords.addToAxis(size, axis), axis);
    }

    static fromEvent(event : Event) {
        return new DDTCoords(event.pageX, event.pageY);
    }

    static fromElement(element : Element) {
        return DDTCoords.fromJQuery($(element));
    }

    static fromJQuery(jquery : JQuery) {
        var offset = jquery.offset();

        return new DDTCoords(offset.left, offset.top);
    }

    private static enumToAxis(axis : DDTAxis) {
        return axis === DDTAxis.X ? 'x' : 'y';
    }
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
    static arrowCase(name : string) {
        return name.replace(/([A-Z])/g, '-$1').toLowerCase();
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
    getNode() : HTMLElement {
        return this.element[0];
    }

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

    show() {
        this.element.removeClass(DDTElement.notVisible);
    }

    hide() {
        this.element.addClass(DDTElement.notVisible);
    }

    notSelectable() {
        this.element.addClass(DDTElement.noSelect);
    }

    selectable() {
        this.element.removeClass(DDTElement.noSelect);
    }

    /**
     * Get the amount of padding and border an element has on its left side
     */
    static getLeftPaddingAndBorder(element : JQuery) : number {
        return parseInt(element.css('border-left-width') || '0', 10) +
               parseInt(element.css('border-top-width') || '0', 10);
    }

    /**
     * Get the offset top of an element from a parent, taking into account that jQuery may return
     * undefined.
     */
    offsetTop() {
        return (this.element.offset() || { top : 0  }).top;
    }

    /**
     * Calculate if an element is in the bounds of its parent
     */
    calculateBounds(parent : DDTElement, diffY : number = 0) : DDTBoundsResult {
        // Just some calculations
        var ourOffset    = this.offsetTop();
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
    clone(ignoreElements : Element[] = []) : DDTElement {

        var cloneFn = (el : JQuery) => {
            var clone = $(document.createElement(el[0].tagName));
            var children = el.children();

            DDTElement.cloneUniqueStyles(el[0], clone[0]);

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
        }

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
                var v = p[1];

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
}

export class DDTPositionableElement extends DDTElement {

    /**
     * @todo This is far too messy, clean it up
     * @param diff
     */
    attachToCursor(container : JQuery, diff : DDTCoords = null, axis : DDTAxis[] = null) {

        var bodyElement = new DDTElement($('body'));

        bodyElement.notSelectable();

        var updateFunction = (event : Event) => {
            var position = DDTCoords.fromEvent(event);

            if (diff) {
                position = position.minus(diff);
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
        var clonedRow   = row.clone();
        var clonedTable = this.clone(Array.prototype.slice.call(this.element.find('tbody, thead')));
        var shadowTable = new DDTShadowTable(clonedTable.element);
        var shadowRow   = new DDTShadowRow(clonedRow.element);
        var width       = this.element.outerWidth();

        if (this.element.css('border-collapse') === 'collapse') {
            width += DDTElement.getLeftPaddingAndBorder(this.element.find('tbody'));
        }

        shadowTable.element.css('height', 'auto');
        shadowTable.element.width(width);

        shadowTable.setShadowRow(shadowRow);

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
}

export class DragAndDropTable {

    public emitter : DDTEventEmitter;

    private verticalOnly = true;

    private table     : DDTTable;
    private window    : DDTElement;
    private $document : JQuery;

    private enabled      = true;
    private scrolling    = false;

    private static rowSelector = 'tbody tr';

    constructor(table : JQuery) {
        this.table     = new DDTTable(table);
        this.emitter   = new DDTEventEmitter();
        this.window    = new DDTElement($(window));
        this.$document = $(document);

        this.wireEvents();
    }

    enable()        { this.enabled = true; }
    disable()       { this.enabled = false; }
    toggleEnabled() { this.enabled ? this.disable() : this.enable(); }

    wireEvents() {
        this.table.element.on('mousedown', DragAndDropTable.rowSelector, e => {
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

        row.hide();

        shadow.element.appendTo('body');
        shadow.emitter.on('ddt.position', coords => this.dragged(row, shadow, coords));

        var styles  = window.getComputedStyle(rowElement[0]);
        var spacing : number[];

        if (styles['border-collapse'] === 'separate') {
            spacing = [0, styles['border-spacing'].split(' ').map(n => parseInt(n, 10))[1]]
        } else {
            spacing = [DDTElement.getLeftPaddingAndBorder(this.table.element.find('tbody')) / 2, 0];
        }

        var spacingCoords = new DDTCoords(spacing[0], spacing[1]);
        var axis          = this.verticalOnly ? [DDTAxis.Y] : [DDTAxis.X, DDTAxis.Y];

        shadow.attachToCursor(this.$document, diff.add(spacingCoords), axis);
        shadow.setPosition(rowPosition.minus(spacingCoords));

        this.$document.one('mouseup', () => this.endDrag(row, shadow));
    }

    private dragged(row : DDTRow, shadow : DDTShadowTable, coords : DDTCoords) {
        this.handleScrolling(shadow);
        this.handleRowSwapping(row, shadow, coords);
    }

    private endDrag(row : DDTRow, shadow : DDTShadowTable) {
        shadow.element.remove();

        row.show();
    }

    private handleRowSwapping(row : DDTRow, shadow : DDTShadowTable, coords : DDTCoords) {
        var rows = this.table.element.find(DragAndDropTable.rowSelector);

        var res = _.some(rows, tr => {
            // If this is the element we're dragging, we don't want to do any calculations on it
            if (tr === row.getNode()) {
                return;
            }

            var rowCoords = DDTCoords.fromElement(tr);
            var $tr       = $(tr);

            if (coords.isOverAxis(rowCoords, $tr.height() / 2, DDTAxis.Y)) {
                row.swap(new DDTElement($tr));
                DDTElement.cloneUniqueStyles(row.element[0], shadow.row.element[0], ['visibility']);

                return true;
            }
        });

        if (res) {
            this.emitValues(rows);
        }
    }

    private emitValues(rows : JQuery) {
        this.emitter.emit('ddt.order', [
            _.map(rows, tr => $(tr).data('value'))
        ]);
    }

    private handleScrolling(shadow : DDTShadowTable) {
        var bounds = shadow.calculateBounds(this.window);

        if (bounds === DDTBoundsResult.IN) {
            return;
        }

        var tableBounds = shadow.calculateBounds(this.table, shadow.row.element.outerHeight());

        if (tableBounds !== DDTBoundsResult.IN) {
            return;
        }

        if (bounds === DDTBoundsResult.HIGH) {
            document.body.scrollTop += 5;
        }

        if (bounds === DDTBoundsResult.LOW) {
            document.body.scrollTop -= 5;
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