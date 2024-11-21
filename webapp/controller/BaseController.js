sap.ui.define([
    'sap/ui/core/mvc/Controller', 
    'sap/ui/model/json/JSONModel',
], function(Controller,JSONModel) {
    'use strict';
    return Controller.extend("zmmsubcontract.controller.BaseController",{
        //global variable in base controller available in all child controllers        
        reuseCode: function(){
            
        },
        onInit: function(){
            debugger;
            this.oRouter = this.getOwnerComponent().getRouter();  
            var oModel = this.getOwnerComponent().getModel();                     
            sap.ui.getCore().setModel(oModel);

        }
    });
});