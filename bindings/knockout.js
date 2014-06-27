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

    ['verticalOnly', 'boundToTBody'].forEach(function(option) {
        var key = 'ddt' + option[0].toUpperCase() + option.substr(1);

        ko.bindingHandlers[key] = {
            update : function(element, valueAccessor) {
                var value = ko.unwrap(valueAccessor());
                var table = ko.utils.domData.get(element, DATA_KEY);

                if (!table) {
                    throw new DDTErrorNoDDTBinding();
                }

                table[option] = value;
            }
        };
    })

    return {
        DDTErrorNoDDTBinding : DDTErrorNoDDTBinding
    };
});
