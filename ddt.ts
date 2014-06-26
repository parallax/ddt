/// <reference path='./typings/jquery/jquery.d.ts' />
/// <reference path='./typings/lodash/lodash.d.ts' />

import $ = require('jquery');
import _ = require('lodash');

interface Window {
    getMatchedCSSRules(element : Element) : CSSRuleList;
}

export interface Event {
    pageX : number;
    pageY : number;
}

class DDTEvents {
    static shadowPosition = 'ddt.position';
    static reorder        = 'ddt.order';
}

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

export enum DDTCoordsAxis { X, Y };

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

    addToAxis(size : number, axisEnum : DDTCoordsAxis) {
        if (axisEnum === DDTCoordsAxis.X) {
            return new DDTCoords(this.x + size, this.y);
        }

        return new DDTCoords(this.x, this.y + size);
    }

    gt(coords : DDTCoords, axisEnum: DDTCoordsAxis) {
        var axis = DDTCoords.enumToAxis(axisEnum);
        return this[axis] > coords[axis];
    }

    lt(coords : DDTCoords, axisEnum : DDTCoordsAxis) {
        var axis = DDTCoords.enumToAxis(axisEnum);
        return this[axis] < coords[axis];
    }

    isOverAxis(coords : DDTCoords, size : number, axis : DDTCoordsAxis) {
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

    private static enumToAxis(axis : DDTCoordsAxis) {
        return axis === DDTCoordsAxis.X ? 'x' : 'y';
    }
}

class DDTCSS {
    static notVisible  = 'DDTNotVisible';
    static shadowTable = 'DDTShadowTable';
    static shadowRow   = 'DDTShadowRow';
    static noSelect    = 'DDTNoSelect';

    static defineSelector(selectorName : string, rules : Object) {
        var style = document.createElement('style');

        style.appendChild(document.createTextNode(''));

        document.head.appendChild(style);

        var sheet = <CSSStyleSheet> style.sheet;
        sheet.addRule(selectorName, DDTCSS.rulesToCSS(rules), 0);
    }

    static defineClass(className : string, rules : Object) {
        return DDTCSS.defineSelector('.' + className, rules);
    }

    private static rulesToCSS(rules : Object) : string {
        return _.chain(rules)
            .pairs()
            .map(p => [this.arrowCase(p[0]), ':', p[1], ';'])
            .flatten()
            .join('')
        .value();
    }

    private static arrowCase(name : string) {
        return name.replace(/([A-Z])/g, '-$1').toLowerCase();
    }
}

class DDTElement {

    element : JQuery;
    emitter : DDTEventEmitter;

    constructor(element : JQuery) {
        this.element = element;
        this.emitter = new DDTEventEmitter();
    }

    getNode() {
        return this.element[0];
    }

    /**
     * @todo This function is too complicated to be self-documenting. Document it.
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
        this.element.removeClass(DDTCSS.notVisible);
    }

    hide() {
        this.element.addClass(DDTCSS.notVisible);
    }

    notSelectable() {
        this.element.addClass(DDTCSS.noSelect);
    }

    selectable() {
        this.element.removeClass(DDTCSS.noSelect);
    }

    getStyles() {
        return window.getComputedStyle(this.getNode());
    }

    cloneStyles(element : DDTElement) {
        this.applyStyles(element.getStyles());
    }

    applyStyles(styles : CSSStyleDeclaration) {
        this.element.attr('style', styles.cssText);
    }
}

class DDTPositionableElement extends DDTElement {

    /**
     * @todo This is far too messy, clean it up
     * @param diff
     */
    attachToCursor(diff : DDTCoords = null) {

        var bodyElement = new DDTElement($('body'));

        bodyElement.notSelectable();

        var updateFunction = (event : Event) => {
            var position = DDTCoords.fromEvent(event);

            if (diff) {
                position = position.minus(diff);
            }

            this.setPosition(position);
        };

        var $doc = $(document);

        $doc
            .on('mousemove', updateFunction)
            .one('mouseup', () => {
                $doc.off('mousemove', updateFunction);
                bodyElement.selectable();
            });
    }

    setPosition(coords : DDTCoords) {
        this.element.css({
            top  : coords.y,
            left : coords.x
        });

        this.emitter.emit(DDTEvents.shadowPosition, [coords]);
    }
}

class DDTRow extends DDTElement {

}

class DDTShadowRow extends DDTRow {

    constructor(element : JQuery) {
        super(element);

        element.addClass(DDTCSS.shadowRow);
    }

    cloneHTML(element : DDTElement) {
        this.getNode().innerHTML = element.getNode().innerHTML;
    }
}

class DDTTable extends DDTPositionableElement {
    createShadow(row : DDTRow) : DDTShadowTable {
        var shadowTable = new DDTShadowTable($(document.createElement('table')));
        var shadowRow   = new DDTShadowRow($(document.createElement('tr')));

        if (this.element.find('colgroup').length) {
            shadowTable.element.prepend(this.element.find('colgroup').clone());
        }

        shadowTable.element.width(this.element.width());

        shadowRow.cloneStyles(row);
        shadowRow.cloneHTML(row);

        shadowTable.setShadowRow(shadowRow);

        return shadowTable;
    }
}

class DDTShadowTable extends DDTTable {

    public row : DDTShadowRow;

    constructor(element : JQuery) {
        super(element);

        element.addClass(DDTCSS.shadowTable);
    }

    setShadowRow(row : DDTShadowRow) {
        this.element.append(row.element);
        this.row = row;
    }
}

export class DragAndDropTable {

    public emitter : DDTEventEmitter;

    private table : DDTTable;

    constructor(table : JQuery) {
        this.table   = new DDTTable(table);
        this.emitter = new DDTEventEmitter();

        this.wireEvents();
    }

    wireEvents() {
        this.table.element.on('mousedown', 'tbody tr', e => this.dragRow($(e.currentTarget), DDTCoords.fromEvent(e)));
    }

    // @todo This is far too messy. Clean it up
    dragRow(rowElement : JQuery, mousePosition : DDTCoords) {
        var row         = new DDTRow(rowElement);
        var shadow      = this.table.createShadow(row);
        var rowPosition = DDTCoords.fromJQuery(rowElement);
        var diff        = mousePosition.minus(rowPosition);

        row.hide();

        shadow.element.appendTo('body');

        shadow.emitter.on(DDTEvents.shadowPosition, (coords : DDTCoords) => {
            this.table.element.find('tbody tr').each((idx, tr) => {

                if (tr === row.getNode()) {
                    return;
                }

                var rowCoords = DDTCoords.fromElement(tr);

                if (coords.isOverAxis(rowCoords, $(tr).height() / 2, DDTCoordsAxis.Y)) {
                    row.swap(new DDTElement($(tr)));

                    row.show();
                    shadow.row.cloneStyles(row);
                    row.hide();

                    this.emitter.emit(DDTEvents.reorder, [
                        _.map(this.table.element.find('tr'), tr => $(tr).data('value'))
                    ]);
                }
            });
        });

        var spacing = row.getStyles()['border-spacing'].split(' ').map(n => parseInt(n, 10));

        shadow.attachToCursor(diff);
        shadow.setPosition(rowPosition.minus(new DDTCoords(0, spacing[1])));

        $(document).one('mouseup', () => {
            shadow.element.remove();

            row.show();
        });
    }
}

DDTCSS.defineClass(DDTCSS.notVisible, { visibility: 'hidden'});
DDTCSS.defineClass(DDTCSS.shadowTable, { position : 'absolute !important' });
DDTCSS.defineClass(DDTCSS.shadowRow, { position : 'relative !important ' });
DDTCSS.defineSelector('.' + DDTCSS.noSelect + ', .' + DDTCSS.noSelect + ' *', {
    WebkitUserSelect : 'none',
    MsUserSelect     : 'none',
    OUserSelect      : 'none',
    userSelect       : 'none',

    cursor           : 'default'
});
