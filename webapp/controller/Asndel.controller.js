//Daniel View
sap.ui.define([
    'zmmsubcontract/controller/BaseController',
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox"

], function (BaseController, Controller, Filter, FilterOperator, MessageBox) {
    "use strict";
    return Controller.extend("zmmsubcontract.controller.Asndel", {
        formatDateToISO: function (dateStr) {
            var date = new Date(dateStr);
            var year = date.getFullYear();
            var month = String(date.getMonth() + 1).padStart(2, '0');
            var day = String(date.getDate()).padStart(2, '0');
            var hours = String(date.getHours()).padStart(2, '0');
            var minutes = String(date.getMinutes()).padStart(2, '0');
            var seconds = String(date.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
        },

        onInit: function () {
            debugger;
            this._localModel = this.getOwnerComponent().getModel("poservice");
            // this._readData();
            this.oRouter = this.getOwnerComponent().getRouter();
            this.oRouter.getRoute("SupASNDel").attachPatternMatched(this._onRouteMatched, this);
            
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

        _readData: function () {
            debugger;
            this.getView().byId("_IDGenSearchField2").setValue('');
            this.getView().byId("_IDGenSearchField1").setValue('');
            this.getView().byId("_IDGenSearchField3").setValue('');

            var oModel = this.getOwnerComponent().getModel("poservice");
            oModel.refreshMetadata();
            oModel.refresh(true); // force a data refresh
            this.getView().byId("asndelTable").setModel(oModel);
            var that = this;
            sap.ui.core.BusyIndicator.show(0);
            this.getOwnerComponent().setModel(oModel, "poservice");

            this._userModel = this.getOwnerComponent().getModel("userModel");
            let sEmail = this._userModel.oData.email
            // var sEmail = 'muthuramesh31@gmail.com';
            let aFilters = [
                new sap.ui.model.Filter("Email", sap.ui.model.FilterOperator.EQ, sEmail)
            ];
            this.fetchSupASNDel(sEmail);
            // oModel.read("/YMM_SUPPLIER_PO_ASN_DELSet", {
            //     filters: aFilters,
            //     success: function (oData, response) {
            //         debugger;
            //         sap.ui.core.BusyIndicator.hide();
            //         var oJsonModel = new sap.ui.model.json.JSONModel();
            //         oJsonModel.setData(oData.results);
            //         that.getView().setModel(oJsonModel, "asnDel");
            //     },
            //     error: function (oErr) {
            //         debugger;
            //         console.log(oErr);
            //         MessageBox.error(JSON.parse(oErr.responseText).error.innererror.errordetails[0].message);
            //     }
            // });
        },

        onBeforeRendering: function () {
            if (this.oRouter) {
                // Detach PatternMatched before re-rendering
                this.oRouter.getRoute("SupASNDel").detachPatternMatched(this._onObjectMatched, this);
            }
        },

        onAfterRendering: function () {
            if (this.oRouter) {
            // Re-attach PatternMatched after rendering
            this.oRouter.getRoute("SupASNDel").attachPatternMatched(this._onObjectMatched, this);
            }
        },

        _onRouteMatched: function (oEvent) {
            // Perform the refresh logic here        
            this._readData();

        },

        onAsnno: function (oEvent) {
            debugger;
            this._applyFilters();
        },

        onWerks: function (oEvent) {
            debugger;
            this._applyFilters();
        },

        onDcno: function (oEvent) {
            debugger;
            this._applyFilters();
        },

        _applyFilters: function () {
            var aFilters = [];

            // Get values from the search fields
            var sAsnno = this.byId("_IDGenSearchField2").getValue();
            var sWerks = this.byId("_IDGenSearchField1").getValue();
            var sDcno = this.byId("_IDGenSearchField3").getValue();
            // var sMaktx = this.byId("_IDGenSearchField4").getValue();

            // Create filters only if the search field is not empty
            if (sAsnno) {
                aFilters.push(new Filter("Asnno", FilterOperator.Contains, sAsnno));
            }

            if (sWerks) {
                aFilters.push(new Filter("Werks", FilterOperator.Contains, sWerks));
            }

            if (sDcno) {
                aFilters.push(new Filter("Dcno", FilterOperator.Contains, sDcno));
            }

            // Combine filters with AND condition
            var oCombinedFilter = new Filter({
                filters: aFilters,
                and: true
            });

            // Apply the filters to the table binding
            var oTable = this.byId("asndelTable"); // Ensure this ID matches the ID of your table
            var oBinding = oTable.getBinding("items");

            if (oBinding) {
                oBinding.filter(oCombinedFilter);
            }
        },

        onToggleButtonPress: function (oEvent) {
            debugger;
            var oToggleButton = oEvent.getSource();
            var bPressed = oToggleButton.getPressed();

            // Get reference to the table
            var oTable = this.byId("asndelTable");

            // Get selected items
            var aSelectedItems = oTable.getSelectedItems();

            // Check if any items are selected
            if (aSelectedItems.length === 0) {
                MessageBox.error("Please select at least one item to delete.");
                return;
            }

            // if (bPressed) {
                var oDataModel = this.getView().getModel("poservice"); // Get the OData model from the view

                // Map selected items to the format required for deletion
                var aDeleteItems = aSelectedItems.map(function (oItem) {
                    var oContext = oItem.getBindingContext("asnDel"); // Get the binding context
                    var oData = oContext.getObject(); // Get the actual data object

                    return {
                        Asnno: oData.Asnno || "",
                        Lifnr: oData.Lifnr || "",
                        Werks: oData.Werks || "",
                        Dcno: oData.Dcno || "",
                        Dcdate: this.formatDateToISO(oData.Dcdate) || "",
                        Menge: oData.Menge || "",
                        Zpack: oData.Zpack || "",
                        Asnweight: oData.Asnweight || "",
                        Lrdate: oData.Lrdate || "",
                        Lrnumber: oData.Lrnumber || "",
                        Vechileno: oData.Vechileno || "",
                        Grstatus: oData.Grstatus || "",
                        Dmrrstatus: oData.Dmrrstatus || "",
                        Asnstatus: oData.Asnstatus || ""
                    };
                }, this); // Bind 'this' context for formatDateToISO function

                // Perform deletion for each selected item
                aDeleteItems.forEach((oDeleteItem) => {
                    debugger;
                    var sPath = "/YMM_SUPPLIER_PO_ASN_DELSet" + "(Asnno='" + oDeleteItem.Asnno + "')";
                    oDataModel.remove(sPath, {
                        method: "DELETE",
                        success: (response) => {
                            debugger;
                            this._localModel = this.getOwnerComponent().getModel("poservice");
                            this._readData();
                            MessageBox.success("Item deleted successfully.");
                        },
                        error: (oError) => {
                            MessageBox.error("Error deleting item.");
                            console.error(oError);
                        }
                    });
                });
            // } else {
            // }
        }, 

        fetchSupASNDel: async function (email) {
            debugger;
             const that = this; // Preserve the reference to the controller
 
             sap.ui.core.BusyIndicator.show();
             try {
                 // Make a request to your custom Node.js backend to get the CSRF token and DA list
                 const response = await $.ajax({
                     url: "/nodeapp/SupASNDel",     // Your custom backend route
                     method: "GET",              // Use GET since you're retrieving data         
                     contentType: "application/json",
                     data: { email: email }   // Send the email as a query parameter
                 });
                 // Success handling
                 sap.ui.core.BusyIndicator.hide();  // Hide the busy indicator on success
                 
                 // Process the response to get the tokens and DA list                
                 const AsnDelData = response;        // Extract DA list data
                 debugger;
                 // Handle the DA list (e.g., bind to a model or display in a view)
                 const oJsonModel = new sap.ui.model.json.JSONModel(AsnDelData);
                 that.getView().setModel(oJsonModel, "asnDel");                 
 
             } catch (oErr) {
                 sap.ui.core.BusyIndicator.hide();
                 console.error("Error fetching ASN Report Data:", oErr);
                 // If the error response contains a message, display it in the MessageBox
                 const errorMessage = oErr.responseJSON?.error?.innererror?.errordetails?.[0]?.message || "Unknown error occurred";
 
                 // Show error message
                //  MessageBox.error(errorMessage);
             }
         }                                    
    });
});