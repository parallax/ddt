/// <reference path='../ddt.d.ts' />

import ddt  = require('../ddt');
import chai = require('chai');

function getStyleElementCount() : number {
    return $('style').length;
}

describe('DDTCSS', function() {
    var expect   = chai.expect;
    var DDTCSS   = ddt.DDTCSS;

    after(DDTCSS.cleanup);
    before(DDTCSS.cleanup);
    afterEach(DDTCSS.cleanup);
    beforeEach(DDTCSS.cleanup);

    describe('#defineSelector()', function() {
        it('should be able to define a new selector', function() {
            DDTCSS.defineSelector('p', { color : 'rgb(251, 205, 234)' });
            expect($(document.createElement('p')).appendTo('body').css('color')).to.equal('rgb(251, 205, 234)');
        });

        it('should only create one new element', function() {
            var curr = getStyleElementCount();
            DDTCSS.defineSelector('p', { color : 'blue' });
            DDTCSS.defineSelector('div', { color : 'red' });
            expect(getStyleElementCount()).to.equal(curr + 1);
        });

        it('should let you make new elements if you would like', function() {
            var curr = getStyleElementCount();
            DDTCSS.defineSelector('p', { color : 'blue' }, true);
            DDTCSS.defineSelector('div', { color : 'red' }, true);
            expect(getStyleElementCount()).to.equal(curr + 2);
        });
    });

    describe('#defineClass', function() {
        it('should define a class', function() {
            DDTCSS.defineClass('foo', { color : 'rgb(251, 205, 234)' });
            var $p = $(document.createElement('p')).addClass('foo').appendTo('body');
            expect($p.css('color')).to.equal('rgb(251, 205, 234)');
        });

        it('should not define a tag selector', function() {
            DDTCSS.defineClass('p', { color : 'rgb(251, 205, 234)' });
            var $p = $(document.createElement('p')).addClass('foo').appendTo('body');
            expect($p.css('color')).to.not.equal('rgb(251, 205, 234)');
        });
    });

    describe('#rulesToCSS()', function() {
        it('should work with just one rule', function() {
            expect(DDTCSS.rulesToCSS({ color : 'red' })).to.equal('color:red;');
        });

        it('should work with multiple rules', function() {
            expect(DDTCSS.rulesToCSS({
                color : 'red',
                background : 'blue'
            })).to.equal('color:red;background:blue;');
        });

        it('should convert from arrow case', function() {
            expect(DDTCSS.rulesToCSS({ WebkitBorderRadius : '10px' })).to.equal('-webkit-border-radius:10px;');
        });
    });

    describe('#arrowCase()', function() {
        it('should leave normal strings alone', function() {
            expect(DDTCSS.arrowCase('foo')).to.equal('foo');
        });

        it('should work', function() {
            expect(DDTCSS.arrowCase('WebkitBorderRadius')).to.equal('-webkit-border-radius');
        });
    });

    describe('#cleanup()', function() {
        it('should work', function() {
            DDTCSS.defineSelector('p', { color : 'blue' });
            DDTCSS.defineSelector('div', { color : 'red' });
            var curr = getStyleElementCount();
            DDTCSS.cleanup();
            expect(getStyleElementCount()).to.equal(curr - 1);
        });
    });
});
