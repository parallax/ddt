define(['ddt', 'knockout'], function(ddt, ko) {

    'use strict';

    var DATA_KEY = 'ddtObject';

    function DDTErrorNoDDTBinding() {
        this.message = 'Must apply the ddt binding to use this binding.';
        this.stack = (new Error().stack);
    }

    DDTErrorNoDDTBinding.prototype = new Error();
    DDTErrorNoDDTBinding.prototype.constructor = DDTErrorNoDDTBinding;

    ko.bindingHandlers.ddt = {
        init: function(element, valueAccessor) {
            var table = new ddt.DragAndDropTable($(element));
            var value = ko.unwrap(valueAccessor());

            if (!value) {
                table.disable();
            }

            ko.utils.domData.set(element, DATA_KEY, table);
        },

        update: function(element, valueAccessor) {
            var value = ko.unwrap(valueAccessor());
            var table = ko.utils.domData.get(element, DATA_KEY);

            if (value) {
                table.enable();
            } else {
                table.disable();
            }
        }
    };

    function capitalise(str) {
        return str[0].toUpperCase() + str.substr(1);
    }

    Object.keys(ddt.DragAndDropTable.defaultOptions).forEach(function(option) {
        var key = 'ddt' + capitalise(option);

        ko.bindingHandlers[key] = {
            update : function(element, valueAccessor) {
                var value = ko.unwrap(valueAccessor());
                var table = ko.utils.domData.get(element, DATA_KEY);

                if (!table) {
                    throw new DDTErrorNoDDTBinding();
                }

                table.options[option] = value;
            }
        };
    });

    ['reorder'].forEach(function(eventName) {
        var key = 'ddtEvent' + capitalise(eventName);

        ko.bindingHandlers[key] = {
            init : function(element, valueAccessor) {
                var value = ko.unwrap(valueAccessor());
                var table = ko.utils.domData.get(element, DATA_KEY);

                if (!table) {
                    throw new DDTErrorNoDDTBinding();
                }

                table.on(eventName, value);
            }
        }
    });

    return {
        DDTErrorNoDDTBinding : DDTErrorNoDDTBinding
    };
});
