define(['ddt', 'jquery'], function(ddt, $) {

    'use strict';

    $.fn.ddt = function() {
        return new ddt.DragAndDropTable($(this));
    };

});