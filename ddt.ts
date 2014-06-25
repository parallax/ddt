/// <reference path='./typings/jquery/jquery.d.ts' />
/// <reference path='./typings/lodash/lodash.d.ts' />

interface Window {
    getMatchedCSSRules(element : Element) : CSSRuleList;
}

interface DDTPosition {
    top  : number;
    left : number;
}

interface Event {
    pageX : number;
    pageY : number;
}

class DDT {

    private $element    : JQuery;
    private $clone      : JQuery;
    private $currentRow : JQuery;

    private diff : DDTPosition;

    private borderSpacing : DDTPosition;

    static DDTNotVisibleClass = 'DDTNotVisible';
    static CloneElementClass = 'DDTCloneElementClass';
    static NoSelectClass = 'DDTNoSelectClass';

    constructor(private element : Element) {
        this.$element = $(this.element);

        this.wireEvents();
    }

    wireEvents() {
        this.$element.on('mousedown', 'tr', (e : any) => this.startDrag(e.currentTarget, DDT.eventToPosition(e)));
    }

    startDrag(row : HTMLElement, position : DDTPosition) {
        $(document)
            .one('mouseup',   this.endDrag)
            .on('mousemove', this.mousemove);

        var $currentRow = this.$currentRow = $(row);
        var offset = this.$currentRow.offset();
        var computed = window.getComputedStyle(row);
        var spacing = computed['border-spacing'].split(' ').map(n => parseInt(n, 10));

        this.diff = {
            top  : position.top - offset.top + spacing[1],
            left : position.left - offset.left
        };

        var clone = DDT.cloneElement(row, computed);

        this.$clone = $(clone);
        this.$clone.addClass(DDT.CloneElementClass);
        this.$clone.appendTo('body');

        this.updateClonePosition(position);

        this.$currentRow.addClass(DDT.DDTNotVisibleClass);
        $('body').addClass(DDT.NoSelectClass);
    }

    updateClonePosition(position : DDTPosition) {
        this.$clone.css({
            top : position.top   - this.diff.top  + 'px',
            left : position.left - this.diff.left + 'px'
        });
    }

    mousemove = (e) => {
        var pos = DDT.eventToPosition(e);
        this.updateClonePosition(pos);

        var tablePosition = this.$element.offset();

        this.$element.find('tr').each((i, row) => {

            if (pos.top < $(row).position().top) {
                $(row).before(this.$currentRow)
            }

            console.log($(row).position().top, pos.top);
        });
    }

    endDrag = ()  => {
        $(document).off('mousemove', this.mousemove);
        $('body').removeClass(DDT.NoSelectClass);

        this.$clone.remove();
        this.$clone = null;

        this.$currentRow.removeClass(DDT.DDTNotVisibleClass);
        this.$currentRow = null;

        this.diff = null;
    };

    private static eventToPosition(e : Event) : DDTPosition {
        return {
            top  : e.pageY,
            left : e.pageX
        };
    }

    private static cloneElement(element : HTMLElement, computed : CSSStyleDeclaration = null) : Element {
        var table       = document.createElement('table');
        var clone       = document.createElement(element.tagName);
        
        if (!computed) {
            computed = window.getComputedStyle(element);
        }

        clone.innerHTML = element.innerHTML;
        clone.setAttribute('style', computed.cssText);

        table.appendChild(clone);

        return table;
    }

    static defineCSSSelector(selectorName : string, rules : Object) {
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

    static defineCSSClass(className : string, rules : Object) {
        return DDT.defineCSSSelector('.' + className, rules);
    }

//    private static getElementStyles(element : Element) : CSSStyleRule[] {
//        if (typeof window.getMatchedCSSRules === 'function') {
//            return <CSSStyleRule[]> Array.prototype.slice.call(window.getMatchedCSSRules(element));
//        }
//
//        var rules = [];
//
//        Array.prototype.forEach.call(document.styleSheets, (sheet) => {
//            if (!sheet.cssRules) {
//                return;
//            }
//
//            Array.prototype.forEach.call(sheet.cssRules, (rule) => {
//               try {
//                    if (rule.selectorText && DDT.elementMatchesSelector(element, rule.selectorText)) {
//                        rules.push(rule);
//                    }
//               } catch (e) {}
//            });
//        });
//
//        return <CSSStyleRule[]> rules;
//    }
//
//    private static elementMatchesSelector(element : Element, selector : String) : Boolean {
//        var worker = DDT.getFunctionFromPrototype(Element.prototype, ['matches', 'matchesSelector', 'webkitMatchesSelector', 'mozMatchesSelector', 'msMatchesSelector', 'oMatchesSelector']);
//
//        if (!worker) {
//            return false;
//        }
//
//        return <Boolean> worker.call(element, selector);
//    }
//
//    private static getFunctionFromPrototype(prototype : Object, keys : String[]) : Function {
//        var filteredKeys = Object.keys(prototype).filter(
//            (key) => keys.indexOf(key) > -1
//        );
//
//        if (!filteredKeys.length) {
//            return null;
//        }
//
//        var firstKey = filteredKeys[0];
//
//        if (typeof prototype[firstKey] !== 'function') {
//            return null;
//        }
//
//        return prototype[firstKey];
//    }
}

DDT.defineCSSClass(DDT.DDTNotVisibleClass, { visibility : 'hidden'});
DDT.defineCSSClass(DDT.CloneElementClass, { position : 'absolute !important' })
DDT.defineCSSSelector('.' + DDT.NoSelectClass + ', .' + DDT.NoSelectClass + ' *', {
    '-webkit-user-select' : 'none',
    '-ms-user-select'     : 'none',
    '-o-user-select'      : 'none',
    'user-select'         : 'none',

    'cursor'              : 'default'
});
