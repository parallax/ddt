define(['ddt', 'knockout'], function(ddt, ko) {

    'use strict';

    var DATA_KEY = 'ddtObject';

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

});