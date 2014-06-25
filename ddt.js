/// <reference path='./typings/jquery/jquery.d.ts' />
/// <reference path='./typings/lodash/lodash.d.ts' />

var DDT = (function () {
    function DDT(element) {
        var _this = this;
        this.element = element;
        this.mousemove = function (e) {
            _this.updateClonePosition(DDT.eventToPosition(e));
        };
        this.endDrag = function () {
            $(document).off('mousemove', _this.mousemove);
            $('body').removeClass(DDT.NoSelectClass);

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

        $('body').addClass(DDT.NoSelectClass);

        this.$currentRow = $(row);

        var clone = DDT.cloneElement(row);

        this.$clone = $(clone);
        this.$clone.addClass(DDT.CloneElementClass);
        this.$clone.appendTo('body');

        this.$currentRow.addClass(DDT.DDTNotVisibleClass);

        this.updateClonePosition(position);
    };

    DDT.prototype.updateClonePosition = function (position) {
        this.$clone.css({
            top: position.top + 'px',
            left: position.left + 'px'
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
    DDT.NoSelectClass = 'DDTNoSelectClass';
    return DDT;
})();

DDT.defineCSSClass(DDT.DDTNotVisibleClass, { visibility: 'hidden' });
DDT.defineCSSClass(DDT.CloneElementClass, { position: 'absolute !important' });
DDT.defineCSSClass(DDT.NoSelectClass, { '-webkit-user-select': 'none', '-ms-user-select': 'none', '-o-user-select': 'none', 'user-select': 'none', 'cursor': 'default' });
