/// <reference path='./typings/jquery/jquery.d.ts' />
/// <reference path='./typings/lodash/lodash.d.ts' />

var DDT = (function () {
    function DDT(element) {
        var _this = this;
        this.element = element;
        this.mousemove = function (e) {
            return _this.updateClonePosition(DDT.eventToPosition(e));
        };
        this.endDrag = function () {
            $(document).off('mousemove', _this.mousemove);

            _this.$clone.remove();
            _this.$clone = null;

            _this.$currentRow.removeClass(DDT.DDTNotVisibleClass);
            _this.$currentRow = null;
        };
        this.$element = $(this.element);

        this.wireEvents();
    }
    DDT.prototype.wireEvents = function () {
        var _this = this;
        this.$element.on('mousedown', 'tr', function (e) {
            return _this.startDrag(e.currentTarget, DDT.eventToPosition(e));
        });
    };

    DDT.prototype.startDrag = function (row, position) {
        $(document).one('mouseup', this.endDrag).on('mousemove', this.mousemove);

        this.$currentRow = $(row);
        this.initialPosition = position;

        var clone = DDT.cloneElement(row);

        this.$clone = $(clone);
        this.$clone.addClass(DDT.CloneElementClass);
        this.$clone.appendTo('body');
        this.$currentRow.addClass(DDT.DDTNotVisibleClass);
    };

    DDT.prototype.updateClonePosition = function (position) {
        this.$clone.css({
            top: position.top,
            left: position.left
        });
    };

    DDT.eventToPosition = function (e) {
        return {
            top: e.pageY,
            left: e.pageX
        };
    };

    DDT.cloneElement = function (element) {
        var clone = document.createElement(element.tagName);

        clone.innerHTML = element.innerHTML;

        clone.setAttribute('style', window.getComputedStyle(element).cssText);

        return clone;
    };

    DDT.defineCSSClass = function (className, rules) {
        var style = document.createElement('style');

        style.appendChild(document.createTextNode(''));

        document.head.appendChild(style);

        var sheet = style.sheet;
        var css = '';

        _.chain(rules).pairs().each(function (pair) {
            css += pair[0] + ':' + pair[1] + ';';
        });

        sheet.addRule('.' + className, css, 0);
    };
    DDT.DDTNotVisibleClass = 'DDTNotVisible';
    DDT.CloneElementClass = 'DDTCloneElementClass';
    return DDT;
})();

DDT.defineCSSClass(DDT.DDTNotVisibleClass, { visibility: 'hidden' });
DDT.defineCSSClass(DDT.CloneElementClass, { position: 'absolute' });
