/// <reference path='./typings/jquery/jquery.d.ts' />
/// <reference path='./typings/lodash/lodash.d.ts' />

interface Window {
    getMatchedCSSRules(element : Element) : CSSRuleList;
}

interface Event {
    pageX : number;
    pageY : number;
}

interface DDTPosition {
    top  : number;
    left : number;
}

class DDTCoords {

    x : number;
    y : number;

    constructor(x : number, y : number) {
        this.x = x;
        this.y = y;
    }

    minus(coords : DDTCoords) {
        return new DDTCoords(this.x - coords.x, this.y - coords.y);
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
        var css = '';

        _.chain(rules)
            .pairs()
            .each((pair) => {
                css += pair[0] + ':' + pair[1] + ';';
            });

        sheet.addRule(selectorName, css, 0);
    }

    static defineClass(className : string, rules : Object) {
        return DDTCSS.defineSelector('.' + className, rules);
    }
}

class DDTElement {

    element : JQuery;

    getNode() {
        return this.element[0];
    }

    constructor(element : JQuery) {
        this.element = element;
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

    attachToCursor(diff : DDTCoords = null) {

        var bodyElement = new DDTElement($('body'));

        bodyElement.notSelectable();

        var updateFunction = (event : Event) => {
            var position = DDTCoords.fromEvent(event);

            if (diff) {
                position = position.minus(diff);
            }

            this.element.css({
                top  : position.y,
                left : position.x
            });
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
    rows : DDTRow[] = [];

    createShadow(row : DDTRow) : DDTShadowTable {
        var shadowTable = new DDTShadowTable($(document.createElement('table')));
        var shadowRow   = new DDTShadowRow($(document.createElement('tr')));

        shadowRow.cloneStyles(row);
        shadowRow.cloneHTML(row);

        shadowTable.addRow(shadowRow);

        return shadowTable;
    }

    addRow(row : DDTRow) {
        this.element.append(row.element);
        this.rows.push(row);
    }
}

class DDTShadowTable extends DDTTable {
    constructor(element : JQuery) {
        super(element);

        element.addClass(DDTCSS.shadowTable);
    }
}

class DragAndDropTable {

    private table : DDTTable;

    constructor(table : JQuery) {
        this.table = new DDTTable(table);

        this.wireEvents();
    }

    wireEvents() {
        this.table.element.on('mousedown', 'tr', e => this.dragRow($(e.currentTarget), DDTCoords.fromEvent(e)));
    }

    dragRow(rowElement : JQuery, mousePosition : DDTCoords) {
        var row         = new DDTRow(rowElement);
        var shadow      = this.table.createShadow(row);
        var rowPosition = DDTCoords.fromJQuery(rowElement);
        var diff        = mousePosition.minus(rowPosition);

        row.hide();

        shadow.element.appendTo('body');

        shadow.attachToCursor(diff);
        shadow.setPosition(rowPosition);

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
    '-webkit-user-select' : 'none',
    '-ms-user-select'     : 'none',
    '-o-user-select'      : 'none',
    'user-select'         : 'none',

    'cursor'              : 'default'
});
