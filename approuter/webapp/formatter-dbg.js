sap.ui.define([
    "sap/ui/core/format/DateFormat"
], function () {
    "use strict";
    return {
        formatDate: function(date) {
            debugger;
            if (!date) {
                return "";
            }
            var oDateFormat = DateFormat.getDateInstance({
                pattern: "yyyy-MM-dd'T'HH:mm:ss"
            });
            return oDateFormat.format(new Date(date));
        },
        JOBSTATFF: function(Jobstat)
        {
            return  (Jobstat === 'C') ?  "Success"  :  "Error";                                
        }, 
        formatDateStat: function (sValue) {
            if (sValue) {
                var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({ pattern: "dd-MM-yyyy" });
                return oDateFormat.format(new Date(sValue));
            }
            return sValue;
        }               
    };
});