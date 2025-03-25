sap.ui.define([
    'zmmsubcontract/controller/BaseController',
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox"

], function (BaseController, Controller, Filter, FilterOperator, MessageBox) {
    "use strict";
    return BaseController.extend("zmmsubcontract.controller.Detail", {
        onInit: function () {
            BaseController.prototype.onInit.apply(this);
            debugger;
            this._localModel = this.getOwnerComponent().getModel("poservice");

            this.oRouter = this.getOwnerComponent().getRouter();
            this.oRouter.getRoute("SupAsnCrt").attachPatternMatched(this._onObjectMatched, this);

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
            var oTable = this.getView().byId("detailTab");
            if (oTable) {
                oTable.attachUpdateFinished(() => {
                    console.log("Table updated, applying highlighting again...");
                    this._applyHighlighting();
                });
            }
        },

        onBeforeRendering: function () {
            if (this.oRouter) {
                // Detach PatternMatched before re-rendering
                this.oRouter.getRoute("SupAsnCrt").detachPatternMatched(this._onObjectMatched, this);
            }
        },

        onAfterRendering: function () {
            // Re-attach PatternMatched after rendering
            this.oRouter.getRoute("SupAsnCrt").attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched: function (oEvent) {
            this._readData(); // Call a function to load the data
        },

        _readData: function () {
            this.byId("searchFieldWerks").setValue("");
            this.byId("searchFieldEbeln").setValue("");
            this.byId("searchFieldMatnr").setValue("");
            this.byId("searchFieldMaktx").setValue("");

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
            this.getView().byId("detailTab").setModel(oModel);
            var that = this;
            sap.ui.core.BusyIndicator.show(0);
            this.getOwnerComponent().setModel(oModel, "poservice");
            this.fetchDetail(sEmail);
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

            var oTable = this.byId("detailTab");
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

        onToggleButtonPress: function (oEvent) {
            debugger;

            // Get a reference to the table
            var oTable = this.byId("detailTab");

            // Get selected items
            var aSelectedItems = oTable.getSelectedItems();

            // Check if aSelectedItems is empty
            if (aSelectedItems.length === 0) {
                // Display an error message
                MessageBox.error('No items selected. Please select at least one item.');
                return;
            } else {
                // Step 3: Prepare data to pass
                var aSelectedData = aSelectedItems.map(function (oItem) {
                    return oItem.getBindingContext("detailModel").getObject(); // Modify as needed to get relevant properties
                });

                //29112024
                // Extract PO and PO Line Item values from the first item
                var oFirstContext = aSelectedItems[0].getBindingContext("detailModel");
                var sFirstPO = oFirstContext.getProperty("Ebeln"); // Replace "PO" with your actual property name
                var sFirstPOLineItem = oFirstContext.getProperty("Ebelp"); // Replace "POLineItem" with your actual property name            
                // var sFirstMaterial = oFirstContext.getProperty("Matnr");

                var bAllSame = aSelectedItems.every(function (oItem) {
                    var oContext = oItem.getBindingContext("detailModel");
                    if (oContext) {
                        var sPO = oContext.getProperty("Ebeln");
                        var sPOLineItem = oContext.getProperty("Ebelp");
                        return sPO === sFirstPO;
                    }
                    return false;
                });

                if (!bAllSame) {
                    // Trigger error message if PO or PO Line Item values differ
                    MessageBox.error("Please select records with the same PO Number.");
                    return;
                }

                // var matbAllSame = aSelectedItems.every(function (oItem) {
                //     var oContext = oItem.getBindingContext("detailModel");
                //     if (oContext) {
                //         var sMAT = oContext.getProperty("Matnr");
                //         // var sPOLineItem = oContext.getProperty("Ebelp");
                //         return sMAT === sFirstMaterial;
                //     }
                //     return false;
                // });

                // if (!matbAllSame) {
                //     // Trigger error message if PO or PO Line Item values differ
                //     MessageBox.error("Please select records with the same Material Number.");
                //     return;
                // }
                //29112024

                debugger;

                // Create a JSON model to hold the fetched data
                var oLineItemsModel = new sap.ui.model.json.JSONModel();
                oLineItemsModel.setData(aSelectedData);

                localStorage.removeItem("asnItemsData");
                localStorage.removeItem("lineItemsData");

                // Save the data to local storage
                localStorage.setItem("asnItemsData", JSON.stringify(aSelectedData));

                // Set the JSON model to the component
                this.getOwnerComponent().setModel(oLineItemsModel, "asnItems");

                // Navigate to the target view
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("Asn", {}, false);
            }
        },

        fetchDetail: async function (email) {
            debugger;
            const that = this; // Preserve the reference to the controller

            sap.ui.core.BusyIndicator.show();
            try {
                // Make a request to your custom Node.js backend to get the CSRF token and DA list
                const response = await $.ajax({
                    url: "/nodeapp/supplierPODetail",     // Your custom backend route
                    method: "GET",              // Use GET since you're retrieving data         
                    contentType: "application/json",
                    data: { email: email }   // Send the email as a query parameter
                });
                // Success handling
                sap.ui.core.BusyIndicator.hide();  // Hide the busy indicator on success

                // Process the response to get the tokens and DA list                
                const supplierPODetailData = response;        // Extract DA list data
                debugger;
                // Handle the DA list (e.g., bind to a model or display in a view)
                const oJsonModel = new sap.ui.model.json.JSONModel(supplierPODetailData);
                that.getView().setModel(oJsonModel, "detailModel");

                // Ensure data is bound to the table
                that.getView().byId("detailTab").setModel(oJsonModel, "detailModel");

                setTimeout(() => {
                    that._applyHighlighting();
                }, 500);

            } catch (oErr) {
                sap.ui.core.BusyIndicator.hide();
                console.error("Error fetching DA List:", oErr);
                // If the error response contains a message, display it in the MessageBox
                const errorMessage = oErr.responseJSON?.error?.innererror?.errordetails?.[0]?.message || "Unknown error occurred";

                // Show error message
                // MessageBox.error(errorMessage);
            }
        },
        _applyHighlighting: function () {
            var oTable = this.getView().byId("detailTab"); // Get the table

            if (!oTable) {
                console.error("Table not found!");
                return;
            }

            var aItems = oTable.getItems(); // Get all rows (ColumnListItems)

            aItems.forEach((oItem, index) => {
                var oContext = oItem.getBindingContext("detailModel");

                if (!oContext) {
                    console.warn(`No binding context for row ${index}`);
                    return;
                }

                var sPopValue = oContext.getProperty("POP");
                console.log(`Row ${index} POP Value:`, sPopValue);

                // var aCells  = oItem.getCells()[3]; // Assuming VBox is the 3rd cell
                var oVBox = oItem.getCells()[11];

                if (oVBox) {
                    var aTextControls = oVBox.getItems(); // Get the Text controls inside the VBox

                    aTextControls.forEach((oText) => {
                        oText.removeStyleClass("boldtext");
                        oText.removeStyleClass("animated-bg pulse-text");

                        if (sPopValue && sPopValue.trim() !== "" ) {
                            // oText.removeStyleClass("boldtext"); // Remove previous style
                            oText.addStyleClass("animated-bg pulse-text"); // Apply highlight
                            console.log(`Row ${index} animated-bg pulse-text.`);
                        } else {
                            // oText.removeStyleClass("highlightText"); // Remove highlight if needed
                            oText.addStyleClass("boldtext"); // Apply default bold text
                            console.log(`Row ${index} set to bold.`);
                        }
                    });
                }

                // var oVBox1 = oItem.getCells()[4];

                // if (oVBox1) {
                //     var aTextControls1 = oVBox1.getItems(); // Get the Text controls inside the VBox

                //     aTextControls1.forEach((oText1) => {
                //         oText1.removeStyleClass("boldtext");
                //         oText1.removeStyleClass("highlightText");

                //         if (sPopValue && sPopValue.trim() === "X") {
                //             // oText.removeStyleClass("boldtext"); // Remove previous style
                //             oText1.addStyleClass("highlightText"); // Apply highlight
                //             console.log(`Row ${index} highlighted.`);
                //         } else {
                //             // oText.removeStyleClass("highlightText"); // Remove highlight if needed
                //             oText1.addStyleClass("boldtext"); // Apply default bold text
                //             console.log(`Row ${index} set to bold.`);
                //         }
                //     });
                // }
            });
        }
    });
});
