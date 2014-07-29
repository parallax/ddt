/**
 * Created by nathaniel on 29/07/2014.
 */

/// <reference path='../typings/tsd.d.ts' />

import ddt  = require('../ddt');
import chai = require('chai');

describe('DDTPoint', function() {
    var expect   = chai.expect;
    var DDTPoint = ddt.DDTPoint;
    var DDTAxis  = ddt.DDTAxis;

    it('should store values on properties', function() {
        var point = new DDTPoint(5, 10);

        expect(point).to.have.property('x').and.equal(5);
        expect(point).to.have.property('y').and.equal(10);
    });

    describe('#minus()', function() {
        it('should minus both properties', function() {
            var point = (new DDTPoint(10, 15)).minus(new DDTPoint(5, 5));

            expect(point).to.have.property('x').and.equal(5);
            expect(point).to.have.property('y').and.equal(10);
        });
    });

    describe('#add()', function() {
        it('should add both properties', function() {
            var point = (new DDTPoint(10, 15)).add(new DDTPoint(5, 5));

            expect(point).to.have.property('x').and.equal(15);
            expect(point).to.have.property('y').and.equal(20);
        });
    });

    describe('#lt()', function() {
        it('should work on the horizontal axis', function() {
            var point1 = new DDTPoint(5, 10);
            var point2 = new DDTPoint(10, 5);

            expect(point1.lt(point2, DDTAxis.X)).to.equal(true);
            expect(point2.lt(point1, DDTAxis.X)).to.equal(false);
        });

        it('should work on the vertical axis', function() {
            var point1 = new DDTPoint(5, 10);
            var point2 = new DDTPoint(10, 5);

            expect(point1.lt(point2, DDTAxis.Y)).to.equal(false);
            expect(point2.lt(point1, DDTAxis.Y)).to.equal(true);
        });
    });

    describe('#gt()', function() {
        it('should work on the horizontal axis', function() {
            var point1 = new DDTPoint(5, 10);
            var point2 = new DDTPoint(10, 5);

            expect(point1.gt(point2, DDTAxis.X)).to.equal(false);
            expect(point2.gt(point1, DDTAxis.X)).to.equal(true);
        });

        it('should work on the vertical axis', function() {
            var point1 = new DDTPoint(5, 10);
            var point2 = new DDTPoint(10, 5);

            expect(point1.gt(point2, DDTAxis.Y)).to.equal(true);
            expect(point2.gt(point1, DDTAxis.Y)).to.equal(false);
        });
    });

    describe('#addToAxis', function() {
        it('should only add to a specific axis', function() {
            var point1 = new DDTPoint(5, 10);
            var point2 = point1.addToAxis(10, DDTAxis.X);
            var point3 = point2.addToAxis(4, DDTAxis.Y);

            expect(point3).to.have.property('x').and.to.equal(15);
            expect(point3).to.have.property('y').and.to.equal(14);
        });
    });

    describe('#isOverAxis()', function() {
        it('should work', function() {
            var point = new DDTPoint(10, 10);
            var point2 = new DDTPoint(10, 15);

            expect(point2.isOverAxis(point, 6, DDTAxis.Y)).to.equal(true);
            expect(point2.isOverAxis(point, 4, DDTAxis.Y)).to.equal(false);
        });
    });

    describe('#fromEvent()', function() {
        it('should convert an event object to a point', function() {
            var point = DDTPoint.fromEvent({ pageX : 5, pageY : 10 });

            expect(point).to.have.property('x').and.to.equal(5);
            expect(point).to.have.property('y').and.to.equal(10);
        });
    });

    describe('#fromElement()', function() {
        it('should get the point of an object on the screen', function() {
            var elem = $(document.createElement('div')).css({
                top      : 5,
                left     : 15,
                position : 'absolute'
            }).appendTo('body')[0];

            var point = DDTPoint.fromElement(elem);

            expect(point).to.have.property('x').and.to.equal(15);
            expect(point).to.have.property('y').and.to.equal(5);
        });
    });

    describe('#fromJQuery()', function() {
        it('should get the point of an object on the screen', function() {
            var elem = $(document.createElement('div')).css({
                top      : 5,
                left     : 15,
                position : 'absolute'
            }).appendTo('body');

            var point = DDTPoint.fromJQuery(elem);

            expect(point).to.have.property('x').and.to.equal(15);
            expect(point).to.have.property('y').and.to.equal(5);
        });
    });

    describe('#enumToAxis', function() {
        it('should return the correct axis from the enum', function() {
            expect(DDTPoint.enumToAxis(DDTAxis.X)).to.equal('x');
            expect(DDTPoint.enumToAxis(DDTAxis.Y)).to.equal('y');
        });
    });
});
