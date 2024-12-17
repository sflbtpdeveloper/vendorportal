sap.ui.define([
    'zmmsubcontract/controller/BaseController',
    'sap/m/MessageBox',
    'sap/m/MessageToast',
    'sap/ui/model/json/JSONModel',
    'sap/ui/core/Fragment',
    "sap/ui/core/date/UI5Date",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/PDFViewer"
], function (BaseController, MessageBox, MessageToast, JSONModel, Fragment, UI5Date, Filter, FilterOperator, PDFViewer) {
    'use strict';
    return BaseController.extend("zmmsubcontract.controller.asnprint", {

        _data: {
            dtValue: UI5Date.getInstance(),
            dtPattern: undefined
        },
        onInit: function () {
            BaseController.prototype.onInit.apply(this);
            this.oRouter = this.getOwnerComponent().getRouter();
            this._localModel = this.getOwnerComponent().getModel("local");

            // this.oRouter.attachRoutePatternMatched(this._onObjectMatched, this);
            this.oRouter.getRoute("asnprint").attachPatternMatched(this._onObjectMatched, this);
            debugger;

            this._userModel = this.getOwnerComponent().getModel("userModel");
            let storedUserInfo = localStorage.getItem("userInfo");
            if (storedUserInfo) {
                let parsedData = JSON.parse(storedUserInfo);
                this._userModel.setProperty("/",
                    {
                        email: parsedData.email,
                        user: parsedData.user,
                        scopes: parsedData.scopes
                    });
            }
            
            // let me = this;
            // debugger;
            // fetch("/getUserInformation")
            //     .then(res => res.json())
            //     .then(data => {
            //         me._userModel.setProperty("/",
            //             {
            //                 email: data.email,
            //                 user: data.user, // Store user information
            //                 scopes: data.scopes // Store user scopes
            //             });
            //         console.log(me._userModel.getProperty("/"));
            //     })
            //     .catch(err => console.log(err));
                            
            //*****SETTING DATA TO MODEL AND MAPPING THE TABLE********* */

            // this._readData();

            //******************************************************** */

            this.oRouter = this.getOwnerComponent().getRouter();
        },
        onBeforeRendering: function () {
            if (this.oRouter) {
                // Detach PatternMatched before re-rendering
                this.oRouter.getRoute("asnprint").detachPatternMatched(this._onObjectMatched, this);
            }
        },

        onAfterRendering: function () {
            // Re-attach PatternMatched after rendering
            this.oRouter.getRoute("asnprint").attachPatternMatched(this._onObjectMatched, this);
        },
        _readData: function () {

            this.getView().byId("idFilPlant3").setValue('');
            this.getView().byId("idFilASN3").setValue('');
            this.getView().byId("idFilVen3").setValue('');
            this.getView().byId("searchField3").setValue('');

            // let sEmail = this._userModel.oData.email
            this._userModel = this.getOwnerComponent().getModel("userModel");
            // Define a filter for the OData request
            var sEmail = this._userModel.getProperty("/email");
            // let sEmail = "muthuramesh31@gmail.com"
            let aFilters = [
                new sap.ui.model.Filter("Email", sap.ui.model.FilterOperator.EQ, sEmail)
            ];

            var oModel = this.getOwnerComponent().getModel("asncrt");

            // oModel.refreshMetadata();
            // oModel.refresh(true); // force a data refresh
            this.getView().byId("idasn").setModel(oModel);
            var that = this;
            sap.ui.core.BusyIndicator.show(0);
            this.getOwnerComponent().setModel(oModel, "defaultModel");
            this.fetchASNPrint(sEmail);
            // Get data from the default entity set                        
            oModel.read("/ZET_ASN_CRTSet", {
                filters: aFilters,
                success: function (oData, response) {
                    debugger;
                    sap.ui.core.BusyIndicator.hide();
                    var oJsonModel = new sap.ui.model.json.JSONModel();
                    oJsonModel.setData(oData.results);
                    that.getView().setModel(oJsonModel, "asnrepModel");
                },
                error: function (oErr) {
                    debugger;
                    console.log(oErr);
                    sap.ui.core.BusyIndicator.hide();
                    MessageBox.error(JSON.parse(oErr.responseText).error.innererror.errordetails[0].message);
                }
            });

        },
        onRowSelect: function () {
            alert("Triggered");
        },
        onSearchVendor: function (oEvent) {
            this._applySearchFilter("Lifnr", oEvent.getParameter("query"));
        },
        _onObjectMatched: function (oEvent) {
            this._readData();
            // Detach the event handler to prevent further calls
            // this.oRouter.getRoute("asnprint").detachPatternMatched(this._onObjectMatched, this);
        },
        onSearchVendor: function (oEvent) {
            this._applySearchFilter("Lifnr", oEvent.getParameter("query"));
        },

        onSearchWerks: function (oEvent) {
            this._applySearchFilter("Werks", oEvent.getParameter("query"));
        },
        _applySearchFilter: function (sFieldName, sQuery) {
            var aFilters = [];
            if (sQuery && sQuery.length > 0) {
                var filter = new Filter(sFieldName, FilterOperator.Contains, sQuery);
                aFilters.push(filter);
            }

            // update list binding
            var oTable = this.byId("idDetail");
            var oBinding = oTable.getBinding("items");
            oBinding.filter(aFilters, "Application");
        },
        _selectedData: function (oEvent) {
            debugger;
            var listitem = oEvent.getParameter("listItem");
            var selectedRecords = listitem.getBindingContext("default");
            var vendor = selectedRecords.getProperty("Lifnr");
            var plant = selectedRecords.getProperty("Werks");
            var outputmat = selectedRecords.getProperty("Op_matnr");
            var inputmat = selectedRecords.getProperty("Ip_Matnr");
            var desc = selectedRecords.getProperty("Maktx");
            var uom = selectedRecords.getProperty("Meins");
            var balqty = selectedRecords.getProperty("Balqty");
            var bprme = selectedRecords.getProperty("bprme");
            var dano = selectedRecords.getProperty("Exnum");

            var dataobject = {};

            dataobject.vendor = vendor;
            dataobject.plant = plant;
            dataobject.outputmat = outputmat;
            dataobject.inputmat = inputmat;
            dataobject.desc = desc;
            dataobject.uom = uom;
            dataobject.balqty = balqty;
            dataobject.bprme = bprme;
            dataobject.dano = dano;

            // MessageBox.success("Selected Record" + " " + vendor + " " );

            var asnmodelobject = new sap.ui.model.json.JSONModel();

            asnmodelobject.setData(dataobject);

            this.getOwnerComponent().setModel(asnmodelobject, "ASNMODEL");


        },
        captureRecordEH: function (oEvent) {
            this._selectedData(oEvent);
            debugger;
            this.displayCrtAsnEH();

        },
        displayCrtAsnEH: function () {
            this.oRouter.navTo("subconASNcr");
        },

        onPreviewPDF: function (oEvent) {
            // Get the selected item
            debugger;
            var oSelectedItem = oEvent.getSource();

            // Get the binding context of the selected item
            var oContext = oSelectedItem.getBindingContext("asnrepModel");

            // Get the data from the context
            var oData = oContext.getObject();
            //access pdf data using odata service
            var oView1 = this.getView();
            // var oModel1 = oView1.getModel();
            var oModel1 = this.getOwnerComponent().getModel("asncrt");
            var opdfViewer = new PDFViewer();
            this.getView().addDependent(opdfViewer);
            var sServiceURL = oModel1.sServiceUrl;
            var sSourceR = "/zasnpdfSet(Asnno='" + oData.Asnno + "')/$value";
            var sSource = sServiceURL + "/zasnpdfSet(Asnno='" + oData.Asnno + "')/$value";
            // var sSource = sServiceURL + "/zasnpdfSet(Asnno='0002170290')/$value";

            //********DO NOT TOUCH - IMPORTANT****************** */

            opdfViewer.setSource(sSource);
            opdfViewer.setTitle("DA PDF");
            opdfViewer.open();

            //********DO NOT TOUCH - IMPORTANT****************** */


        },
        onASN: function (oEvent) {
            // Get the search query
            debugger;
            var sQuery = oEvent.getParameter("newValue");
            var oTable = this.byId("idasn");
            var oBinding = oTable.getBinding("items");
            var aFilters = [];

            if (sQuery && sQuery.length > 0) {
                // Create filters for each field you want to search on
                var oFilter1 = new Filter("Asnno", FilterOperator.Contains, sQuery);

                // Combine filters with OR
                aFilters.push(new Filter({
                    filters: [oFilter1],
                    and: false
                }));
            }

            // Apply the filter to the binding
            oBinding.filter(aFilters);
        },
        onPlant: function (oEvent) {
            // Get the search query
            debugger;
            var sQuery = oEvent.getParameter("newValue");
            var oTable = this.byId("idasn");
            var oBinding = oTable.getBinding("items");
            var aFilters = [];

            if (sQuery && sQuery.length > 0) {
                // Create filters for each field you want to search on
                var oFilter1 = new Filter("Werks", FilterOperator.Contains, sQuery);

                // Combine filters with OR
                aFilters.push(new Filter({
                    filters: [oFilter1],
                    and: false
                }));
            }

            // Apply the filter to the binding
            oBinding.filter(aFilters);

        },
        onInv: function (oEvent) {
            // Get the search query
            debugger;
            var sQuery = oEvent.getParameter("newValue");
            var oTable = this.byId("idasn");
            var oBinding = oTable.getBinding("items");
            var aFilters = [];

            if (sQuery && sQuery.length > 0) {
                // Create filters for each field you want to search on
                var oFilter1 = new Filter("Ebeln", FilterOperator.Contains, sQuery);

                // Combine filters with OR
                aFilters.push(new Filter({
                    filters: [oFilter1],
                    and: false
                }));
            }

            // Apply the filter to the binding
            oBinding.filter(aFilters);

        },
        onVendor: function (oEvent) {
            // Get the search query
            debugger;
            var sQuery = oEvent.getParameter("newValue");
            var oTable = this.byId("idasn");
            var oBinding = oTable.getBinding("items");
            var aFilters = [];

            if (sQuery && sQuery.length > 0) {
                // Create filters for each field you want to search on
                var oFilter1 = new Filter("Lifnr", FilterOperator.Contains, sQuery);

                // Combine filters with OR
                aFilters.push(new Filter({
                    filters: [oFilter1],
                    and: false
                }));
            }

            // Apply the filter to the binding
            oBinding.filter(aFilters);

        },
        fetchASNPrint: async function (email) {
            debugger;
             const that = this; // Preserve the reference to the controller
 
             sap.ui.core.BusyIndicator.show();
             try {
                 // Make a request to your custom Node.js backend to get the CSRF token and DA list
                 const response = await $.ajax({
                     url: "/nodeapp/asndelete",     // Your custom backend route
                     method: "GET",              // Use GET since you're retrieving data         
                     contentType: "application/json",
                     data: { email: email }   // Send the email as a query parameter
                 });
                 // Success handling
                 sap.ui.core.BusyIndicator.hide();  // Hide the busy indicator on success
                 
                 // Process the response to get the tokens and DA list                
                 const asndeletedata = response;        // Extract DA list data
                 debugger;                 
                 const oJsonModel = new sap.ui.model.json.JSONModel(asndeletedata);
                 that.getView().setModel(oJsonModel, "asnrepModel");                
 
             } catch (oErr) {
                 sap.ui.core.BusyIndicator.hide();
                 console.error("Error fetching ASN Status Records:", oErr);
                 // If the error response contains a message, display it in the MessageBox
                 const errorMessage = oErr.responseJSON?.error?.innererror?.errordetails?.[0]?.message || "Unknown error occurred";
 
                 // Show error message
                //  MessageBox.error(errorMessage);
             }
         }        



    });
});