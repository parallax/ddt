/// <reference path='../ddt.ts' />

import ddt = require('../ddt');
import chai = require('chai');

describe('DDTElement', function() {
    var expect = chai.expect;
    var DDTElement = ddt.DDTElement;

    describe('#getNode()', function() {
        it('should return the node it represents', function() {
            var el = document.createElement('p');
            var $el = $(el);
            var dEl = new DDTElement($el);

            expect(dEl.getNode()).to.equal(el);
        });
    });

    describe('#offsetTop()', function() {
        it('should return the top offset of an element', function() {
            var $el = $(document.createElement('div'))
                .css({
                    top : 10,
                    left : 5,
                    position : 'absolute'
                })
                .appendTo('body');

            var dEl = new DDTElement($el);

            expect(dEl.offsetTop()).to.equal(10);
        });

        it('should work for the document', function() {
            var dEl = new DDTElement($(document));

            expect(dEl.offsetTop()).to.equal(0);
        });
    });

    describe('#hide(), #show()', function() {
        beforeEach(function() {
            ddt.DragAndDropTable.createSelectors();
            ddt.DragAndDropTable.hasCreatedSelectors = false;
        });

        afterEach(ddt.DDTCSS.cleanup);

        it('should hide/show an element', function() {
            var $el = $(document.createElement('p'))
                .appendTo('body');

            var dEl = new DDTElement($el);

            dEl.hide();

            expect($el.css('visibility')).to.equal('hidden');

            dEl.show();

            expect($el.css('visibility')).to.equal('visible');
        });
    });

    describe('#getVerticalBorders()', function() {
        it('should work', function() {
            var $el = $(document.createElement('div'))
                .css({ border : '10px solid black '});

            expect(DDTElement.getVerticalBorders($el)).to.equal(20);
        });
    });
});
