sap.ui.define([
    'zmmsubcontract/controller/BaseController',
], function (BaseController) {
    'use strict';
    return BaseController.extend("zmmsubcontract.controller.asndel", {
        onInit: function () {
            BaseController.prototype.onInit.apply(this);           
        }
    });
});