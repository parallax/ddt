/// <reference path='./typings/jquery/jquery.d.ts' />
/// <reference path='./typings/lodash/lodash.d.ts' />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", 'jquery', 'lodash'], function(require, exports, $, _) {
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
    exports.DDTCSS = DDTCSS;

    (function (DDTBoundsValue) {
        DDTBoundsValue[DDTBoundsValue["LOW"] = 0] = "LOW";
        DDTBoundsValue[DDTBoundsValue["IN"] = 1] = "IN";
        DDTBoundsValue[DDTBoundsValue["HIGH"] = 2] = "HIGH";
    })(exports.DDTBoundsValue || (exports.DDTBoundsValue = {}));
    var DDTBoundsValue = exports.DDTBoundsValue;

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
            return DDTElement.getStyles(this.getNode());
        };

        DDTElement.prototype.cloneStyles = function (element) {
            this.applyStyles(element.getStyles());
        };

        DDTElement.prototype.applyStyles = function (styles) {
            DDTElement.applyStyles(this.getNode(), styles);
        };

        DDTElement.prototype.getLeftPaddingAndBorder = function () {
            return parseInt(this.element.css('border-left-width') || '0', 10) + parseInt(this.element.css('border-top-width') || '0', 10);
        };

        DDTElement.prototype.dimensions = function (outer) {
            if (typeof outer === "undefined") { outer = false; }
            var dimensions = {
                width: 0,
                height: 0
            };

            if (outer) {
                dimensions.width = this.element.outerWidth();
                dimensions.height = this.element.outerHeight();
            } else {
                dimensions.width = this.element.width();
                dimensions.height = this.element.height();
            }

            return dimensions;
        };

        DDTElement.prototype.offset = function () {
            return this.element.offset() || { top: 0, left: 0 };
        };

        DDTElement.prototype.calculateBounds = function (parent, diffX, diffY) {
            if (typeof diffX === "undefined") { diffX = 0; }
            if (typeof diffY === "undefined") { diffY = 0; }
            var ourOffset = this.offset();
            var parentOffset = parent.offset();

            var ourDimensions = this.dimensions(true);
            var parentDimensions = parent.dimensions(true);

            var bounds = {
                x: null,
                y: null
            };

            if (ourOffset.top < parentOffset.top) {
                bounds.y = 0 /* LOW */;
            } else {
                if (ourOffset.top + ourDimensions.height < parentOffset.top + parentDimensions.height + diffY) {
                    bounds.y = 1 /* IN */;
                } else {
                    bounds.y = 2 /* HIGH */;
                }
            }

            if (ourOffset.left < parentOffset.left) {
                bounds.x = 0 /* LOW */;
            } else {
                if (ourOffset.left + ourDimensions.width < parentOffset.left + parentDimensions.width) {
                    bounds.x = 1 /* IN */;
                } else {
                    bounds.x = 2 /* HIGH */;
                }
            }

            return bounds;
        };

        DDTElement.prototype.clone = function (ignoreElements) {
            if (typeof ignoreElements === "undefined") { ignoreElements = []; }
            var cloneFn = function (el) {
                var clone = $(document.createElement(el[0].tagName));

                DDTElement.cloneUniqueStyles(el[0], clone[0]);

                if (!el.children().length) {
                    clone.text(el.text());
                }

                el.children().each(function (idx, cEl) {
                    if (ignoreElements.indexOf(cEl) > -1) {
                        return;
                    }

                    clone.append(cloneFn($(cEl)));
                });

                return clone;
            };

            return new DDTElement(cloneFn(this.element));
        };

        DDTElement.applyStyles = function (element, styles) {
            element.setAttribute('style', styles.cssText);
        };

        DDTElement.applyStyleRules = function (element, styleRules) {
            element.setAttribute('style', DDTCSS.rulesToCSS(styleRules));
        };

        DDTElement.getUniqueStyles = function (element) {
            var ourStyles = DDTElement.getStyles(element);

            var dummy = document.createElement(element.tagName);
            document.body.appendChild(dummy);

            var dummyStyles = window.getComputedStyle(dummy);

            var pairs = _.chain(ourStyles).pairs().map(function (p) {
                var k = DDTCSS.arrowCase(p[0]);
                var v = p[1];

                if (dummyStyles.getPropertyValue(k) === ourStyles.getPropertyValue(k) || !ourStyles.getPropertyValue(k)) {
                    return null;
                }

                return p;
            }).filter(function (p) {
                return !!p;
            }).value();

            dummy.parentNode.removeChild(dummy);

            return _.object(pairs);
        };

        DDTElement.getStyles = function (element) {
            return window.getComputedStyle(element);
        };

        DDTElement.cloneStyles = function (element, clone) {
            DDTElement.applyStyles(clone, DDTElement.getStyles(element));
        };

        DDTElement.cloneUniqueStyles = function (element, clone) {
            DDTElement.applyStyleRules(clone, DDTElement.getUniqueStyles(element));
        };
        return DDTElement;
    })();
    exports.DDTElement = DDTElement;

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

            this.emitter.emit('ddt.position', [coords]);
        };
        return DDTPositionableElement;
    })(DDTElement);
    exports.DDTPositionableElement = DDTPositionableElement;

    var DDTRow = (function (_super) {
        __extends(DDTRow, _super);
        function DDTRow() {
            _super.apply(this, arguments);
        }
        return DDTRow;
    })(DDTElement);
    exports.DDTRow = DDTRow;

    var DDTShadowRow = (function (_super) {
        __extends(DDTShadowRow, _super);
        function DDTShadowRow(element) {
            _super.call(this, element);

            element.addClass(DDTCSS.shadowRow);
        }
        return DDTShadowRow;
    })(DDTRow);
    exports.DDTShadowRow = DDTShadowRow;

    var DDTTable = (function (_super) {
        __extends(DDTTable, _super);
        function DDTTable() {
            _super.apply(this, arguments);
        }
        DDTTable.prototype.createShadow = function (row) {
            var clonedTable = this.clone(Array.prototype.slice.call(this.element.find('tbody, thead')));
            var shadowTable = new DDTShadowTable(clonedTable.element);

            var clonedRow = row.clone();
            var shadowRow = new DDTShadowRow(clonedRow.element);

            shadowTable.element.css('height', 'auto');

            var width = this.element.outerWidth();

            if (this.element.css('border-collapse') === 'collapse') {
                width += new DDTElement(this.element.find('tbody')).getLeftPaddingAndBorder();
            }

            shadowTable.element.width(width);
            shadowTable.setShadowRow(shadowRow);

            DDTElement.cloneUniqueStyles(this.element.find('tbody')[0], shadowTable.element.find('tbody')[0]);

            return shadowTable;
        };
        return DDTTable;
    })(DDTPositionableElement);
    exports.DDTTable = DDTTable;

    var DDTShadowTable = (function (_super) {
        __extends(DDTShadowTable, _super);
        function DDTShadowTable(element) {
            _super.call(this, element);

            if (!element.find('tbody').length) {
                $(document.createElement('tbody')).appendTo(element);
            }

            element.addClass(DDTCSS.shadowTable);
        }
        DDTShadowTable.prototype.setShadowRow = function (row) {
            this.element.find('tbody').append(row.element);
            this.row = row;
        };
        return DDTShadowTable;
    })(DDTTable);
    exports.DDTShadowTable = DDTShadowTable;

    var DragAndDropTable = (function () {
        function DragAndDropTable(table) {
            this.enabled = true;
            this.scrolling = false;
            this.table = new DDTTable(table);
            this.emitter = new DDTEventEmitter();

            this.window = new DDTElement($(window));

            this.wireEvents();
        }
        DragAndDropTable.prototype.enable = function () {
            this.enabled = true;
        };

        DragAndDropTable.prototype.disable = function () {
            this.enabled = false;
        };

        DragAndDropTable.prototype.toggleEnabled = function () {
            this.enabled ? this.disable() : this.enable();
        };

        DragAndDropTable.prototype.wireEvents = function () {
            var _this = this;
            this.table.element.on('mousedown', 'tbody tr', function (e) {
                if (_this.enabled && e.which === 1) {
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

            shadow.emitter.on('ddt.position', function (coords) {
                _this.handleScrolling(shadow);

                _this.table.element.find('tbody tr').each(function (idx, tr) {
                    if (tr === row.getNode()) {
                        return;
                    }

                    var rowCoords = DDTCoords.fromElement(tr);

                    if (coords.isOverAxis(rowCoords, $(tr).height() / 2, 1 /* Y */)) {
                        row.swap(new DDTElement($(tr)));

                        row.show();
                        DDTElement.cloneUniqueStyles(row.element[0], shadow.row.element[0]);
                        row.hide();

                        _this.emitter.emit('ddt.order', [
                            _.map(_this.table.element.find('tbody tr'), function (tr) {
                                return $(tr).data('value');
                            })
                        ]);
                    }
                });
            });

            var styles = row.getStyles();
            var spacing;

            if (styles['border-collapse'] === 'separate') {
                spacing = new DDTCoords(0, styles['border-spacing'].split(' ').map(function (n) {
                    return parseInt(n, 10);
                })[1]);
            } else {
                spacing = new DDTCoords(new DDTElement(this.table.element.find('tbody')).getLeftPaddingAndBorder() / 2, 0);
            }

            shadow.attachToCursor(diff.add(spacing));
            shadow.setPosition(rowPosition.minus(spacing));

            $(document).one('mouseup', function () {
                shadow.element.remove();

                row.show();
            });
        };

        DragAndDropTable.prototype.handleScrolling = function (shadow) {
            var bounds = shadow.calculateBounds(this.window);

            if (bounds.y === 1 /* IN */) {
                return;
            }

            var tableBounds = shadow.calculateBounds(this.table, 0, shadow.row.element.outerHeight());

            if (tableBounds.y !== 1 /* IN */) {
                return;
            }

            if (bounds.y === 2 /* HIGH */) {
                document.body.scrollTop += 5;
            }

            if (bounds.y === 0 /* LOW */) {
                document.body.scrollTop -= 5;
            }
        };
        return DragAndDropTable;
    })();
    exports.DragAndDropTable = DragAndDropTable;

    DDTCSS.defineClass(DDTCSS.notVisible, { visibility: 'hidden' });
    DDTCSS.defineClass(DDTCSS.shadowTable, { position: 'absolute !important', zIndex: 999999 });
    DDTCSS.defineClass(DDTCSS.shadowRow, { position: 'relative !important ' });
    DDTCSS.defineSelector('.' + DDTCSS.noSelect + ', .' + DDTCSS.noSelect + ' *', {
        WebkitUserSelect: 'none',
        MsUserSelect: 'none',
        OUserSelect: 'none',
        userSelect: 'none',
        cursor: 'default'
    });
});
