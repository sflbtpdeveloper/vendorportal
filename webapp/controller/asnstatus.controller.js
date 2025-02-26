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
    return BaseController.extend("zmmsubcontract.controller.asnstatus", {

        _data: {
            dtValue: UI5Date.getInstance(),
            dtPattern: undefined
        },
        onBeforeRendering: function () {
            debugger;
            var oModel = this.getView().getModel();
            oModel.refresh(true); // Force refresh from backend
        },
        onInit: function () {
            BaseController.prototype.onInit.apply(this);
            this._localModel = this.getOwnerComponent().getModel("local");
            debugger;
            this.oRouter = this.getOwnerComponent().getRouter();
            // this.oRouter.attachRoutePatternMatched(this._onObjectMatched,this);
            this.oRouter.getRoute("asnstat").attachPatternMatched(this._onObjectMatched, this);

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

        },
        onBeforeRendering: function () {
            if (this.oRouter) {
                // Detach PatternMatched before re-rendering
                this.oRouter.getRoute("asnstat").detachPatternMatched(this._onObjectMatched, this);
            }
        },

        onAfterRendering: function () {
            if (this.oRouter) {
                // Re-attach PatternMatched after rendering
                this.oRouter.getRoute("asnstat").attachPatternMatched(this._onObjectMatched, this);
            }
        },
        _readData: function () {
            this.getView().byId("idFilASN").setValue('');
            this.getView().byId("serInv").setValue('');
            this.getView().byId("idFilDCno").setValue('');

            // Get the email ID from the user model
            this._userModel = this.getOwnerComponent().getModel("userModel");
            let sEmail = this._userModel.oData.email
            // let sEmail = "muthuramesh31@gmail.com"
            // Define a filter for the OData request

            let aFilters = [
                new sap.ui.model.Filter("Email", sap.ui.model.FilterOperator.EQ, sEmail)
            ];

            var oModel = this.getOwnerComponent().getModel("asncrt");
            oModel.refreshMetadata();
            oModel.refresh(true); // force a data refresh
            this.getView().byId("idasnStat").setModel(oModel);
            var that = this;
            sap.ui.core.BusyIndicator.show(0);
            this.getOwnerComponent().setModel(oModel, "defaultModel");
            this.fetchASNStatus(sEmail);

            // oModel.read("/ZET_ASN_STATSet", {
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
            //         console.log(oErr); s
            //         sap.ui.core.BusyIndicator.hide();
            //         MessageBox.error(JSON.parse(oErr.responseText).error.innererror.errordetails[0].message);
            //     }
            // });

        },
        onRowSelect: function () {
            alert("Triggered");
        },
        onSearchVendor: function (oEvent) {
            this._applySearchFilter("Lifnr", oEvent.getParameter("query"));
        },
        _onObjectMatched: function (oEvent) {
            // Perform the refresh logic here   
            debugger;
            this._readData();
            // Detach the event handler to prevent further calls
            // this.oRouter.getRoute("asnstatus").detachPatternMatched(this._onObjectMatched, this);
        },
        _refreshView: function () {

            var oTable = this.byId("idRegASN");
            debugger;
            oTable.removeSelections(true);
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
            var sServiceURL = oModel1.sServiceUrl;
            var sSourceR = "/zdapdfSet(Werks='" + oData.Werks + "',Lifnr='" + oData.Lifnr + "',Exnum='" + oData.Exnum + "',Exdat='" + oData.Exdat + "')/$value";
            var sSource = sServiceURL + "/zdapdfSet(Werks='" + oData.Werks + "',Lifnr='" + oData.Lifnr + "',Exnum='" + oData.Exnum + "',Exdat='" + oData.Exdat + "')/$value";

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
            var oTable = this.byId("idasnStat");
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
        onWerks: function (oEvent) {
            // Get the search query
            debugger;
            var sQuery = oEvent.getParameter("newValue");
            var oTable = this.byId("idasnStat");
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
        onDCnumb: function (oEvent) {
            // Get the search query
            debugger;
            var sQuery = oEvent.getParameter("newValue");
            var oTable = this.byId("idasnStat");
            var oBinding = oTable.getBinding("items");
            var aFilters = [];

            if (sQuery && sQuery.length > 0) {
                // Create filters for each field you want to search on
                var oFilter1 = new Filter("Dcno", FilterOperator.Contains, sQuery);

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
            var oTable = this.byId("idasnStat");
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
        onDCdate1: function (oEvent) {
            // Get the search query
            debugger;
            var sQuery = oEvent.getParameter("newValue");
            var oTable = this.byId("idasnStat");
            var oBinding = oTable.getBinding("items");
            var aFilters = [];

            if (sQuery && sQuery.length > 0) {
                // var formattedDate = this.formatDate(oParsedDate);
                // Create filters for each field you want to search on
                var oFilter1 = new Filter("Dcdat1", FilterOperator.Contains, sQuery);
                // var oFilter1 = new Filter("Dcdat", FilterOperator.Contains, formattedDate);

                // Combine filters with OR
                aFilters.push(new Filter({
                    filters: [oFilter1],
                    and: false
                }));
            }

            // Apply the filter to the binding
            oBinding.filter(aFilters);

        },
        formatDate: function (sValue) {
            if (sValue) {
                // Check if the input is in the /Date(timestamp)/ format
                var match = /\/Date\((\d+)\)\//.exec(sValue);
                if (match) {
                    var timestamp = parseInt(match[1], 10); // Extract and parse the timestamp
                    var oDate = new Date(timestamp);       // Create a Date object from the timestamp

                    // Format the date using the specified pattern
                    var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({ pattern: "dd-MM-yyyy" });
                    return oDateFormat.format(oDate);
                }
            }
            return "";
        },
        formatZeroValue: function (value) {
            debugger;
            return value === null ? "" : value;
        },
        jobstatff: function (sValue) {
            if (sValue) {
                return (sValue === 'C') ? "/images/GTICK.jpg" : "/images/RCROSS.jpg";
            }
            return sValue;

        },
        isGrnoNonEmpty: function (grno) {
            // Check if Grno is not empty, undefined, or nulls
            // return grno && grno.trim() !== "";
            return !!(grno && grno.trim() !== "");
        },
        PayText: function (paystat) {
            if (paystat === "P") {
                return "Completed"; // Positive state
            } else if (paystat === "NP") {
                return "Pending"; // Negative state
            }
            return " "; // Default state
        },
        PayState: function (paystat) {
            if (paystat === "P") {
                return "Success"; // Positive state
            } else if (paystat === "NP") {
                return "Error"; // Negative state
            }
            return "None"; // Default state
        },
        PayIcon: function (paystat) {
            if (paystat === "P") {
                return "sap-icon://accept"; // Checkmark for payment made
            } else if (paystat === "NP") {
                return "sap-icon://decline"; // Cross for payment not made
            }
            return ""; // No icon for other cases
        },
        conditionalText: function (value) {
            // Check for default values and return empty if they match
            if (value === "0000000000" || value === "0000" || !value) {
                return ""; // Return empty string if the value is invalid
            }
            return value; // Return the actual value
        },
        fetchASNStatus: async function (email) {
            debugger;
            const that = this; // Preserve the reference to the controller
            sap.ui.core.BusyIndicator.show();
            try {
                // Make a request to your custom Node.js backend to get the CSRF token and DA list
                const response = await $.ajax({
                    url: "/nodeapp/asnstatus",     // Your custom backend route
                    method: "GET",              // Use GET since you're retrieving data         
                    contentType: "application/json",
                    data: { email: email }   // Send the email as a query parameter
                });
                // Success handling
                sap.ui.core.BusyIndicator.hide();  // Hide the busy indicator on success

                // Process the response to get the tokens and DA list                
                const asnstatusdata = response;        // Extract DA list data
                debugger;
                // Handle the DA list (e.g., bind to a model or display in a view)
                const oJsonModel = new sap.ui.model.json.JSONModel(asnstatusdata);
                that.getView().setModel(oJsonModel, "asnrepModel");
                //  console.log("ASN Status fetched successfully:", daList);

            } catch (oErr) {
                sap.ui.core.BusyIndicator.hide();
                console.error("Error fetching ASN Status Records:", oErr);
                // If the error response contains a message, display it in the MessageBox
                const errorMessage = oErr.responseJSON?.error?.innererror?.errordetails?.[0]?.message || "Unknown error occurred";

                // Show error message
                //  MessageBox.error(errorMessage);
            }
        },

        onDownloadExcel: function () {
            var oTable = this.byId("idasnStat");
            // var aItems = oTable.getBinding("items").getContexts().map(function (oContext) {
            //     return oContext.getObject();
            // });

            var oModel = this.getView().getModel("asnrepModel");
            var aItems = oModel.getProperty("/");
            if (!aItems || aItems.length === 0) {
                sap.m.MessageBox.error("No records found to download.");
                return;
            }
            // Prepare the data for the Excel file
            var aData = aItems.map(function (item) {
                return {
                    "Plant": item.Werks,
                    "ASN Number": item.Asnno,
                    // "ASN Item": item.Asnno,
                    "Invoice No": item.Ebeln,
                    "Invoice Item": item.Ebelp,
                    "Material Code": item.Matnr,
                    "Material Desc": item.Maktx,
                    "DC No": item.Dcno,
                    "DC Date": item.Dcdat1,
                    "ASN Quantity": item.Asnqty,
                    "Job Status": item.Grstatus,

                    "ASN Status": item.Asnstatus,
                    "DMRR Number": item.Dmrrno,
                    "GR Number": item.Grno,
                    "GR Number Item": item.Gritm,
                    "IR Number": item.Irno,
                    "Payment Status": item.Paystat,
                    "Payment Reference": item.Payref,
                    // Add other fields as necessary
                };
            });

            // Convert the data to a CSV format
            var sCsvContent = this.convertToCsv(aData);

            // Create a Blob from the CSV content
            var blob = new Blob([sCsvContent], { type: 'text/csv;charset=utf-8;' });

            // Create a link element for downloading the file
            var link = document.createElement("a");
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "subcontract_status_data.csv"); // Set the filename
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        },

        convertToCsv: function (data) {
            var csv = '';
            // Create the headers
            var headers = Object.keys(data[0]);
            csv += headers.join(',') + '\r\n';

            // Create rows
            data.forEach(function (row) {
                csv += headers.map(function (header) {
                    return row[header] ? row[header].toString().replace(/,/g, ' ') : '';
                }).join(',') + '\r\n';
            });

            return csv;
        },

    });
});