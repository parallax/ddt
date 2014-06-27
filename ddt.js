/// <reference path='./typings/jquery/jquery.d.ts' />
/// <reference path='./typings/lodash/lodash.d.ts' />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", 'jquery', 'lodash'], function(require, exports, $, _) {
    

    /**
    * An enum representing the two different axis
    */
    (function (DDTAxis) {
        DDTAxis[DDTAxis["X"] = 0] = "X";
        DDTAxis[DDTAxis["Y"] = 1] = "Y";
    })(exports.DDTAxis || (exports.DDTAxis = {}));
    var DDTAxis = exports.DDTAxis;

    /**
    * The result of a bounds calculation.
    */
    (function (DDTBoundsResult) {
        DDTBoundsResult[DDTBoundsResult["LOW"] = 0] = "LOW";
        DDTBoundsResult[DDTBoundsResult["IN"] = 1] = "IN";
        DDTBoundsResult[DDTBoundsResult["HIGH"] = 2] = "HIGH";
    })(exports.DDTBoundsResult || (exports.DDTBoundsResult = {}));
    var DDTBoundsResult = exports.DDTBoundsResult;

    /**
    * A mini event emitter
    *
    * @todo Look at changing this to one that has already been written?
    */
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

    /**
    * A class representing coords which we use across the whole library
    */
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

        /**
        * Add a certain amount to a specific axis
        */
        DDTCoords.prototype.addToAxis = function (size, axis) {
            if (axis === 0 /* X */) {
                return new DDTCoords(this.x + size, this.y);
            }

            return new DDTCoords(this.x, this.y + size);
        };

        DDTCoords.prototype.gt = function (coords, axis) {
            var key = DDTCoords.enumToAxis(axis);
            return this[key] > coords[key];
        };

        DDTCoords.prototype.lt = function (coords, axis) {
            var key = DDTCoords.enumToAxis(axis);
            return this[key] < coords[key];
        };

        /**
        * Calculation taken from jQuery UI sortable.
        *
        * Used to calculate if a coords is over another coords by a certain amount
        */
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

    /**
    * Used for managing CSS within the library.
    *
    * Using this class we have a nice API for defining new selectors.
    *
    * @note This probably doesn't work in any kind of IE, but it's possible for it to by
    *       using style.innerText directly. We can probably look at using that in the future.
    */
    var DDTCSS = (function () {
        function DDTCSS() {
        }
        /**
        * Define a specific selector with some rules for it
        */
        DDTCSS.defineSelector = function (selectorName, rules) {
            if (!DDTCSS.styleElement) {
                DDTCSS.styleElement = document.createElement('style');

                // Apparently we need a text node inside the style tag or this won't work.
                // This hasn't been tessed
                DDTCSS.styleElement.appendChild(document.createTextNode(''));

                document.head.appendChild(DDTCSS.styleElement);
            }

            var sheet = DDTCSS.styleElement.sheet;
            sheet.addRule(selectorName, DDTCSS.rulesToCSS(rules), 0);
        };

        DDTCSS.defineClass = function (className, rules) {
            return DDTCSS.defineSelector('.' + className, rules);
        };

        /**
        * Convert an object of rules into a cssText string.
        */
        DDTCSS.rulesToCSS = function (rules) {
            var _this = this;
            return _.chain(rules).pairs().map(function (p) {
                return [_this.arrowCase(p[0]), ':', p[1], ';'];
            }).flatten().join('').value();
        };

        /**
        * Convert CamelCase to -camel-case
        */
        DDTCSS.arrowCase = function (name) {
            return name.replace(/([A-Z])/g, '-$1').toLowerCase();
        };
        return DDTCSS;
    })();
    exports.DDTCSS = DDTCSS;

    /**
    * An interface for dealing with elements in our library.
    *
    * Has some really useful helper functions
    */
    var DDTElement = (function () {
        function DDTElement(element) {
            this.element = element;
            this.emitter = new DDTEventEmitter();
        }
        /**
        * Get the HTMLElement from the jQuery object
        */
        DDTElement.prototype.getNode = function () {
            return this.element[0];
        };

        /**
        * Swap two elements in the dom
        *
        * @see http://stackoverflow.com/a/698440/851985
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
            this.element.removeClass(DDTElement.notVisible);
        };

        DDTElement.prototype.hide = function () {
            this.element.addClass(DDTElement.notVisible);
        };

        DDTElement.prototype.notSelectable = function () {
            this.element.addClass(DDTElement.noSelect);
        };

        DDTElement.prototype.selectable = function () {
            this.element.removeClass(DDTElement.noSelect);
        };

        /**
        * Get the amount of padding and border an element has on its left side
        */
        DDTElement.getLeftPaddingAndBorder = function (element) {
            return parseInt(element.css('border-left-width') || '0', 10) + parseInt(element.css('border-top-width') || '0', 10);
        };

        /**
        * Get the offset top of an element from a parent, taking into account that jQuery may return
        * undefined.
        */
        DDTElement.prototype.offsetTop = function () {
            return (this.element.offset() || { top: 0 }).top;
        };

        /**
        * Calculate if an element is in the bounds of its parent
        */
        DDTElement.prototype.calculateBounds = function (parent, diffY, positions) {
            if (typeof diffY === "undefined") { diffY = 0; }
            if (typeof positions === "undefined") { positions = null; }
            // Just some calculations
            var ourOffset = positions ? positions.y : this.offsetTop();
            var ourHeight = this.element.outerHeight();
            var parentOffset = parent.offsetTop();
            var parentHeight = parent.element.outerHeight();

            if (ourOffset < parentOffset) {
                return 0 /* LOW */;
            }

            if (ourOffset + ourHeight < parentOffset + parentHeight + diffY) {
                return 1 /* IN */;
            }

            return 2 /* HIGH */;
        };

        /**
        * Deep clone an element, with the ability to ignore elements
        */
        DDTElement.prototype.clone = function (ignoreElements, copyStyles) {
            if (typeof ignoreElements === "undefined") { ignoreElements = []; }
            if (typeof copyStyles === "undefined") { copyStyles = false; }
            var cloneFn = function (el) {
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
                    el.children().each(function (idx, cEl) {
                        // If we've not been told to ignore this element, clone it and append it to the parent
                        if (ignoreElements.indexOf(cEl) === -1) {
                            clone.append(cloneFn($(cEl)));
                        }
                    });
                }

                return clone;
            };

            return new DDTElement(cloneFn(this.element));
        };

        DDTElement.getUniqueStyles = function (element, ignore) {
            if (typeof ignore === "undefined") { ignore = []; }
            var ourStyles = window.getComputedStyle(element);
            var dummy = document.createElement(element.tagName);
            document.body.appendChild(dummy);

            var dummyStyles = window.getComputedStyle(dummy);

            var pairs = _.chain(ourStyles).pairs().map(function (p) {
                var k = DDTCSS.arrowCase(p[0]);

                if (!ourStyles.getPropertyValue(k) || dummyStyles.getPropertyValue(k) === ourStyles.getPropertyValue(k)) {
                    return null;
                }

                return p;
            }).filter(function (p) {
                return !!p;
            }).filter(function (p) {
                return ignore.indexOf(p[0]) === -1;
            }).value();

            dummy.parentNode.removeChild(dummy);

            return _.object(pairs);
        };

        DDTElement.cloneStyles = function (element, clone) {
            clone.setAttribute('style', window.getComputedStyle(element).cssText);
        };

        DDTElement.cloneUniqueStyles = function (element, clone, ignore) {
            if (typeof ignore === "undefined") { ignore = []; }
            clone.setAttribute('style', DDTCSS.rulesToCSS(DDTElement.getUniqueStyles(element, ignore)));
        };

        DDTElement.cloneAttributes = function (element, clone, ignore) {
            if (typeof ignore === "undefined") { ignore = ['id']; }
            var attrs = Array.prototype.slice.call(element.attributes);
            if (ignore) {
                attrs = attrs.filter(function (attr) {
                    return ignore.indexOf(attr.name) === -1;
                });
            }

            attrs.forEach(function (attr) {
                return clone.setAttribute(attr.name, attr.value);
            });
        };

        DDTElement.getInheritedBackgroundColor = function (el) {
            var color = el.css('background-color');

            if (!el.is('body') && color === 'transparent' || color === 'rgba(0, 0, 0, 0)') {
                return DDTElement.getInheritedBackgroundColor(el.parent());
            }

            return color;
        };

        DDTElement.getVerticalBorders = function (el) {
            return (parseInt(el.css('border-top-width'), 10) || 0) + (parseInt(el.css('border-bottom-width'), 10) || 0);
        };
        DDTElement.notVisible = 'DDTNotVisible';
        DDTElement.shadowTable = 'DDTShadowTable';
        DDTElement.shadowRow = 'DDTShadowRow';
        DDTElement.noSelect = 'DDTNoSelect';
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
        */
        DDTPositionableElement.prototype.attachToCursor = function (container, diff, axis, bound) {
            var _this = this;
            if (typeof diff === "undefined") { diff = null; }
            if (typeof axis === "undefined") { axis = null; }
            if (typeof bound === "undefined") { bound = null; }
            var bodyElement = new DDTElement($('body'));
            var boundElement;

            if (bound) {
                boundElement = new DDTElement($(bound));
            }

            bodyElement.notSelectable();

            var updateFunction = function (event) {
                var position = DDTCoords.fromEvent(event);

                if (diff) {
                    position = position.minus(diff);
                }

                if (boundElement) {
                    var borders = DDTElement.getVerticalBorders(_this.element.find('> tbody > tr > td').eq(0));
                    var bounds = _this.calculateBounds(boundElement, borders, position);

                    if (bounds !== 1 /* IN */) {
                        var newPos = boundElement.offsetTop();

                        if (bounds === 2 /* HIGH */) {
                            newPos += boundElement.element.height() - _this.element.height() + borders;
                        }

                        position = new DDTCoords(position.x, newPos);
                    }
                }

                _this.setPosition(position, axis);
            };

            container.on('mousemove', updateFunction).one('mouseup', function () {
                container.off('mousemove', updateFunction);
                bodyElement.selectable();
            });
        };

        DDTPositionableElement.prototype.setPosition = function (coords, axis) {
            if (typeof axis === "undefined") { axis = null; }
            if (!axis) {
                axis = [0 /* X */, 1 /* Y */];
            }

            var obj = {};

            if (axis.indexOf(0 /* X */) > -1) {
                obj.left = coords.x;
            }

            if (axis.indexOf(1 /* Y */) > -1) {
                obj.top = coords.y;
            }

            this.element.css(obj);

            var pos = this.element.offset();

            this.emitter.emit('ddt.position', [new DDTCoords(pos.left, pos.top)]);
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

            element.addClass(DDTElement.shadowRow);
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
            var tbody = this.element.children('tbody');
            var clonedRow = row.clone();
            var clonedTable = this.clone(Array.prototype.slice.call(this.element.children('tbody, thead, colgroup')));
            var shadowTable = new DDTShadowTable(clonedTable.element);
            var shadowRow = new DDTShadowRow(clonedRow.element);

            var width;

            if (this.element.css('border-collapse') === 'collapse') {
                width = tbody.outerWidth() + (parseInt(tbody.css('border-left-width'), 10) / 2) + (parseInt(tbody.css('border-right-width'), 10) / 2);
            } else {
                width = parseInt(this.element.css('width'));
            }

            shadowTable.element.width(width);
            shadowTable.setShadowRow(shadowRow);
            shadowTable.fixBackgroundColor(row);
            shadowTable.fixColGroup(row);

            DDTElement.cloneUniqueStyles(this.getTbody(), shadowTable.getTbody());

            return shadowTable;
        };

        DDTTable.prototype.getTbody = function () {
            return this.element.find('tbody')[0];
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

            element.addClass(DDTElement.shadowTable);
        }
        DDTShadowTable.prototype.setShadowRow = function (row) {
            this.element.find('tbody').append(row.element);
            this.row = row;
        };

        DDTShadowTable.prototype.fixBackgroundColor = function (row) {
            this.row.element.css('background', DDTElement.getInheritedBackgroundColor(row.element));
        };

        DDTShadowTable.prototype.fixColGroup = function (row) {
            if (this.element.children('colgroup').length) {
                this.element.children('colgroup').remove();
            }

            var colgroup = $(document.createElement('colgroup'));

            row.element.children('td').each(function (i, td) {
                colgroup.append($(document.createElement('col')).width($(td).outerWidth()));
            });

            console.log(colgroup.html());

            this.element.prepend(colgroup);
        };
        return DDTShadowTable;
    })(DDTTable);
    exports.DDTShadowTable = DDTShadowTable;

    var DragAndDropTable = (function () {
        function DragAndDropTable(table) {
            this.verticalOnly = true;
            this.boundToTBody = true;
            this.enabled = true;
            this.table = new DDTTable(table);
            this.emitter = new DDTEventEmitter();
            this.window = new DDTElement($(window));
            this.$document = $(document);

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
            this.table.element.on('mousedown', DragAndDropTable.rowSelector, function (e) {
                if (_this.enabled && e.which === 1) {
                    _this.dragRow($(e.currentTarget), DDTCoords.fromEvent(e));
                }
            });
        };

        DragAndDropTable.prototype.dragRow = function (rowElement, mousePosition) {
            var _this = this;
            var row = new DDTRow(rowElement);
            var shadow = this.table.createShadow(row);
            var rowPosition = DDTCoords.fromJQuery(rowElement);
            var diff = mousePosition.minus(rowPosition);

            row.hide();

            shadow.element.appendTo('body');
            shadow.emitter.on('ddt.position', function (coords) {
                return _this.dragged(row, shadow, coords);
            });

            var styles = window.getComputedStyle(rowElement[0]);

            var minus = [0, 0];

            if (styles['border-collapse'] === 'separate') {
                minus[1] = parseInt(styles['border-spacing'].split(' ')[1], 10);
            } else {
                var tbody = this.table.element.children('tbody');
                minus[0] = (parseInt(tbody.css('border-right-width'), 10) - parseInt(tbody.css('border-left-width'), 10)) / 2;
            }

            var minusCoords = new DDTCoords(minus[0], minus[1]);
            var axis = this.verticalOnly ? [1 /* Y */] : [0 /* X */, 1 /* Y */];

            shadow.attachToCursor(this.$document, diff.add(minusCoords), axis, this.boundToTBody ? this.table.getTbody() : null);
            shadow.setPosition(rowPosition.minus(minusCoords));

            this.$document.one('mouseup', function () {
                return _this.endDrag(row, shadow);
            });
        };

        DragAndDropTable.prototype.dragged = function (row, shadow, coords) {
            this.handleScrolling(shadow);
            this.handleRowSwapping(row, shadow, coords);
        };

        DragAndDropTable.prototype.endDrag = function (row, shadow) {
            shadow.element.remove();

            row.show();
        };

        DragAndDropTable.prototype.handleRowSwapping = function (row, shadow, coords) {
            var _this = this;
            var rows = this.table.element.find(DragAndDropTable.rowSelector);

            var res = _.some(rows, function (tr) {
                // If this is the element we're dragging, we don't want to do any calculations on it
                if (tr === row.getNode()) {
                    return;
                }

                var rowCoords = DDTCoords.fromElement(tr);
                var $tr = $(tr);
                var tableBounds = shadow.calculateBounds(_this.table);

                var toSwapWith;

                if (tableBounds === 0 /* LOW */) {
                    toSwapWith = $(rows[0]);
                } else if (tableBounds === 2 /* HIGH */) {
                    toSwapWith = $(_.last(rows));
                } else if (coords.isOverAxis(rowCoords, $tr.height() / 2, 1 /* Y */)) {
                    toSwapWith = $tr;
                }

                if (toSwapWith && row.getNode() !== toSwapWith[0]) {
                    row.swap(new DDTElement(toSwapWith));
                    DDTElement.cloneUniqueStyles(row.element[0], shadow.row.element[0], ['visibility']);
                    shadow.fixBackgroundColor(row);

                    return true;
                }
            });

            if (res) {
                this.emitValues(rows);
            }
        };

        DragAndDropTable.prototype.emitValues = function (rows) {
            this.emitter.emit('ddt.order', [
                _.map(rows, function (tr) {
                    return $(tr).data('value');
                })
            ]);
        };

        DragAndDropTable.prototype.handleScrolling = function (shadow) {
            var bounds = shadow.calculateBounds(this.window);

            if (bounds === 1 /* IN */) {
                return;
            }

            var tableBounds = shadow.calculateBounds(this.table, shadow.row.element.outerHeight());

            if (tableBounds !== 1 /* IN */) {
                return;
            }

            if (bounds === 2 /* HIGH */) {
                document.body.scrollTop += 5;
            }

            if (bounds === 0 /* LOW */) {
                document.body.scrollTop -= 5;
            }
        };
        DragAndDropTable.rowSelector = 'tbody tr';
        return DragAndDropTable;
    })();
    exports.DragAndDropTable = DragAndDropTable;

    DDTCSS.defineClass(DDTElement.notVisible, { visibility: 'hidden' });
    DDTCSS.defineClass(DDTElement.shadowTable, { position: 'absolute !important', zIndex: 999999 });
    DDTCSS.defineClass(DDTElement.shadowRow, { position: 'relative !important ' });
    DDTCSS.defineSelector('.' + DDTElement.noSelect + ', .' + DDTElement.noSelect + ' *', {
        WebkitUserSelect: 'none',
        MsUserSelect: 'none',
        OUserSelect: 'none',
        userSelect: 'none',
        cursor: 'default'
    });
});
