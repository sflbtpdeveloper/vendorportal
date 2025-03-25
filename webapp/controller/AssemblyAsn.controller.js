sap.ui.define([
    'zmmsubcontract/controller/BaseController',
    'sap/m/MessageBox',
    'sap/m/MessageToast',
    'sap/ui/model/json/JSONModel',
    'sap/ui/core/Fragment',
    "sap/ui/core/date/UI5Date",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/PDFViewer",
    "sap/ui/core/Popup",
    "sap/m/Popover",
], function (BaseController, MessageBox, MessageToast, JSONModel, Fragment, UI5Date, Filter, FilterOperator, PDFViewer, Popup, Popover) {
    'use strict';
    return BaseController.extend("zmmsubcontract.controller.AssemblyAsn", {

        _data: {
            dtValue: UI5Date.getInstance(),
            dtPattern: undefined
        },
        onInit: function () {
            BaseController.prototype.onInit.apply(this);
            this._vMenge = null;
            this._localModel = this.getOwnerComponent().getModel("local");
            debugger;
            // this.oRouter.attachRoutePatternMatched(this._onObjectMatched,this);
            this.oRouter.getRoute("AsseASN").attachPatternMatched(this._onObjectMatched, this);
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
            //*****SETTING DATA TO MODEL AND MAPPING THE TABLE********* */

            // this._readData();

            //******************************************************** */
            this.oRouter = this.getOwnerComponent().getRouter();
        },
        _readData: function () {

            this.getView().byId("idFilPlant1").setValue('');
            this.getView().byId("idFilDA1").setValue('');
            this.getView().byId("idFilVen1").setValue('');
            this.getView().byId("idMat1").setValue('');
            this.getView().byId("idPO1").setValue('');

            // Get the email ID from the user model
            this._userModel = this.getOwnerComponent().getModel("userModel");
            let sEmail = this._userModel.oData.email
            // let sEmail = "muthuramesh31@gmail.com";
            debugger;

            // Define a filter for the OData request

            let aFilters = [
                new sap.ui.model.Filter("Email", sap.ui.model.FilterOperator.EQ, sEmail)
            ];


            var oModel = this.getOwnerComponent().getModel();
            var sModel = this.getOwnerComponent().getModel("selectedRecords");
            if (!sModel) {
                sModel = new JSONModel([]);
                this.getOwnerComponent().setModel(sModel, "selectedRecords");
            }
            var cModel = this.getOwnerComponent().getModel("changedRecords");
            if (!cModel) {
                cModel = new JSONModel([]);
                this.getOwnerComponent().setModel(cModel, "changedRecords");
            }

            this.getView().byId("idasseASN").setModel(oModel);
            var that = this;
            sap.ui.core.BusyIndicator.show(0);
            this.getOwnerComponent().setModel(oModel, "defaultModel");

            this.fetchDAList(sEmail);

            // // Get data from the default entity set            
            // oModel.read("/zet_da_listSet", {
            //     filters: aFilters,
            //     success: function (oData, response) {
            //         debugger;
            //         sap.ui.core.BusyIndicator.hide();
            //         var oJsonModel = new sap.ui.model.json.JSONModel();
            //         oJsonModel.setData(oData.results);
            //         that.getView().setModel(oJsonModel, "default");
            //     },
            //     error: function (oErr) {
            //         debugger;
            //         console.log(oErr);
            //         MessageBox.error(JSON.parse(oErr.responseText).error.innererror.errordetails[0].message);
            //     }
            // });
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

        onSearchVendor: function (oEvent) {
            this._applySearchFilter("Lifnr", oEvent.getParameter("query"));
        },

        onSearchWerks: function (oEvent) {
            this._applySearchFilter("Werks", oEvent.getParameter("query"));
        },
        _applySearchFilter: function (sFieldName, sQuery) {
            var aFilters = [];
            debugger;
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

            var sModel = this.getOwnerComponent().getModel("selectedRecords");
            var oView = this.getView();
            var oTable = oView.byId("idasseASN");
            var aSelectedItems = oTable.getSelectedItems();
            var aSelectedData = [];

            if (aSelectedItems.length === 0) {
                debugger;
                MessageBox.error("Please Enter at least one Record");
                return; // No items selected
            }

            // Extract PO and PO Line Item values from the first item
            var oFirstContext = aSelectedItems[0].getBindingContext("default");
            var sFirstPO = oFirstContext.getProperty("Ebeln"); // Replace "PO" with your actual property name
            var sFirstPOLineItem = oFirstContext.getProperty("Ebelp"); // Replace "POLineItem" with your actual property name            

            //*********check the po and line item of the selected records************** */    
            debugger;
            aSelectedItems.forEach(function (oItem, index) {
                index = index + 1;
                if (index > 4) {
                    // Trigger error message if index is greater than 4
                    MessageBox.error("You have selected more than 4 items. Please select up to 4 items only.");
                    return; // Exit the loop early to prevent further processing
                }
            });

            var bAllSame = aSelectedItems.every(function (oItem) {
                var oContext = oItem.getBindingContext("default");
                if (oContext) {
                    var sPO = oContext.getProperty("Ebeln");
                    var sPOLineItem = oContext.getProperty("Ebelp");
                    return sPO === sFirstPO && sPOLineItem === sFirstPOLineItem;
                }
                return false;
            });

            if (!bAllSame) {
                // Trigger error message if PO or PO Line Item values differ
                MessageBox.error("Please select records with the same PO and PO Line Item.");
                return;
            }

            // aSelectedData.push(oItem.getBindingContext().getObject());

            //******************************************************************************** */  
            debugger;
            aSelectedItems.forEach(function (oItem) {
                var oContext = oItem.getBindingContext("default");
                if (oContext) {
                    var oSelectedData = oContext.getObject();
                    aSelectedData.push(oContext.getObject());
                    // aSelectedData.push({
                    //     Exyear: oSelectedData.Exyear, // Include Exyear here
                    // });                    
                } else {
                    console.log("No binding context found for item:", oItem);
                }

                // aSelectedData.push(oItem.getBindingContext().getObject());
            });

            sap.ui.getCore().setModel(sModel, "selectedItemsModel");
            sModel.setData(aSelectedData);

            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("assyASNcr", {}, false);

            //***************FOR DISPLAYING HEADER********************* */
            debugger;
            var dataobject = {};

            dataobject.vendor = sModel.oData[0].Lifnr;
            dataobject.plant = sModel.oData[0].Werks;
            dataobject.outputmat = sModel.oData[0].Op_matnr;
            dataobject.Ebeln = sModel.oData[0].Ebeln;
            dataobject.Ebelp = sModel.oData[0].Ebelp;
            dataobject.Aedat = sModel.oData[0].Aedat;

            // MessageBox.success("Selected Record" + " " + vendor + " " );

            var asnmodelobject = new sap.ui.model.json.JSONModel();

            asnmodelobject.setData(dataobject);

            this.getOwnerComponent().setModel(asnmodelobject, "ASNMODEL");


            //********FOR DISPLAYING HEADER*****/

            this._displayCrtAsnEH();

        },
        onCreateASN: function (oEvent) {
            this._selectedData(oEvent);


        },
        _displayCrtAsnEH: function () {
            this.oRouter.navTo("assyASNcr");
        },
        onPreviewPDF: function (oEvent) {
            // Get the selected item
            var oSelectedItem = oEvent.getSource();

            // Get the binding context of the selected item
            var oContext = oSelectedItem.getBindingContext("default");

            // Get the data from the context
            var oData = oContext.getObject();
            //access pdf data using odata service
            var oView1 = this.getView();
            var oModel1 = oView1.getModel();
            var opdfViewer = new PDFViewer();
            this.getView().addDependent(opdfViewer);

            // var sServiceURL = oModel1.sServiceUrl;
            // var sSourceR = "/zdapdfSet(Werks='" + oData.Werks + "',Lifnr='" + oData.Lifnr + "',Exnum='" + oData.Exnum + "',Exdat='" + oData.Exdat + "')/$value";
            // var sSource = sServiceURL + "/zdapdfSet(Werks='" + oData.Werks + "',Lifnr='" + oData.Lifnr + "',Exnum='" + oData.Exnum + "',Exdat='" + oData.Exdat + "')/$value";
            // Define the OData request parameters
            var sPath = "/zdapdfSet(Werks='" + oData.Werks + "',Lifnr='" + oData.Lifnr + "',Exnum='" + oData.Exnum + "',Exdat='" + oData.Exdat + "')/$value";
            //********DO NOT TOUCH - IMPORTANT****************** */

            // opdfViewer.setSource(sSource);
            // opdfViewer.setTitle("DA PDF");
            // opdfViewer.open();

            //********DO NOT TOUCH - IMPORTANT****************** */

            oModel1.read(sPath, {
                success: function (oResponse) {
                    // Construct the PDF source URL
                    var sSource = oModel1.sServiceUrl + sPath;

                    // Configure and open the PDF Viewer
                    opdfViewer.setSource(sSource);
                    opdfViewer.setTitle("DA PDF");
                    opdfViewer.open();
                },
                error: function (oError) {
                    // Parse and display the error message
                    var sErrorMessage = "Preview not available for this Challan !!!";
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
        onMat: function (oEvent) {
            // Get the search query
            debugger;
            var sQuery = oEvent.getParameter("newValue");
            var oTable = this.byId("idasseASN");
            var oBinding = oTable.getBinding("items");
            var aFilters = [];

            if (sQuery && sQuery.length > 0) {
                // Create filters for each field you want to search on
                var oFilter1 = new Filter("Op_matnr", FilterOperator.Contains, sQuery);
                var oFilter2 = new Filter("Ip_Matnr", FilterOperator.Contains, sQuery);

                // Combine filters with OR
                aFilters.push(new Filter({
                    filters: [oFilter1, oFilter2],
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
            var oTable = this.byId("idasseASN");
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
        onDA: function (oEvent) {
            // Get the search query
            debugger;
            var sQuery = oEvent.getParameter("newValue");
            var oTable = this.byId("idasseASN");
            var oBinding = oTable.getBinding("items");
            var aFilters = [];

            if (sQuery && sQuery.length > 0) {
                // Create filters for each field you want to search on
                var oFilter1 = new Filter("Exnum", FilterOperator.Contains, sQuery);

                // Combine filters with OR
                aFilters.push(new Filter({
                    filters: [oFilter1],
                    and: false
                }));
            }

            // Apply the filter to the binding
            oBinding.filter(aFilters);

        },
        onPO: function (oEvent) {
            // Get the search query
            debugger;
            var sQuery = oEvent.getParameter("newValue");
            var oTable = this.byId("idasseASN");
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
            var oTable = this.byId("idasseASN");
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
        fetchDAList: async function (email) {
            debugger;
            const that = this; // Preserve the reference to the controller

            sap.ui.core.BusyIndicator.show();
            try {
                // Make a request to your custom Node.js backend to get the CSRF token and DA list
                const response = await $.ajax({
                    url: "/nodeapp/asselist",     // Your custom backend route
                    method: "GET",              // Use GET since you're retrieving data         
                    contentType: "application/json",
                    data: { email: email }   // Send the email as a query parameter                     
                });
                // Success handling
                sap.ui.core.BusyIndicator.hide();  // Hide the busy indicator on success

                // Process the response to get the tokens and DA list                
                const daList = response;        // Extract DA list data
                debugger;
                // Handle the DA list (e.g., bind to a model or display in a view)
                const oJsonModel = new sap.ui.model.json.JSONModel(daList);
                that.getView().setModel(oJsonModel, "default");
                console.log("DA List fetched successfully:", daList);

            } catch (oErr) {
                sap.ui.core.BusyIndicator.hide();
                console.error("Error fetching DA List:", oErr);
                // If the error response contains a message, display it in the MessageBox
                const errorMessage = oErr.responseJSON?.error?.innererror?.errordetails?.[0]?.message || "Unknown error occurred";

                // Show error message
                // MessageBox.error(errorMessage);
            }
        },
        onChangeMat: function (oEvent) {
            this._selectedPO(oEvent);
        },
        _selectedPO: async function (oEvent) {

            var sModel = this.getOwnerComponent().getModel("selectedRecords");
            var oView = this.getView();
            var oTable = oView.byId("idasseASN");
            var aSelectedItems = oTable.getSelectedItems();
            var aSelectedData = [];

            if (aSelectedItems.length === 0) {
                debugger;
                MessageBox.error("Please Enter at least one Record");
                return; // No items selected
            }

            // Extract PO and PO Line Item values from the first item
            var oFirstContext = aSelectedItems[0].getBindingContext("default");
            var sFirstPO = oFirstContext.getProperty("Ebeln"); // Replace "PO" with your actual property name
            var sFirstPOLineItem = oFirstContext.getProperty("Ebelp"); // Replace "POLineItem" with your actual property name            

            //*********check the po and line item of the selected records************** */    
            debugger;
            aSelectedItems.forEach(function (oItem, index) {
                index = index + 1;
                if (index > 1) {
                    // Trigger error message if index is greater than 4
                    MessageBox.error("You have selected more than 1 items. Please select 1 record only.");
                    return; // Exit the loop early to prevent further processing
                }
            });

            // aSelectedData.push(oItem.getBindingContext().getObject());

            //******************************************************************************** */  
            debugger;
            aSelectedItems.forEach(function (oItem) {
                var oContext = oItem.getBindingContext("default");
                if (oContext) {
                    var oSelectedData = oContext.getObject();
                    aSelectedData.push(oContext.getObject());
                    // aSelectedData.push({
                    //     Exyear: oSelectedData.Exyear, // Include Exyear here
                    // });                    
                } else {
                    console.log("No binding context found for item:", oItem);
                }

                // aSelectedData.push(oItem.getBindingContext().getObject());
            });

            sap.ui.getCore().setModel(sModel, "selectedItemsModel");
            sModel.setData(aSelectedData);

            // var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            // oRouter.navTo("subconASNcr", {}, false);

            //***************FOR DISPLAYING HEADER********************* */
            debugger;
            var dataobject = {};

            dataobject.vendor = sModel.oData[0].Lifnr;
            dataobject.plant = sModel.oData[0].Werks;
            dataobject.outputmat = sModel.oData[0].Op_matnr;
            dataobject.Ebeln = sModel.oData[0].Ebeln;
            dataobject.Ebelp = sModel.oData[0].Ebelp;

            const v_ebeln = sModel.oData[0].Ebeln;
            const v_ebelp = sModel.oData[0].Ebelp;
            const v_Ip_Matnr = sModel.oData[0].Ip_Matnr;
            const v_vendor = sModel.oData[0].Lifnr;
            const v_plant = sModel.oData[0].Werks;
            const v_Op_Matnr = sModel.oData[0].Op_Matnr;
            this._vMenge = sModel.oData[0].Menge - sModel.oData[0].Menga;

            // MessageBox.success("Selected Record" + " " + vendor + " " );

            var asnmodelobject = new sap.ui.model.json.JSONModel();

            asnmodelobject.setData(dataobject);

            this.getOwnerComponent().setModel(asnmodelobject, "ASNMODEL");

            debugger;
            // Create the query parameters to be passed in the AJAX request
            const params = {
                ebeln: v_ebeln,
                ebelp: v_ebelp,
                ip_matnr: v_Ip_Matnr,
                lifnr: v_vendor,
                werks: v_plant
            };

            try {
                // Make a request to your custom Node.js backend to get the CSRF token and DA list
                const response = await $.ajax({
                    url: "/nodeapp/changemat",     // Your custom backend route
                    method: "GET",              // Use GET since you're retrieving data         
                    contentType: "application/json",// Send the email as a query parameter
                    data: params
                });
                // Success handling
                sap.ui.core.BusyIndicator.hide();  // Hide the busy indicator on success
                debugger;
                // Process the response to get the tokens and DA list                
                const filteredData = response;        // Extract DA list data                         

                // Get the DA list from the model
                // const daList = this.getView().getModel("default").getData();
                // Filter the DA list by `Ebeln`
                // const filteredData = daList.filter(item => item.Ebeln === v_ebeln && item.Ebelp !== v_ebelp && item.Ip_Matnr === v_Ip_Matnr);
                if (filteredData.length === 0) {
                    sap.m.MessageBox.error("No records found for the selected PO");
                    return;
                }
                //********FOR DISPLAYING Change Material List*****/

                this._displaySelectMatRatio(filteredData, v_ebeln, v_ebelp);

            } catch (oErr) {
                sap.ui.core.BusyIndicator.hide();
                console.error("Error fetching Change Mat:", oErr);
                // If the error response contains a message, display it in the MessageBox
                const errorMessage = oErr.responseJSON?.error?.innererror?.errordetails?.[0]?.message || "Unknown error occurred";

                // Show error message
                // MessageBox.error(errorMessage);
            }

        },

        _displaySelectMatRatio: function (filteredData, lv_ebeln, lv_ebelp) {
            const oFilteredModel = new sap.ui.model.json.JSONModel(filteredData);
            this.getView().setModel(oFilteredModel, "SelectMatModel");
            debugger;

            if (!this._oSelectMaterialDialog) {
                Fragment.load({
                    id: this.getView().getId(), // Ensure unique ID for the fragment
                    name: "zmmsubcontract.fragments.selMatPop", // Path to your fragment
                    controller: this, // Bind the current controller to the fragment
                }).then(function (oFragment) {
                    this._oSelectMaterialDialog = oFragment;
                    this.getView().addDependent(this._oSelectMaterialDialog);

                    // Bind the 'SelectMatModel' data to the fragment's table
                    var oTable = sap.ui.core.Fragment.byId(this.getView().getId(), "idMaterialTable");
                    if (oTable) {
                        oTable.setModel(this.getView().getModel("SelectMatModel"), "SelectMatModel");
                    }

                    // Open the dialog
                    this._oSelectMaterialDialog.open();
                }.bind(this)).catch(function (oError) {
                    console.error("Error loading fragment:", oError);
                });
            } else {
                // Open the dialog if already loaded
                // Ensure the table in the fragment is updated with the latest data
                var oTable = sap.ui.core.Fragment.byId(this.getView().getId(), "idMaterialTable");
                if (oTable) {
                    oTable.setModel(this.getView().getModel("SelectMatModel"), "SelectMatModel");
                }
                this._oSelectMaterialDialog.open();
            }
        },
        onCloseSelectMaterialDialog: function () {
            this._oSelectMaterialDialog.close();
        },
        onChangeSelectedMaterial: function (oEvent) {
            debugger;
            const v_menge = this._vMenge;
            this.selectedchangedMaterial(oEvent);
            debugger;
            var sModel = this.getOwnerComponent().getModel("selectedRecords");
            var cModel = this.getOwnerComponent().getModel("changedRecords");
            var asnModel = this.getOwnerComponent().getModel("ASNMODEL");
            var sData = sModel.getData();
            var cData = cModel.getData();
            var asnData = asnModel.getData();

            var ratio = cData[0].Ratio;
            var balanceQty = v_menge / ratio;
            balanceQty = parseFloat(balanceQty.toFixed(3));
            if (sData && sData.length > 0) {
                sData[0].Balqty = balanceQty; // Replace "BalanceQty" with the actual field name
                sData[0].Op_matnr = cData[0].Op_matnr;
                sModel.setData(sData);
                // Update the view to reflect the changes
                this.getView().getModel("selectedRecords").refresh(true);

                asnData.Ebelp = cData[0].Ebelp;
                asnModel.setData(asnData);
                this.getView().getModel("ASNMODEL").refresh(true);

            } else {
                MessageBox.error("No data found in the selected records model.");
            }

            this._displayCrtAsnEH();
            // Update the model or proceed with further logic
            this._oSelectMaterialDialog.close();
        },
        selectedchangedMaterial: function (oEvent) {
            var cModel = this.getOwnerComponent().getModel("changedRecords");
            // var oFragment = this.byId("idSelectMaterialDialog");
            // if (!oFragment) {
            //     oFragment = sap.ui.core.Fragment.byId("idSelectMaterialDialog", "idMaterialTable");
            // }            
            // var oTable = oFragment;
            var oTable = this.byId("idMaterialTable");
            var aSelectedItems = oTable.getSelectedItems();
            var aSelectedData = [];
            debugger;
            if (aSelectedItems.length === 0) {
                debugger;
                MessageBox.error("Please Enter at least one Record");
                return; // No items selected
            }

            // Extract PO and PO Line Item values from the first item
            // var oFirstContext = aSelectedItems[0].getBindingContext("default");
            // var sFirstPO = oFirstContext.getProperty("Ebeln"); // Replace "PO" with your actual property name
            // var sFirstPOLineItem = oFirstContext.getProperty("Ebelp"); // Replace "POLineItem" with your actual property name            

            //*********check the po and line item of the selected records************** */    
            // debugger;
            // aSelectedItems.forEach(function (oItem, index) {
            //     index = index + 1;
            //     if (index > 1) {
            //         // Trigger error message if index is greater than 4
            //         MessageBox.error("You have selected more than 1 items. Please select 1 record only.");
            //         return; // Exit the loop early to prevent further processing
            //     }
            // });

            // aSelectedData.push(oItem.getBindingContext().getObject());

            //******************************************************************************** */  
            debugger;
            aSelectedItems.forEach(function (oItem) {
                var oContext = oItem.getBindingContext("SelectMatModel"); //name of your model
                if (oContext) {
                    var oSelectedData = oContext.getObject();
                    aSelectedData.push(oContext.getObject());
                    // aSelectedData.push({
                    //     Exyear: oSelectedData.Exyear, // Include Exyear here
                    // });                    
                } else {
                    console.log("No binding context found for item:", oItem);
                }

                // aSelectedData.push(oItem.getBindingContext().getObject());
            });

            sap.ui.getCore().setModel(cModel, "selectedItemsModel");
            cModel.setData(aSelectedData);
        }
    });
});