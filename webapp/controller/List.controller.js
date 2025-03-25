sap.ui.define([
    'zmmsubcontract/controller/BaseController',
    "sap/ui/core/mvc/Controller",
    "sap/m/PDFViewer",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel"

], function (BaseController, Controller, PDFViewer, Filter, FilterOperator, MessageBox, JSONModel) {
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
            this._loadUserInfo();

            var oTable = this.getView().byId("myCustomTable");
            if (oTable) {
                oTable.attachUpdateFinished(() => {
                    console.log("Table updated, applying highlighting again...");
                    this._applyHighlighting();
                });
            }
        },

        _applyHighlighting: function () {
            var oTable = this.getView().byId("myCustomTable"); // Get the table

            if (!oTable) {
                console.error("Table not found!");
                return;
            }

            var aItems = oTable.getItems(); // Get all rows (ColumnListItems)

            aItems.forEach((oItem, index) => {
                var oContext = oItem.getBindingContext("listModel");

                if (!oContext) {
                    console.warn(`No binding context for row ${index}`);
                    return;
                }

                var sPopValue = oContext.getProperty("POP");
                console.log(`Row ${index} POP Value:`, sPopValue);

                var oVBox = oItem.getCells()[10]; // Assuming VBox is the 3rd cell

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
            });
        },

        _loadUserInfo: function () {
            var oModel = this.getView().getModel("userInfo");
            var sUrl = "/userapi/currentUser"; // or /user-api/attributes

            $.ajax({
                "url": sUrl,
                async: false,
                success: jQuery.proxy(function (user) {
                    var currentUser = {
                        fullName: user.lastName + ", " + user.firstName,
                        userId: user.name,
                    }

                    oModel.setData(currentUser);
                }),
                error: function (error) {
                    MessageToast.show("Error in load.", error);
                }
            });
        },

        _onObjectMatched: function (oEvent) {
            // Perform the refresh logic here
            this._refreshView();
        },

        _refreshView: function () {
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
            debugger;
            var oButton = oEvent.getSource();
            var oItem = oButton.getParent(); // Get the parent ColumnListItem
            var oContext = oItem.getBindingContext("listModel");
            var data = oContext.getObject();

            if (data.Pdfchk === 'X') {
                // Display an error message
                sap.m.MessageBox.error("Selected PO has No print Preview");
            } else {
                var uniqueViewerId = "pdfViewer-" + new Date().getTime();
                var opdfViewer = new sap.m.PDFViewer({
                    id: uniqueViewerId
                });

                this.getView().addDependent(opdfViewer);
                var oView1 = this.getView();
                var oModel1 = oView1.getModel();
                var sServiceURL = this.getView().getModel('pdf').sServiceUrl;
                var sSource = sServiceURL + "/get_pdfSet('" + data.Ebeln + "')/$value";

                // If the PDF exists, set the source and open the viewer
                opdfViewer.setSource(sSource);
                opdfViewer.setTitle("My PDF");
                opdfViewer.open();
            }
        },

        _fetchPDF: function (sSource, callback) {
            // Use a fetch request to check if the resource is available
            fetch(sSource, { method: 'HEAD' })
                .then(function (response) {
                    if (response.ok) {
                        // If response is successful, callback with true (PDF exists)
                        callback(true);
                    } else {
                        // If response fails, callback with false (PDF not found)
                        callback(false);
                    }
                })
                .catch(function (error) {
                    // In case of any error (network issues, etc.), callback with false
                    callback(false);
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

                // Ensure data is bound to the table
                that.getView().byId("myCustomTable").setModel(oJsonModel, "listModel");

                setTimeout(() => {
                    that._applyHighlighting();
                }, 500);

            } catch (oErr) {
                sap.ui.core.BusyIndicator.hide();
                console.error("Error fetching DA List:", oErr);
                // If the error response contains a message, display it in the MessageBox
                const errorMessage = oErr.responseJSON?.error?.innererror?.errordetails?.[0]?.message || "Unknown error occurred";
            }
        },
    });
});
