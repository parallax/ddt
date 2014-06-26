/// <reference path='./typings/jquery/jquery.d.ts' />
/// <reference path='./typings/lodash/lodash.d.ts' />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", 'jquery', 'lodash'], function(require, exports, $, _) {
    var DDTEvents = (function () {
        function DDTEvents() {
        }
        DDTEvents.shadowPosition = 'ddt.position';
        DDTEvents.reorder = 'ddt.order';
        return DDTEvents;
    })();

    var DDTEventEmitter = (function () {
        function DDTEventEmitter() {
            this.handlers = {};
        }
        DDTEventEmitter.prototype.on = function (event, handler) {
            if (!this.handlers[event]) {
                this.handlers[event] = [];
            }

            this.handlers[event].push(handler);
        };

        DDTEventEmitter.prototype.emit = function (event, args) {
            var _this = this;
            (this.handlers[event] || []).forEach(function (h) {
                return h.apply(_this, args);
            });
        };
        return DDTEventEmitter;
    })();
    exports.DDTEventEmitter = DDTEventEmitter;

    (function (DDTCoordsAxis) {
        DDTCoordsAxis[DDTCoordsAxis["X"] = 0] = "X";
        DDTCoordsAxis[DDTCoordsAxis["Y"] = 1] = "Y";
    })(exports.DDTCoordsAxis || (exports.DDTCoordsAxis = {}));
    var DDTCoordsAxis = exports.DDTCoordsAxis;
    ;

    var DDTCoords = (function () {
        function DDTCoords(x, y) {
            this.x = x;
            this.y = y;
        }
        DDTCoords.prototype.minus = function (coords) {
            return new DDTCoords(this.x - coords.x, this.y - coords.y);
        };

        DDTCoords.prototype.add = function (coords) {
            return new DDTCoords(this.x + coords.x, this.y + coords.y);
        };

        DDTCoords.prototype.addToAxis = function (size, axisEnum) {
            if (axisEnum === 0 /* X */) {
                return new DDTCoords(this.x + size, this.y);
            }

            return new DDTCoords(this.x, this.y + size);
        };

        DDTCoords.prototype.gt = function (coords, axisEnum) {
            var axis = DDTCoords.enumToAxis(axisEnum);
            return this[axis] > coords[axis];
        };

        DDTCoords.prototype.lt = function (coords, axisEnum) {
            var axis = DDTCoords.enumToAxis(axisEnum);
            return this[axis] < coords[axis];
        };

        DDTCoords.prototype.isOverAxis = function (coords, size, axis) {
            return this.gt(coords, axis) && this.lt(coords.addToAxis(size, axis), axis);
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

        DDTCoords.enumToAxis = function (axis) {
            return axis === 0 /* X */ ? 'x' : 'y';
        };
        return DDTCoords;
    })();
    exports.DDTCoords = DDTCoords;

    var DDTCSS = (function () {
        function DDTCSS() {
        }
        DDTCSS.defineSelector = function (selectorName, rules) {
            var style = document.createElement('style');

            style.appendChild(document.createTextNode(''));

            document.head.appendChild(style);

            var sheet = style.sheet;
            sheet.addRule(selectorName, DDTCSS.rulesToCSS(rules), 0);
        };

        DDTCSS.defineClass = function (className, rules) {
            return DDTCSS.defineSelector('.' + className, rules);
        };

        DDTCSS.rulesToCSS = function (rules) {
            var _this = this;
            return _.chain(rules).pairs().map(function (p) {
                return [_this.arrowCase(p[0]), ':', p[1], ';'];
            }).flatten().join('').value();
        };

        DDTCSS.arrowCase = function (name) {
            return name.replace(/([A-Z])/g, '-$1').toLowerCase();
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
            this.emitter = new DDTEventEmitter();
        }
        DDTElement.prototype.getNode = function () {
            return this.element[0];
        };

        /**
        * @todo This function is too complicated to be self-documenting. Document it.
        */
        DDTElement.prototype.swap = function (element) {
            var ourNode = this.getNode();
            var theirNode = element.getNode();
            var ourNodeParent = ourNode.parentNode;
            var sibling = ourNode.nextSibling === theirNode ? ourNode : ourNode.nextSibling;

            theirNode.parentNode.insertBefore(ourNode, theirNode);
            ourNodeParent.insertBefore(theirNode, sibling);
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
        /**
        * @todo This is far too messy, clean it up
        * @param diff
        */
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

            this.emitter.emit(DDTEvents.shadowPosition, [coords]);
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
        }
        DDTTable.prototype.createShadow = function (row) {
            var shadowTable = new DDTShadowTable($(document.createElement('table')));
            var shadowRow = new DDTShadowRow($(document.createElement('tr')));

            if (this.element.find('colgroup').length) {
                shadowTable.element.prepend(this.element.find('colgroup').clone());
            }

            shadowTable.element.width(this.element.width());

            shadowRow.cloneStyles(row);
            shadowRow.cloneHTML(row);

            shadowTable.setShadowRow(shadowRow);

            return shadowTable;
        };
        return DDTTable;
    })(DDTPositionableElement);

    var DDTShadowTable = (function (_super) {
        __extends(DDTShadowTable, _super);
        function DDTShadowTable(element) {
            _super.call(this, element);

            element.addClass(DDTCSS.shadowTable);
        }
        DDTShadowTable.prototype.setShadowRow = function (row) {
            this.element.append(row.element);
            this.row = row;
        };
        return DDTShadowTable;
    })(DDTTable);

    var DragAndDropTable = (function () {
        function DragAndDropTable(table) {
            this.table = new DDTTable(table);
            this.emitter = new DDTEventEmitter();

            this.wireEvents();
        }
        DragAndDropTable.prototype.wireEvents = function () {
            var _this = this;
            this.table.element.on('mousedown', 'tbody tr', function (e) {
                if (e.which === 1) {
                    _this.dragRow($(e.currentTarget), DDTCoords.fromEvent(e));
                }
            });
        };

        // @todo This is far too messy. Clean it up
        DragAndDropTable.prototype.dragRow = function (rowElement, mousePosition) {
            var _this = this;
            var row = new DDTRow(rowElement);
            var shadow = this.table.createShadow(row);
            var rowPosition = DDTCoords.fromJQuery(rowElement);
            var diff = mousePosition.minus(rowPosition);

            row.hide();

            shadow.element.appendTo('body');

            shadow.emitter.on(DDTEvents.shadowPosition, function (coords) {
                _this.table.element.find('tbody tr').each(function (idx, tr) {
                    if (tr === row.getNode()) {
                        return;
                    }

                    var rowCoords = DDTCoords.fromElement(tr);

                    if (coords.isOverAxis(rowCoords, $(tr).height() / 2, 1 /* Y */)) {
                        row.swap(new DDTElement($(tr)));

                        row.show();
                        shadow.row.cloneStyles(row);
                        row.hide();

                        _this.emitter.emit(DDTEvents.reorder, [
                            _.map(_this.table.element.find('tr'), function (tr) {
                                return $(tr).data('value');
                            })
                        ]);
                    }
                });
            });

            var spacing = row.getStyles()['border-spacing'].split(' ').map(function (n) {
                return parseInt(n, 10);
            });

            shadow.attachToCursor(diff);
            shadow.setPosition(rowPosition.minus(new DDTCoords(0, spacing[1])));

            $(document).one('mouseup', function () {
                shadow.element.remove();

                row.show();
            });
        };
        return DragAndDropTable;
    })();
    exports.DragAndDropTable = DragAndDropTable;

    DDTCSS.defineClass(DDTCSS.notVisible, { visibility: 'hidden' });
    DDTCSS.defineClass(DDTCSS.shadowTable, { position: 'absolute !important' });
    DDTCSS.defineClass(DDTCSS.shadowRow, { position: 'relative !important ' });
    DDTCSS.defineSelector('.' + DDTCSS.noSelect + ', .' + DDTCSS.noSelect + ' *', {
        WebkitUserSelect: 'none',
        MsUserSelect: 'none',
        OUserSelect: 'none',
        userSelect: 'none',
        cursor: 'default'
    });
});
