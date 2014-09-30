/// <reference path='../ddt.ts' />

import ddt  = require('../ddt');
import chai = require('chai');


class TestObject {

}

describe('DDTMap', function() {
    var expect = chai.expect;

    var map : ddt.DDTMap<TestObject, number>;

    beforeEach(() => map = new ddt.DDTMap<TestObject, number>());

    describe('#has()', function() {
        it('should return if the map has a key or not', function() {
            expect(map.has(new TestObject())).to.equal(false);

            var obj = new TestObject();
            var obj2 = new TestObject();

            map.set(obj, 5);

            expect(map.has(obj)).to.equal(true);
            expect(map.has(obj2)).to.equal(false);
        });
    });

    describe('#get()', function() {
        it('should throw error when getting non-existent value', function() {
            expect(() => map.get(new TestObject())).to.throw(Error, /Value for key.+not found/);
        });

        it('should return the correct object', function() {
            var obj = new TestObject();
            var obj2 = new TestObject();
            map.set(obj, 5);
            map.set(obj2, 10);

            expect(map.get(obj)).to.equal(5);
            expect(map.get(obj2)).to.equal(10);
        });
    });

    describe('#set()', function() {
        it('should set a value', function() {
            var obj = new TestObject();
            map.set(obj, 5);

            expect(map.get(obj)).to.equal(5);

            map.set(obj, 10);

            expect(map.get(obj)).to.equal(10);
        });
    });

    describe('#remove()', function() {
        it('should remove a value', function() {
            var obj = new TestObject();
            var obj2 = new TestObject();

            map.set(obj, 10).set(obj2, 5);

            expect(map.has(obj)).to.equal(true);
            expect(map.has(obj2)).to.equal(true);

            map.remove(obj);

            expect(map.has(obj)).to.equal(false);
            expect(map.has(obj2)).to.equal(true);

            map.remove(obj2);

            expect(map.has(obj)).to.equal(false);
            expect(map.has(obj2)).to.equal(false);
        });
    });
});
