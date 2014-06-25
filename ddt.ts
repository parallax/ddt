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

    private initialPosition : DDTPosition;

    static DDTNotVisibleClass = 'DDTNotVisible';
    static CloneElementClass = 'DDTCloneElementClass';

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
            .on('mousemove', this.mousemove)

        this.$currentRow = $(row);
        this.initialPosition = position;


        var clone = DDT.cloneElement(row);

        this.$clone = $(clone);
        this.$clone.addClass(DDT.CloneElementClass);
        this.$clone.appendTo('body');
        this.$currentRow.addClass(DDT.DDTNotVisibleClass);
    }

    updateClonePosition(position : DDTPosition) {
        this.$clone.css({
            top : position.top,
            left : position.left
        });
    }

    mousemove = (e) => this.updateClonePosition(DDT.eventToPosition(e));

    endDrag = ()  => {
        $(document).off('mousemove', this.mousemove);

        this.$clone.remove();
        this.$clone = null;

        this.$currentRow.removeClass(DDT.DDTNotVisibleClass);
        this.$currentRow = null;
    };

    private static eventToPosition(e : Event) : DDTPosition {
        return {
            top  : e.pageY,
            left : e.pageX
        };
    }

    private static cloneElement(element : HTMLElement) : Element {
        var clone = document.createElement(element.tagName);

        clone.innerHTML = element.innerHTML;

        clone.setAttribute('style', window.getComputedStyle(element).cssText);

        return clone;
    }

    static defineCSSClass(className : string, rules : Object) {
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

        sheet.addRule('.' + className, css, 0);
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
DDT.defineCSSClass(DDT.CloneElementClass, { position : 'absolute' })
