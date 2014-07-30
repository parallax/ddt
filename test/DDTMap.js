/// <reference path='../ddt.d.ts' />
define(["require", "exports", '../ddt', 'chai'], function(require, exports, ddt, chai) {
    var TestObject = (function () {
        function TestObject() {
        }
        return TestObject;
    })();

    describe('DDTMap', function () {
        var expect = chai.expect;

        var map;

        beforeEach(function () {
            return map = new ddt.DDTMap();
        });

        describe('#has()', function () {
            it('should return if the map has a key or not', function () {
                expect(map.has(new TestObject())).to.equal(false);

                var obj = new TestObject();

                map.set(obj, 5);

                expect(map.has(obj)).to.equal(true);
            });
        });

        describe('#get()', function () {
            it('should throw error when getting non-existant value', function () {
                expect(function () {
                    return map.get(new TestObject());
                }).to.throw(Error, /Value for key.+not found/);
            });

            it('should return the correct object', function () {
                var obj = new TestObject();
                map.set(obj, 5);

                expect(map.get(obj)).to.equal(5);
            });
        });

        describe('#set()', function () {
            it('should set a value', function () {
                var obj = new TestObject();
                map.set(obj, 5);

                expect(map.get(obj)).to.equal(5);

                map.set(obj, 10);

                expect(map.get(obj)).to.equal(10);
            });
        });
    });
});
