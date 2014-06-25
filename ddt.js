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

            _this.diff = null;
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

        var $currentRow = this.$currentRow = $(row);
        var offset = this.$currentRow.offset();
        var computed = window.getComputedStyle(row);
        var spacing = computed['border-spacing'].split(' ').map(function (n) {
            return parseInt(n, 10);
        });

        this.diff = {
            top: position.top - offset.top + spacing[1],
            left: position.left - offset.left
        };

        var clone = DDT.cloneElement(row, computed);

        this.$clone = $(clone);
        this.$clone.addClass(DDT.CloneElementClass);
        this.$clone.appendTo('body');

        this.updateClonePosition(position);

        this.$currentRow.addClass(DDT.DDTNotVisibleClass);
        $('body').addClass(DDT.NoSelectClass);
    };

    DDT.prototype.updateClonePosition = function (position) {
        this.$clone.css({
            top: position.top - this.diff.top + 'px',
            left: position.left - this.diff.left + 'px'
        });
    };

    DDT.eventToPosition = function (e) {
        return {
            top: e.pageY,
            left: e.pageX
        };
    };

    DDT.cloneElement = function (element, computed) {
        if (typeof computed === "undefined") { computed = null; }
        var table = document.createElement('table');
        var clone = document.createElement(element.tagName);

        if (!computed) {
            computed = window.getComputedStyle(element);
        }

        clone.innerHTML = element.innerHTML;
        clone.setAttribute('style', computed.cssText);

        table.appendChild(clone);

        return table;
    };

    DDT.defineCSSSelector = function (selectorName, rules) {
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

    DDT.defineCSSClass = function (className, rules) {
        return DDT.defineCSSSelector('.' + className, rules);
    };
    DDT.DDTNotVisibleClass = 'DDTNotVisible';
    DDT.CloneElementClass = 'DDTCloneElementClass';
    DDT.NoSelectClass = 'DDTNoSelectClass';
    return DDT;
})();

DDT.defineCSSClass(DDT.DDTNotVisibleClass, { visibility: 'hidden' });
DDT.defineCSSClass(DDT.CloneElementClass, { position: 'absolute !important' });
DDT.defineCSSSelector('.' + DDT.NoSelectClass + ', .' + DDT.NoSelectClass + ' *', {
    '-webkit-user-select': 'none',
    '-ms-user-select': 'none',
    '-o-user-select': 'none',
    'user-select': 'none',
    'cursor': 'default'
});
