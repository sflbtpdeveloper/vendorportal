sap.ui.define([
    'zmmsubcontract/controller/BaseController',
    "sap/ui/core/mvc/Controller",
    "sap/m/PDFViewer",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"

], function (BaseController, Controller, PDFViewer, Filter, FilterOperator) {
    "use strict";

    return BaseController.extend("zmmsubcontract.controller.List", {
        onInit: function () {
            debugger;
            BaseController.prototype.onInit.apply(this);
            this._localModel = this.getOwnerComponent().getModel("poservice");
            // this._readData();
            this.oRouter.getRoute("PoSchedule").attachPatternMatched(this._onObjectMatched, this);
            this.oRouter = this.getOwnerComponent().getRouter();

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
                            
        },

        _onObjectMatched: function (oEvent) {
            // Perform the refresh logic here
            this._refreshView();
        },

        _refreshView: function () {

            // var oTable = this.byId("idRegASN");
            // debugger;
            // oTable.removeSelections(true);
            // oTable.unbindItems();     
            this._readData();

        },

        _readData: function () {    
            this.getView().byId("searchFieldWerks").setValue('');
            this.getView().byId("searchFieldEbeln").setValue('');
            this.getView().byId("searchFieldMatnr").setValue('');
            this.getView().byId("searchFieldMaktx").setValue('');

            // let sEmail = this._userModel.oData.email
            this._userModel = this.getOwnerComponent().getModel("userModel");
            // Define a filter for the OData request
            var sEmail = this._userModel.getProperty("/email");
            // var sEmail = 'muthuramesh31@gmail.com';
            let aFilters = [
                new sap.ui.model.Filter("Email", sap.ui.model.FilterOperator.EQ, sEmail)
            ];

            var oModel = this.getOwnerComponent().getModel("poservice");
            oModel.refreshMetadata();
            oModel.refresh(true); // force a data refresh
            this.getView().byId("myCustomTable").setModel(oModel);
            var that = this;
            sap.ui.core.BusyIndicator.show(0);
            this.getOwnerComponent().setModel(oModel, "poservice");
            this.fetchSupplierPO(sEmail);
            // oModel.read("/YMM_SUPPLIER_PO_ITEMSSet", {
            //     filters: aFilters,
            //     success: function (oData, response) {
            //         debugger;
            //         sap.ui.core.BusyIndicator.hide();
            //         var oJsonModel = new sap.ui.model.json.JSONModel();
            //         oJsonModel.setData(oData.results);
            //         that.getView().setModel(oJsonModel, "listModel");
            //     },
            //     error: function (oErr) {
            //         debugger;
            //         console.log(oErr);
            //         MessageBox.error(JSON.parse(oErr.responseText).error.innererror.errordetails[0].message);
            //     }
            // });
        },

        onEbeln: function (oEvent) {
            debugger;
            this._applyFilters();
        },

        onWerks: function (oEvent) {
            debugger;
            this._applyFilters();
        },

        onMatnr: function (oEvent) {
            debugger;
            this._applyFilters();
        },

        onMaktx: function (oEvent) {
            debugger;
            this._applyFilters();
        },

        _applyFilters: function () {
            var aFilters = [];
            // Get values from the search fields
            var sWerks = this.byId("searchFieldWerks").getValue();
            var sEbeln = this.byId("searchFieldEbeln").getValue();
            var sMatnr = this.byId("searchFieldMatnr").getValue();
            var sMaktx = this.byId("searchFieldMaktx").getValue();

            if (sWerks) {
                aFilters.push(new Filter("Werks", FilterOperator.Contains, sWerks));
            }
            if (sEbeln) {
                aFilters.push(new Filter("Ebeln", FilterOperator.Contains, sEbeln));
            }
            if (sMatnr) {
                aFilters.push(new Filter("Matnr", FilterOperator.Contains, sMatnr));
            }
            if (sMaktx) {
                aFilters.push(new Filter("Maktx", FilterOperator.Contains, sMaktx));
            }

            var oTable = this.byId("myCustomTable");
            var oBinding = oTable.getBinding("items");

            if (oBinding) {
                if (aFilters.length > 0) {
                    // Ensure filters is an array
                    if (!Array.isArray(aFilters)) {
                        console.error("Filters is not an array:", aFilters);
                        return; // Exit early if filters is not valid
                    }
                    var oCombinedFilter = new Filter({
                        filters: aFilters,
                        and: true
                    });
                    oBinding.filter(oCombinedFilter);
                } else {
                    oBinding.filter([]); // Clear filters
                }
            }
        },

        onButtonPress: function (oEvent) {
            var oButton = oEvent.getSource();
            var oItem = oButton.getParent(); // Get the parent ColumnListItem
            var oContext = oItem.getBindingContext("listModel");
            var data = oContext.getObject();

            // Ensure unique ID for PDFViewer
            var uniqueViewerId = "pdfViewer-" + new Date().getTime();
            var opdfViewer = new sap.m.PDFViewer({
                id: uniqueViewerId
            });
            this.getView().addDependent(opdfViewer);
            var oView1 = this.getView();
            var oModel1 = oView1.getModel();
            var sServiceURL = this.getView().getModel('pdf').sServiceUrl;
            var sSource = sServiceURL + "/get_pdfSet('" + data.Ebeln + "')/$value";
            var sPath = "/get_pdfSet('" + data.Ebeln + "')/$value";
            // opdfViewer.setSource(sSource);
            // opdfViewer.setTitle("My PDF");
            // opdfViewer.open();    

            
            oModel1.read(sPath, {
                success: function (oResponse) {
                    // Construct the PDF source URL
                    var sSource = oModel1.sServiceUrl + sPath;
        
                    // Configure and open the PDF Viewer
                    opdfViewer.setSource(sSource);
                    opdfViewer.setTitle("My PDF");
                    opdfViewer.open();
                },
                error: function (oError) {
                    // Parse and display the error message
                    var sErrorMessage = "Preview not available for this PO !!!";
                    // if (oError && oError.responseText) {
                    //     try {
                    //         var oErrorResponse = JSON.parse(oError.responseText);
                    //         if (oErrorResponse.error && oErrorResponse.error.message) {
                    //             sErrorMessage = oErrorResponse.error.message.value || sErrorMessage;
                    //         }
                    //     } catch (e) {
                    //         // Ignore JSON parsing errors
                    //     }
                    // }
        
                    // Display the error message using a MessageToast or MessageBox
                    sap.m.MessageBox.error(sErrorMessage);
                }
            });


        },
        fetchSupplierPO: async function (email) {
            debugger;
             const that = this; // Preserve the reference to the controller
 
             sap.ui.core.BusyIndicator.show();
             try {
                 // Make a request to your custom Node.js backend to get the CSRF token and DA list
                 const response = await $.ajax({
                     url: "/nodeapp/supplierPO",     // Your custom backend route
                     method: "GET",              // Use GET since you're retrieving data         
                     contentType: "application/json",
                     data: { email: email }   // Send the email as a query parameter
                 });
                 // Success handling
                 sap.ui.core.BusyIndicator.hide();  // Hide the busy indicator on success
                 
                 // Process the response to get the tokens and DA list                
                 const supplierPOData = response;        // Extract DA list data
                 debugger;
                 // Handle the DA list (e.g., bind to a model or display in a view)
                 const oJsonModel = new sap.ui.model.json.JSONModel(supplierPOData);
                 that.getView().setModel(oJsonModel, "listModel");                 
 
             } catch (oErr) {
                 sap.ui.core.BusyIndicator.hide();
                 console.error("Error fetching DA List:", oErr);
                 // If the error response contains a message, display it in the MessageBox
                 const errorMessage = oErr.responseJSON?.error?.innererror?.errordetails?.[0]?.message || "Unknown error occurred";
 
                 // Show error message
                //  MessageBox.error(errorMessage);
             }
         }
 
    });
});
