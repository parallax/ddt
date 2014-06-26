/// <reference path='./typings/jquery/jquery.d.ts' />
/// <reference path='./typings/lodash/lodash.d.ts' />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};

var DDTCoords = (function () {
    function DDTCoords(x, y) {
        this.x = x;
        this.y = y;
    }
    DDTCoords.prototype.minus = function (coords) {
        return new DDTCoords(this.x - coords.x, this.y - coords.y);
    };

    DDTCoords.fromEvent = function (event) {
        return new DDTCoords(event.pageX, event.pageY);
    };

    DDTCoords.fromElement = function (element) {
        return DDTCoords.fromJQuery($(element));
    };

    DDTCoords.fromJQuery = function (jquery) {
        var offset = jquery.offset();

        return new DDTCoords(offset.left, offset.top);
    };
    return DDTCoords;
})();

var DDTCSS = (function () {
    function DDTCSS() {
    }
    DDTCSS.defineSelector = function (selectorName, rules) {
        var style = document.createElement('style');

        style.appendChild(document.createTextNode(''));

        document.head.appendChild(style);

        var sheet = style.sheet;
        var css = '';

        _.chain(rules).pairs().each(function (pair) {
            css += pair[0] + ':' + pair[1] + ';';
        });

        sheet.addRule(selectorName, css, 0);
    };

    DDTCSS.defineClass = function (className, rules) {
        return DDTCSS.defineSelector('.' + className, rules);
    };
    DDTCSS.notVisible = 'DDTNotVisible';
    DDTCSS.shadowTable = 'DDTShadowTable';
    DDTCSS.shadowRow = 'DDTShadowRow';
    DDTCSS.noSelect = 'DDTNoSelect';
    return DDTCSS;
})();

var DDTElement = (function () {
    function DDTElement(element) {
        this.element = element;
    }
    DDTElement.prototype.getNode = function () {
        return this.element[0];
    };

    DDTElement.prototype.show = function () {
        this.element.removeClass(DDTCSS.notVisible);
    };

    DDTElement.prototype.hide = function () {
        this.element.addClass(DDTCSS.notVisible);
    };

    DDTElement.prototype.notSelectable = function () {
        this.element.addClass(DDTCSS.noSelect);
    };

    DDTElement.prototype.selectable = function () {
        this.element.removeClass(DDTCSS.noSelect);
    };

    DDTElement.prototype.getStyles = function () {
        return window.getComputedStyle(this.getNode());
    };

    DDTElement.prototype.cloneStyles = function (element) {
        this.applyStyles(element.getStyles());
    };

    DDTElement.prototype.applyStyles = function (styles) {
        this.element.attr('style', styles.cssText);
    };
    return DDTElement;
})();

var DDTPositionableElement = (function (_super) {
    __extends(DDTPositionableElement, _super);
    function DDTPositionableElement() {
        _super.apply(this, arguments);
    }
    DDTPositionableElement.prototype.attachToCursor = function (diff) {
        var _this = this;
        if (typeof diff === "undefined") { diff = null; }
        var bodyElement = new DDTElement($('body'));

        bodyElement.notSelectable();

        var updateFunction = function (event) {
            var position = DDTCoords.fromEvent(event);

            if (diff) {
                position = position.minus(diff);
            }

            _this.setPosition(position);
        };

        var $doc = $(document);

        $doc.on('mousemove', updateFunction).one('mouseup', function () {
            $doc.off('mousemove', updateFunction);
            bodyElement.selectable();
        });
    };

    DDTPositionableElement.prototype.setPosition = function (coords) {
        this.element.css({
            top: coords.y,
            left: coords.x
        });
    };
    return DDTPositionableElement;
})(DDTElement);

var DDTRow = (function (_super) {
    __extends(DDTRow, _super);
    function DDTRow() {
        _super.apply(this, arguments);
    }
    return DDTRow;
})(DDTElement);

var DDTShadowRow = (function (_super) {
    __extends(DDTShadowRow, _super);
    function DDTShadowRow(element) {
        _super.call(this, element);

        element.addClass(DDTCSS.shadowRow);
    }
    DDTShadowRow.prototype.cloneHTML = function (element) {
        this.getNode().innerHTML = element.getNode().innerHTML;
    };
    return DDTShadowRow;
})(DDTRow);

var DDTTable = (function (_super) {
    __extends(DDTTable, _super);
    function DDTTable() {
        _super.apply(this, arguments);
        this.rows = [];
    }
    DDTTable.prototype.createShadow = function (row) {
        var shadowTable = new DDTShadowTable($(document.createElement('table')));
        var shadowRow = new DDTShadowRow($(document.createElement('tr')));

        shadowRow.cloneStyles(row);
        shadowRow.cloneHTML(row);

        shadowTable.addRow(shadowRow);

        return shadowTable;
    };

    DDTTable.prototype.addRow = function (row) {
        this.element.append(row.element);
        this.rows.push(row);
    };
    return DDTTable;
})(DDTPositionableElement);

var DDTShadowTable = (function (_super) {
    __extends(DDTShadowTable, _super);
    function DDTShadowTable(element) {
        _super.call(this, element);

        element.addClass(DDTCSS.shadowTable);
    }
    return DDTShadowTable;
})(DDTTable);

var DragAndDropTable = (function () {
    function DragAndDropTable(table) {
        this.table = new DDTTable(table);

        this.wireEvents();
    }
    DragAndDropTable.prototype.wireEvents = function () {
        var _this = this;
        this.table.element.on('mousedown', 'tr', function (e) {
            return _this.dragRow($(e.currentTarget), DDTCoords.fromEvent(e));
        });
    };

    DragAndDropTable.prototype.dragRow = function (rowElement, mousePosition) {
        var row = new DDTRow(rowElement);
        var shadow = this.table.createShadow(row);
        var rowPosition = DDTCoords.fromJQuery(rowElement);
        var diff = mousePosition.minus(rowPosition);

        row.hide();

        shadow.element.appendTo('body');

        shadow.attachToCursor(diff);
        shadow.setPosition(rowPosition);

        $(document).one('mouseup', function () {
            shadow.element.remove();

            row.show();
        });
    };
    return DragAndDropTable;
})();

DDTCSS.defineClass(DDTCSS.notVisible, { visibility: 'hidden' });
DDTCSS.defineClass(DDTCSS.shadowTable, { position: 'absolute !important' });
DDTCSS.defineClass(DDTCSS.shadowRow, { position: 'relative !important ' });
DDTCSS.defineSelector('.' + DDTCSS.noSelect + ', .' + DDTCSS.noSelect + ' *', {
    '-webkit-user-select': 'none',
    '-ms-user-select': 'none',
    '-o-user-select': 'none',
    'user-select': 'none',
    'cursor': 'default'
});
