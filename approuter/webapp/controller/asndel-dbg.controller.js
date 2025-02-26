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
    return BaseController.extend("zmmsubcontract.controller.asndel", {

        _data: {
            dtValue: UI5Date.getInstance(),
            dtPattern: undefined
        },
        onInit: function () {
            BaseController.prototype.onInit.apply(this);
            this._localModel = this.getOwnerComponent().getModel("local");
            this.oRouter = this.getOwnerComponent().getRouter();
            // this.oRouter.attachRoutePatternMatched(this._onObjectMatched,this);            
            this.oRouter.getRoute("asndel").attachPatternMatched(this._onObjectMatched, this);

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

            // this._userModel = this.getOwnerComponent().getModel("userModel");
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
            // Load fresh data on page refresh as well
            //    this._readData(); // Fetch fresh data onInit (useful for page refresh)

            //******************s************************************** */

            this.oRouter = this.getOwnerComponent().getRouter();
        },
        onBeforeRendering: function () {
            if (this.oRouter) {
                // Detach PatternMatched before re-rendering
                this.oRouter.getRoute("asndel").detachPatternMatched(this._onObjectMatched, this);
            }
        },

        onAfterRendering: function () {
            if (this.oRouter) {
                // Re-attach PatternMatched after rendering
                this.oRouter.getRoute("asndel").attachPatternMatched(this._onObjectMatched, this);
            }
        },
        _readData: function () {

            this.getView().byId("idFilPlant2").setValue('');
            this.getView().byId("idFilASN2").setValue('');
            this.getView().byId("idFilVen2").setValue('');
            this.getView().byId("searchField2").setValue('');

            var oModel = this.getOwnerComponent().getModel("asncrt");
            this.getView().byId("idasnDel").setModel(oModel);
            var that = this;
            sap.ui.core.BusyIndicator.show(0);
            this.getOwnerComponent().setModel(oModel, "defaultModel");
            // Retrieve the email ID from the "local" model
            // Get the email ID from the user model
            this._userModel = this.getOwnerComponent().getModel("userModel");
            let sEmail = this._userModel.oData.email
            // let sEmail = "muthuramesh31@gmail.com"

            // let aFilters = [
            //     new sap.ui.model.Filter("Email", sap.ui.model.FilterOperator.EQ, sEmail)
            // ];
            this.fetchASNdel(sEmail);

            // oModel.read("/ZET_ASN_CRTSet", {
            //     filters: aFilters,
            //     success: function (oData, response) {
            //         debugger;
            //         sap.ui.core.BusyIndicator.hide();
            //         var oJsonModel = new sap.ui.model.json.JSONModel();
            //         oJsonModel.setData(oData.results);
            //         that.getView().setModel(oJsonModel, "asnrepModel");
            //     },
            //     error: function (oErr) {
            //         debugger;
            //         console.log(oErr);
            //         sap.ui.core.BusyIndicator.hide();
            //         MessageBox.error(JSON.parse(oErr.responseText).error.innererror.errordetails[0].message);
            //     }
            // });
        },
        onRowSelect: function () {
            alert("Triggered");
        },
        onVendor: function (oEvent) {
            this._applySearchFilter("Lifnr", oEvent.getParameter("query"));
        },
        _onObjectMatched: function (oEvent) {
            // Perform the refresh logic here        
            this._readData();
            // Detach the event handler to prevent further calls
            // this.oRouter.getRoute("asndel").detachPatternMatched(this._onObjectMatched, this);            

        },
        onASN: function (oEvent) {
            this._applySearchFilter("Asnno", oEvent.getParameter("query"));
        },

        onPlant: function (oEvent) {
            this._applySearchFilter("Werks", oEvent.getParameter("query"));
        },
        onInv: function (oEvent) {
            this._applySearchFilter("Ebeln", oEvent.getParameter("query"));
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
        formatDate: function (sValue) {
            if (sValue) {
                var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({ pattern: "dd-MM-yyyy" });
                return oDateFormat.format(new Date(sValue));
            }
            return sValue;
        },
        _selectedData: function (oEvent) {

            var oView = this.getView();
            var oTable = oView.byId("idasnDel");
            var aSelectedItems = oTable.getSelectedItems();
            var aSelectedData = [];

            if (aSelectedItems.length === 0) {
                debugger;
                MessageBox.error("Please Enter at least one Record");
                return; // No items selected
            }

            var aSelectedContexts = aSelectedItems.map(function (item) {
                return item.getBindingContext("asnrepModel");
            });

            // Extract the keys for the selected records
            var aSelectedKeys = aSelectedContexts.map(function (context) {
                return context.getProperty("Asnno");
            });
            aSelectedData.push(aSelectedKeys);
            this._deleteRecords(aSelectedData, aSelectedKeys, aSelectedContexts, aSelectedItems);

        },

        _deleteRecords: function (aKeys, aSKeys, aSCont, aSItems) {
            debugger;
            var oModel = this.getOwnerComponent().getModel("asncrt");
            var oView = this.getView();
            var oTable = oView.byId("idasnDel");
            var that = this;
            // Show a busy indicator
            sap.ui.core.BusyIndicator.show(0);
            // oModel.setUseBatch(true);

            oModel.setUseBatch(true);
            // Define a batch group ID
            var sBatchGroupId = "deleteBatchGroup";

            // Set the group as deferred so that all operations are collected until submitChanges is called
            oModel.setDeferredGroups([sBatchGroupId]);

            // Iterate over selected items and add delete operations to the batch
            debugger;
            var aPromises = aSKeys.map(function (oItem) {
                return new Promise(function (resolve, reject) {
                    var sPath = "/ZET_ASN_CRTSet('" + oItem + "')";
                    oModel.remove(sPath, {
                        groupId: sBatchGroupId,
                        success: function () {
                            debugger;
                            resolve();
                        },
                        error: function (oError) {
                            debugger;
                            // const headers = oError.response.headers;
                            // const errorMessage = headers["error_message"];
                            // const httpStatus = headers["http_status"];
                            sap.m.MessageBox.error(errorMessage || "An unexpected error occurred.");
                            reject(oError);
                        }

                    });
                });
            });


            // Submit the batch requests
            oModel.submitChanges({
                groupId: sBatchGroupId,
                success: function (oData) {
                    // var bErrorFound = false;
                    // if (oData.__batchResponses && oData.__batchResponses.length > 0) {
                    //     oData.__batchResponses.forEach(function (oBatchResponse) {
                    //         if (oBatchResponse.__changeResponses) {
                    //             oBatchResponse.__changeResponses.forEach(function (oChangeResponse) {
                    //                 if (oChangeResponse.headers) {
                    //                     const errorMessage = oChangeResponse.headers["error_message"];
                    //                     const httpStatus = oChangeResponse.headers["http_status"];
                    //                     if (httpStatus === "400") { // Handle specific error codes
                    //                         bErrorFound = true;
                    //                         sap.m.MessageBox.error(errorMessage || "Error deleting record.");
                    //                     }
                    //                 }
                    //             });
                    //         }
                    //     });
                    // }
            
                    Promise.all(aPromises)
                        .then(function () {
                            debugger;
                            // if (!bErrorFound) {
                            that._readData();
                            sap.m.MessageBox.success("Records deleted successfully.");
                            // }
                        })
                        .catch(function () {
                            debugger;
                            sap.m.MessageBox.error("Error deleting records.");
                        })
                        .finally(function () {
                            sap.ui.core.BusyIndicator.hide();
                        });

                },
                error: function (oError) {                    
                    sap.m.MessageBox.error("Batch request failed.");
                    sap.ui.core.BusyIndicator.hide();
                }
            });

        },
        onDeleteASN: function (oEvent) {
            this._selectedData(oEvent);
        },

        onASN: function (oEvent) {
            // Get the search query
            debugger;
            var sQuery = oEvent.getParameter("newValue");
            var oTable = this.byId("idasnDel");
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
            var oTable = this.byId("idasnDel");
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
            var oTable = this.byId("idasnDel");
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
            var oTable = this.byId("idasnDel");
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
        fetchASNdel: async function (email) {   
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
