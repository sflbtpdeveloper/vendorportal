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
    return BaseController.extend("zmmsubcontract.controller.subconDA", {

        _data: {
            dtValue: UI5Date.getInstance(),
            dtPattern: undefined
        },
        onInit: function () {
            BaseController.prototype.onInit.apply(this);


            this._userModel = this.getOwnerComponent().getModel("userModel");
            let me = this;
            debugger;
            fetch("/getUserInformation")
                .then(res => res.json())
                .then(data => {
                    me._userModel.setProperty("/",
                        {
                            email: data.email,
                            user: data.user, // Store user information
                            scopes: data.scopes // Store user scopes
                        });
                    console.log(me._userModel.getProperty("/"));

                    // Check if scopes array has the second element
                    if (data.scopes && data.scopes.length > 1) {
                        let scopeMessage = `Your scope: ${data.scopes[1]}`;
                        // Display the scope using MessageToast or MessageBox
                        sap.m.MessageToast.show(scopeMessage, {
                            duration: 3000  // Display for 3 seconds
                        });
                    } else {
                        // If no scope[1] exists, display a fallback message
                        sap.m.MessageToast.show("No specific scope found.", {
                            duration: 3000
                        });
                    }

                })
                .catch(err => console.log(err));

            this._localModel = this.getOwnerComponent().getModel("local");

            // this.oRouter.attachRoutePatternMatched(this._onObjectMatched, this);
            this.oRouter.getRoute("subconDA").attachPatternMatched(this._onObjectMatched, this);
            this.oRouter = this.getOwnerComponent().getRouter();
            // var oModel = new JSONModel(this._data);   
            //*****SETTING DATA TO MODEL AND MAPPING THE TABLE********* */

            // this._readData();

            //******************************************************** */

            this.oRouter = this.getOwnerComponent().getRouter();
        },
        _readData: function () {


            this.getView().byId("idFilPlant").setValue('');
            this.getView().byId("idFilDA").setValue('');
            this.getView().byId("idFilVen").setValue('');
            this.getView().byId("idSerMat").setValue('');

            // Get the email ID from the user model
            // let sEmail = this._userModel.getProperty("/email");
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

            this._userModel = this.getOwnerComponent().getModel("userModel");
            let sEmail = this._userModel.oData.email
            // let sEmail = "muthuramesh31@gmail.com"

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
            this.getView().byId("idDetail").setModel(oModel);
            var that = this;
            sap.ui.core.BusyIndicator.show(0);
            this.getOwnerComponent().setModel(oModel, "defaultModel");
            //***************************************************************************** */
            this.fetchDAList(sEmail);
            //***************************************************************************** */
            // Get data from the default entity set                        
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
        onRowSelect: function () {
            alert("Triggered");
        },
        onSearchVendor: function (oEvent) {
            this._applySearchFilter("Lifnr", oEvent.getParameter("query"));
        }, _onObjectMatched: function (oEvent) {
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

            // var aFilters = [];
            // if (oData.Werks) {
            //     var oFilter = new sap.ui.model.Filter("Plant", sap.ui.model.FilterOperator.EQ, oData.Werks);
            //     aFilters.push(oFilter);
            // }

            //     var oFilter = new sap.ui.model.Filter("Cat", sap.ui.model.FilterOperator.EQ, 'SC');
            //     aFilters.push(oFilter);            

            // var pModel = this.getOwnerComponent().getModel("poservice");
            // var that = this;
            if (oData.Pdfchk === 'X') {
                // Display an error message
                sap.m.MessageBox.error("Selected PO has No print Preview");
            } else {
                // Perform validation on the response                    
                debugger;
                var oView1 = this.getView();
                var oModel1 = oView1.getModel();
                var opdfViewer = new PDFViewer();
                this.getView().addDependent(opdfViewer);
                var sServiceURL = oModel1.sServiceUrl;
                var sSourceR = "/zdapdfSet(Werks='" + oData.Werks + "',Lifnr='" + oData.Lifnr + "',Exnum='" + oData.Exnum + "',Exdat='" + oData.Exdat + "')/$value";
                var sSource = sServiceURL + "/zdapdfSet(Werks='" + oData.Werks + "',Lifnr='" + oData.Lifnr + "',Exnum='" + oData.Exnum + "',Exdat='" + oData.Exdat + "')/$value";
                // var sPath = "/zdapdfSet(Werks='" + oData.Werks + "',Lifnr='" + oData.Lifnr + "',Exnum='" + oData.Exnum + "',Exdat='" + oData.Exdat + "')/$value";
                // var sServiceURL = oModel1.sServiceUrl + sPath;
                // Trigger the OData service call to check if the PDF can be fetched
                //********DO NOT TOUCH - IMPORTANT****************** */

                opdfViewer.setSource(sSource);
                opdfViewer.setTitle("DA PDF");
                opdfViewer.open();

            }

            //access pdf data using odata service


            //********DO NOT TOUCH - IMPORTANT****************** */


        },
        onMat: function (oEvent) {
            // Get the search query
            debugger;
            var sQuery = oEvent.getParameter("newValue");
            var oTable = this.byId("idDetail");
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
            var oTable = this.byId("idDetail");
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
            var oTable = this.byId("idDetail");
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
        onVendor: function (oEvent) {
            // Get the search query
            debugger;
            var sQuery = oEvent.getParameter("newValue");
            var oTable = this.byId("idDetail");
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
        onDownloadExcel: function () {
            var oTable = this.byId("idDetail");
            // var aItems = oTable.getBinding("items").getContexts().map(function (oContext) {
            //     return oContext.getObject();
            // });

            var oModel = this.getView().getModel("default");
            var aItems = oModel.getProperty("/");
            if (!aItems || aItems.length === 0) {
                sap.m.MessageBox.error("No records found to download.");
                return;
            }
            // Prepare the data for the Excel file
            var aData = aItems.map(function (item) {
                return {
                    "DA Number": item.Exnum,
                    "DA Date": item.Exdat, // If visible
                    "Plant": item.Werks,
                    "Vendor": item.Lifnr,
                    "Output Part Number": item.Op_matnr,
                    "Input Part Number": item.Ip_Matnr,
                    "PO Number": item.Ebeln,
                    "Balance Quantity": item.Balqty,
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
            link.setAttribute("download", "subcontract_data.csv"); // Set the filename
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
        fetchDAList: async function (email) {
            debugger;
            const that = this; // Preserve the reference to the controller

            sap.ui.core.BusyIndicator.show();
            try {
                // Make a request to your custom Node.js backend to get the CSRF token and DA list
                const response = await $.ajax({
                    url: "/nodeapp/dalist",     // Your custom backend route
                    method: "GET",              // Use GET since you're retrieving data         
                    contentType: "application/json",
                    data: { email: email }   // Send the email as a query parameter
                });
                // Success handling
                sap.ui.core.BusyIndicator.hide();  // Hide the busy indicator on success

                const daList = response;        // Extract DA list data

                // const today = new Date();
                // debugger;
                // daList.forEach((item) => {
                //     if (item.Exdat) {
                //         // Parse the Exdat field into a Date object
                //         const exDate = new Date(item.Exdat);

                //         // Calculate the difference in milliseconds and convert to days
                //         const diffInMs = exDate - today; // Difference in milliseconds
                //         const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24)); // Convert to days

                //         // Add the calculated difference to the item object (or log it)
                //         item.noOfDays = diffInDays; // Add a new field to the item with the calculated days

                //         console.log(`Item: ${item}, Days Until Expiry: ${diffInDays}`);
                //     }
                // });
                console.log(daList);
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
        }

    });
});