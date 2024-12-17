sap.ui.define([
    "sap/ui/core/format/DateFormat"
], function (DateFormat) {
    "use strict";
    return {
        formatDate: function (date) {
            debugger;
            var oDateFormat = DateFormat.getDateInstance({
                pattern: "yyyy-MM-dd'T'HH:mm:ss"
            });
            return oDateFormat.format(new Date(date));
        },
        SWITCHFF: function(oEvent)        
        {
		    debugger;
            return (Salary > 60000) ?  true   : false;
                    
        },        
    };
});