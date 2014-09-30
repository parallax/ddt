/// <reference path='typings/tsd.d.ts' />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", 'jquery', 'lodash', 'eventEmitter'], function(require, exports, $, _, EventEmitter) {
    // Simple parseInt wrapper
    var toNumber = function (n) {
        return parseInt(n, 10) || 0;
    };

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
    (function (DDTBounds) {
        DDTBounds[DDTBounds["LOW"] = 0] = "LOW";
        DDTBounds[DDTBounds["IN"] = 1] = "IN";
        DDTBounds[DDTBounds["HIGH"] = 2] = "HIGH";
    })(exports.DDTBounds || (exports.DDTBounds = {}));
    var DDTBounds = exports.DDTBounds;

    

    /**
    * Little any key vs any value map
    */
    var DDTMap = (function () {
        function DDTMap() {
            this.keys = [];
            this.values = [];
        }
        DDTMap.prototype.has = function (key) {
            return this.keys.indexOf(key) > -1;
        };

        DDTMap.prototype.get = function (key) {
            if (!this.has(key)) {
                throw new Error('Value for key ' + key + ' not found');
            }

            return this.values[this.keys.indexOf(key)];
        };

        DDTMap.prototype.set = function (key, value) {
            if (this.keys.indexOf(key) === -1) {
                this.keys.push(key);
            }

            this.values[this.keys.indexOf(key)] = value;

            return this;
        };

        DDTMap.prototype.remove = function (key) {
            if (this.has(key)) {
                this.values[this.keys.indexOf(key)] = undefined;
                this.keys[this.keys.indexOf(key)] = undefined;
            }

            return this;
        };
        return DDTMap;
    })();
    exports.DDTMap = DDTMap;

    /**
    * A class representing a point which we use across the whole library
    */
    var DDTPoint = (function () {
        function DDTPoint(x, y) {
            this.x = x;
            this.y = y;
        }
        DDTPoint.prototype.minus = function (point) {
            return new DDTPoint(this.x - point.x, this.y - point.y);
        };
        DDTPoint.prototype.add = function (point) {
            return new DDTPoint(this.x + point.x, this.y + point.y);
        };

        DDTPoint.prototype.gt = function (point, axis) {
            var key = DDTPoint.enumToAxis(axis);

            return this[key] > point[key];
        };

        DDTPoint.prototype.lt = function (point, axis) {
            var key = DDTPoint.enumToAxis(axis);

            return this[key] < point[key];
        };

        /**
        * Add a certain amount to a specific axis
        */
        DDTPoint.prototype.addToAxis = function (size, axis) {
            var point = [this.x, this.y];

            point[axis === 0 /* X */ ? 0 : 1] += size;

            return new DDTPoint(point[0], point[1]);
        };

        /**
        * Calculation taken from jQuery UI sortable.
        *
        * Used to calculate if a point is over another point by a certain amount
        */
        DDTPoint.prototype.isOverAxis = function (point, size, axis) {
            return this.gt(point.addToAxis(-1, axis), axis) && this.lt(point.addToAxis(size, axis), axis);
        };

        DDTPoint.fromJQuery = function (jquery) {
            var offset = jquery.offset() || { top: 0, left: 0 };

            return new DDTPoint(offset.left || 0, offset.top || 0);
        };
        DDTPoint.fromEvent = function (event) {
            return new DDTPoint(event.pageX, event.pageY);
        };
        DDTPoint.fromElement = function (element) {
            return DDTPoint.fromJQuery($(element));
        };

        DDTPoint.enumToAxis = function (axis) {
            return axis === 0 /* X */ ? 'x' : 'y';
        };
        return DDTPoint;
    })();
    exports.DDTPoint = DDTPoint;

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
        DDTCSS.defineSelector = function (selectorName, rules, newElement) {
            if (typeof newElement === "undefined") { newElement = false; }
            if (!DDTCSS.currentIndexes) {
                DDTCSS.currentIndexes = new DDTMap();
            }

            var element;

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

            var sheet = element.sheet;
            sheet.insertRule(selectorName + '{ ' + DDTCSS.rulesToCSS(rules) + ' }', DDTCSS.currentIndexes.get(element));

            DDTCSS.currentIndexes.set(element, DDTCSS.currentIndexes.get(element) + 1);

            return element;
        };

        DDTCSS.defineClass = function (className, rules, newElement) {
            if (typeof newElement === "undefined") { newElement = false; }
            return DDTCSS.defineSelector('.' + className, rules, newElement);
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

        DDTCSS.cleanup = function () {
            if (DDTCSS.currentIndexes) {
                DDTCSS.currentIndexes.remove(DDTCSS.styleElement);
            }

            DDTCSS.currentIndexes = null;

            if (DDTCSS.styleElement) {
                DDTCSS.styleElement.parentNode.removeChild(DDTCSS.styleElement);
            }

            DDTCSS.styleElement = undefined;
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
            this.emitter = new EventEmitter();
        }
        /**
        * Get the HTMLElement from the jQuery object
        */
        DDTElement.prototype.getNode = function () {
            return this.element[0];
        };

        /**
        * Get the offset top of an element from a parent.
        */
        DDTElement.prototype.offsetTop = function () {
            if (this.element[0] instanceof Window) {
                return this.element.scrollTop();
            }

            return (this.element.offset() || { top: 0 }).top;
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

        /**
        * Calculate if an element is in the bounds of its parent
        */
        DDTElement.prototype.calculateBounds = function (parent, diffY, positions, parentOffset) {
            if (typeof diffY === "undefined") { diffY = 0; }
            if (typeof positions === "undefined") { positions = null; }
            if (typeof parentOffset === "undefined") { parentOffset = parent.offsetTop(); }
            // Just some calculations
            var ourOffset = positions ? positions.y : this.offsetTop();
            var ourHeight = this.element.outerHeight();
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
            return toNumber(el.css('border-top-width')) + toNumber(el.css('border-bottom-width'));
        };
        DDTElement.notVisible = 'DDTNotVisible';
        DDTElement.shadowTable = 'DDTShadowTable';
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
                var position = DDTPoint.fromEvent(event);

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

                        position = new DDTPoint(position.x, newPos);
                    }
                }

                _this.setPosition(position, axis);
            };

            container.on('mousemove', updateFunction).one('mouseup', function () {
                container.off('mousemove', updateFunction);
                bodyElement.selectable();
            });
        };

        DDTPositionableElement.prototype.setPosition = function (point, axis) {
            if (typeof axis === "undefined") { axis = null; }
            if (!axis) {
                axis = [0 /* X */, 1 /* Y */];
            }

            var obj = {};

            if (axis.indexOf(0 /* X */) > -1) {
                obj.left = point.x;
            }

            if (axis.indexOf(1 /* Y */) > -1) {
                obj.top = point.y;
            }

            this.element.css(obj);

            var pos = this.element.offset();

            this.emitter.trigger('position', [new DDTPoint(pos.left, pos.top)]);
        };
        return DDTPositionableElement;
    })(DDTElement);
    exports.DDTPositionableElement = DDTPositionableElement;

    // @todo Investigate removing this
    var DDTRow = (function (_super) {
        __extends(DDTRow, _super);
        function DDTRow() {
            _super.apply(this, arguments);
        }
        return DDTRow;
    })(DDTElement);
    exports.DDTRow = DDTRow;

    // @todo Investigate removing this
    var DDTShadowRow = (function (_super) {
        __extends(DDTShadowRow, _super);
        function DDTShadowRow() {
            _super.apply(this, arguments);
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
            var colgroup = $(document.createElement('colgroup'));
            var cols;

            if (this.element.children('colgroup').length) {
                this.element.children('colgroup').remove();
            }

            cols = _.map(row.element.children('td'), function (td) {
                return $(document.createElement('col')).width($(td).outerWidth());
            });

            colgroup.append(cols);

            this.element.prepend(colgroup);
        };
        return DDTShadowTable;
    })(DDTTable);
    exports.DDTShadowTable = DDTShadowTable;

    var DragAndDropTable = (function (_super) {
        __extends(DragAndDropTable, _super);
        function DragAndDropTable(table, options) {
            if (typeof options === "undefined") { options = {}; }
            var _this = this;
            _super.call(this);
            this.couldHaveChanged = false;
            this._options = { enabled: false };
            this.rowSelector = '> tbody > tr';
            this.cache = {};
            this.isEnabled = function () {
                return _this._options.enabled;
            };
            this.getMovingAxis = function () {
                return _this.options.verticalOnly ? [1 /* Y */] : [0 /* X */, 1 /* Y */];
            };
            this.getRows = function () {
                return _this.table.element.find(_this.rowSelector);
            };
            this.calculateValues = function () {
                return _.map(_this.$rows, function (row) {
                    return $(row).attr(_this.options.valueAttribute);
                });
            };
            this.options = _.clone(DragAndDropTable.defaultOptions);
            this.table = new DDTTable(table);
            this.$rows = this.getRows();
            this.lastValues = this.calculateValues();

            _.extend(this.options, options);

            this.wireEvents();
            DragAndDropTable.createSelectors();
        }
        DragAndDropTable.prototype.wireEvents = function () {
            var _this = this;
            this.table.element.on('mousedown', this.rowSelector, function (e) {
                if (!_this.isEnabled() || e.which !== 1) {
                    return;
                }

                e.stopImmediatePropagation();

                var $row = $(e.currentTarget);
                _this.dragRow($row, DDTPoint.fromEvent(e));
            });
        };

        DragAndDropTable.prototype.dragRow = function (rowElement, mousePosition) {
            var _this = this;
            var row = new DDTRow(rowElement);
            var shadow = this.table.createShadow(row);
            var rowPosition = DDTPoint.fromJQuery(rowElement);
            var diff = mousePosition.minus(rowPosition);
            var tbody = this.table.element.children('tbody');
            var offBy = DragAndDropTable.calculateOffBy(rowElement[0], tbody);
            var cssEl = DDTCSS.defineSelector('body', { cursor: this.options.cursor }, true);

            this.cache.tableOffset = this.table.offsetTop();
            this.cacheRowPoints();

            shadow.element.appendTo(this.options.shadowContainer);
            shadow.emitter.on('position', function (point) {
                return _this.dragged(row, shadow, point);
            });

            shadow.attachToCursor(DragAndDropTable.$document, diff.add(offBy), this.getMovingAxis(), this.getBindingElement());

            // Set the initial position of the shadow
            shadow.setPosition(rowPosition.minus(offBy));

            // Hide the row that we've started to drag, as the shadow has replaced it
            row.hide();

            DragAndDropTable.$document.one('mouseup', function () {
                return _this.endDrag(row, shadow, cssEl);
            });
        };

        DragAndDropTable.prototype.disable = function () {
            this._options.enabled = false;
        };
        DragAndDropTable.prototype.enable = function () {
            this._options.enabled = true;
        };

        DragAndDropTable.prototype.cacheRowPoints = function () {
            this.cache.rowPoints = _.map(this.getRows(), function (tr) {
                return DDTPoint.fromElement(tr);
            });
        };

        DragAndDropTable.prototype.getBindingElement = function () {
            if (this.options.containment) {
                return this.options.containment;
            }

            if (this.options.bindToTable) {
                return this.table.getTbody();
            }

            return null;
        };

        DragAndDropTable.calculateOffBy = function (row, tbody) {
            var styles = window.getComputedStyle(row);
            var minus = [0, 0];

            if (styles.getPropertyValue('border-collapse') === 'separate') {
                minus[1] = toNumber(styles.getPropertyValue('border-spacing').split(' ')[1]);
            } else {
                minus[0] = (toNumber(tbody.css('border-right-width')) - toNumber(tbody.css('border-left-width'))) / 2;
            }

            return new DDTPoint(minus[0], minus[1]);
        };

        DragAndDropTable.prototype.dragged = function (row, shadow, point) {
            this.handleRowSwapping(row, shadow, point);
            this.handleScrolling(shadow);
        };

        DragAndDropTable.prototype.endDrag = function (row, shadow, cssEl) {
            shadow.element.remove();
            row.show();
            cssEl.parentNode.removeChild(cssEl);

            if (this.couldHaveChanged) {
                var values = this.calculateValues();

                if (this.hasChanged(values)) {
                    this.emitValues(values);
                }

                this.couldHaveChanged = false;
                this.$rows = null;
            }
        };

        DragAndDropTable.prototype.handleRowSwapping = function (row, shadow, point) {
            var _this = this;
            var rows = this.$rows = this.getRows();
            var node = row.getNode();

            _.each(rows, function (tr, i) {
                if (tr === node) {
                    return;
                }

                var cachedPoint = _this.cache.rowPoints[i];
                var toSwapWith = _this.calculateRowToSwapWith(tr, point, shadow, cachedPoint);

                if (toSwapWith && row.getNode() !== toSwapWith[0]) {
                    // here be dragons
                    // something to do with missed events?
                    // http://cl.ly/Xfo3
                    var ourIndex = row.element.index();
                    var theirIndex = toSwapWith.index();
                    var diff = theirIndex - ourIndex;
                    var mod = diff < 0 ? -1 : 1;
                    var rows = row.element.parent().children();

                    for (var i = 1; i <= (diff * mod); i++) {
                        _this.swap(row, new DDTElement(rows.eq(ourIndex + (i * mod))), shadow);
                    }
                }
            });
        };

        DragAndDropTable.prototype.hasChanged = function (values) {
            var _this = this;
            if (typeof values === "undefined") { values = this.calculateValues(); }
            return _.some(values, function (val, i) {
                return val !== _this.lastValues[i];
            });
        };

        DragAndDropTable.prototype.emitValues = function (values) {
            if (typeof values === "undefined") { values = this.calculateValues(); }
            this.trigger('reorder', [values]);

            this.lastValues = values;
        };

        DragAndDropTable.prototype.swap = function (row, toSwapWith, shadow) {
            row.swap(toSwapWith);
            DDTElement.cloneUniqueStyles(row.element[0], shadow.row.element[0], ['visibility']);
            shadow.fixBackgroundColor(row);

            this.couldHaveChanged = true;
            this.cacheRowPoints();
        };

        DragAndDropTable.prototype.calculateRowToSwapWith = function (currentRow, point, shadow, rowCoords) {
            if (typeof rowCoords === "undefined") { rowCoords = DDTPoint.fromElement(currentRow); }
            var $tr = $(currentRow);
            var limits = shadow.calculateBounds(this.table, 2, null, this.cache.tableOffset);

            var toSwapWith;

            if (limits === 0 /* LOW */) {
                toSwapWith = $(this.$rows[0]);
            } else if (limits === 2 /* HIGH */) {
                toSwapWith = $(_.last(this.$rows));
            } else if (point.isOverAxis(rowCoords, $tr.height() / 2, 1 /* Y */)) {
                toSwapWith = $tr;
            }

            return toSwapWith;
        };

        DragAndDropTable.prototype.handleScrolling = function (shadow) {
            switch (shadow.calculateBounds(DragAndDropTable.window)) {
                case 2 /* HIGH */:
                    this.scrollWebPage(5);
                    this.scrollAgainSoon(shadow);
                    break;

                case 0 /* LOW */:
                    this.scrollWebPage(-5);
                    break;
            }
        };

        DragAndDropTable.prototype.scrollWebPage = function (amount) {
            document.body.scrollTop += amount;
        };

        DragAndDropTable.prototype.scrollAgainSoon = function (shadow) {
            var _this = this;
            setTimeout(function () {
                return _this.handleScrolling(shadow);
            }, 100);
        };

        DragAndDropTable.createSelectors = function () {
            if (DragAndDropTable.hasCreatedSelectors) {
                return;
            }

            DragAndDropTable.hasCreatedSelectors = true;

            DDTCSS.defineClass(DDTElement.notVisible, { visibility: 'hidden' });
            DDTCSS.defineClass(DDTElement.shadowTable, { position: 'absolute !important', zIndex: 999999 });
            DDTCSS.defineSelector('.' + DDTElement.noSelect + ', .' + DDTElement.noSelect + ' *', {
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                MsUserSelect: 'none',
                OUserSelect: 'none',
                userSelect: 'none'
            });
        };
        DragAndDropTable.defaultOptions = {
            verticalOnly: true,
            containment: null,
            bindToTable: true,
            shadowContainer: document.body,
            cursor: 'default',
            valueAttribute: 'data-value'
        };

        DragAndDropTable.hasCreatedSelectors = false;

        DragAndDropTable.window = new DDTElement($(window));
        DragAndDropTable.$document = $(document);
        return DragAndDropTable;
    })(EventEmitter);
    exports.DragAndDropTable = DragAndDropTable;

    function init(table, options) {
        if (typeof options === "undefined") { options = {}; }
        return new DragAndDropTable(table, options);
    }
    exports.init = init;
});
//# sourceMappingURL=ddt.js.map
