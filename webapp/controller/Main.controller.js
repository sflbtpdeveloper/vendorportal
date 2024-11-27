sap.ui.define([
    'zmmsubcontract/controller/BaseController'
], function(BaseController) {
    'use strict';
    return BaseController.extend("zmmsubcontract.controller.welcome",{
        onInit: function(){
            this.oRouter = this.getOwnerComponent().getRouter();   
        },
        OnSubcon: function(){
            this.oRouter.navTo("subcon");  
        }
    });
});