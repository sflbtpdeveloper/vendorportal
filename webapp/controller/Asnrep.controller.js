sap.ui.define([
    'zmmsubcontract/controller/BaseController',
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/Dialog",
    "sap/m/CheckBox",
    "sap/m/Button",
    "sap/m/VBox",
    "sap/m/HBox",

], function (BaseController, Controller, Filter, FilterOperator, Dialog, CheckBox, Button, VBox, HBox) {
    "use strict";
    return BaseController.extend("zmmsubcontract.controller.Asnrep", {
        onInit: function () {
            debugger;
            this._dialog = null;
            this._localModel = this.getOwnerComponent().getModel("poservice");
            this.oRouter = this.getOwnerComponent().getRouter();
            this.oRouter.getRoute("SupASNRep").attachPatternMatched(this._onRouteMatched, this);

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

        _onRouteMatched: function () {
            this._readData();
        },

        onBeforeRendering: function () {
            if (this.oRouter) {
                // Detach PatternMatched before re-rendering
                this.oRouter.getRoute("SupASNRep").detachPatternMatched(this._onRouteMatched, this);
            }
        },

        onAfterRendering: function () {
            // Re-attach PatternMatched after rendering
            this.oRouter.getRoute("SupASNRep").attachPatternMatched(this._onRouteMatched, this);
        },

        _readData: function () {
            debugger;
            this.byId("searchFieldAsnno").setValue("");
            this.byId("searchFieldEbeln").setValue("");
            this.byId("searchFieldMatnr").setValue("");
            this.byId("searchFieldMaktx").setValue("");
            var oModel = this.getOwnerComponent().getModel("poservice");
            oModel.refreshMetadata();
            oModel.refresh(true); // force a data refresh
            this.getView().byId("asnTable").setModel(oModel);
            var that = this;
            sap.ui.core.BusyIndicator.show(0);
            this.getOwnerComponent().setModel(oModel, "poservice");

            this._userModel = this.getOwnerComponent().getModel("userModel");
            let sEmail = this._userModel.oData.email
            let aFilters = [
                new sap.ui.model.Filter("Email", sap.ui.model.FilterOperator.EQ, sEmail)
            ];
            this.fetchASNReport(sEmail);

            // oModel.read("/YMM_SUPPLIER_PO_ASN_REPSet", {
            //     filters: aFilters,
            //     success: function (oData, response) {
            //         debugger;
            //         sap.ui.core.BusyIndicator.hide();
            //         var oJsonModel = new sap.ui.model.json.JSONModel();
            //         oJsonModel.setData(oData.results);
            //         that.getView().setModel(oJsonModel, "asnRep");
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

        onAsnno: function (oEvent) {
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

        jobstatff: function (sValue) {
            if (sValue) {
                return (sValue === 'C') ? "/images/GTICK.jpg" : "/images/RCROSS.jpg";
            }
            return sValue;
        },

        PayText: function (Pstatus) {
            if (Pstatus === "P") {
                return "Completed"; // Positive state
            } else if (Pstatus === "NP") {
                return "Pending"; // Negative state
            }
            return " "; // Default state
        },

        PayState: function (Pstatus) {
            if (Pstatus === "P") {
                return "Success"; // Positive state
            } else if (Pstatus === "NP") {
                return "Error"; // Negative state
            }
            return "None"; // Default state
        },

        PayIcon: function (Pstatus) {
            if (Pstatus === "P") {
                return "sap-icon://accept"; // Checkmark for payment made
            } else if (Pstatus === "NP") {
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

        isGrnoNonEmpty: function (Dmrrno) {
            // Check if Grno is not empty, undefined, or nulls
            // return grno && grno.trim() !== "";
            // return !!(Dmrrno && Dmrrno.trim() !== "");
            return !!(Dmrrno && Dmrrno.trim() !== "" && Dmrrno !== "0000000000");
        },

        _applyFilters: function () {
            var aFilters = [];
            // Get values from the search fields
            var sAsnno = this.byId("searchFieldAsnno").getValue();
            var sEbeln = this.byId("searchFieldEbeln").getValue();
            var sMatnr = this.byId("searchFieldMatnr").getValue();
            var sMaktx = this.byId("searchFieldMaktx").getValue();

            if (sAsnno) {
                aFilters.push(new Filter("Asnno", FilterOperator.Contains, sAsnno));
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

            console.log("Applied filters:", aFilters);

            var oTable = this.byId("asnTable");
            var oBinding = oTable.getBinding("rows");

            if (oBinding) {
                if (aFilters.length > 0) {
                    var oCombinedFilter = new Filter({
                        filters: aFilters,
                        and: true // Combine filters using AND logic
                    });
                    oBinding.filter(oCombinedFilter);
                } else {
                    oBinding.filter([]); // Clear filters
                }
            }
        },

        onFromAsnDateChange: function (oEvent) {
            this.applyFilters1(); // Call the filter function
        },

        onToAsnDateChange: function (oEvent) {
            this.applyFilters1(); // Call the filter function
        },

        applyFilters1: function () {
            var oTable = this.byId("asnTable");
            if (!oTable) {
                console.warn("Table not found!");
                return;
            }

            var oBinding = oTable.getBinding("rows");
            if (!oBinding) {
                console.warn("Table binding not found!");
                return;
            }

            var fromDate = this.byId("fromAsnDate").getDateValue(); // Gets Date object
            var toDate = this.byId("toAsnDate").getDateValue(); // Gets Date object

            var aFilters = [];

            if (fromDate && !toDate) {
                // Case 1: Only From Date is selected → Use EQ (Equals)
                var formattedFromDate = this.formatDateToYYYYMMDD(fromDate);
                aFilters.push(new sap.ui.model.Filter("Asndate1", sap.ui.model.FilterOperator.EQ, formattedFromDate));
            }
            else if (fromDate && toDate) {
                // Case 2: Both From Date & To Date selected → Use BT (Between)
                var formattedFromDate = this.formatDateToYYYYMMDD(fromDate);
                var formattedToDate = this.formatDateToYYYYMMDD(toDate);
                aFilters.push(new sap.ui.model.Filter("Asndate1", sap.ui.model.FilterOperator.BT, formattedFromDate, formattedToDate));
            }

            if (aFilters.length > 0) {
                oBinding.filter(aFilters, "Application"); // Apply the filter
            } else {
                oBinding.filter([]); // Clear filter if no dates selected
            }

            console.log("Applied Filters:", aFilters); // Debugging
        },

        formatDateToYYYYMMDD: function (date) {
            if (!date) return null;
            var year = date.getFullYear();
            var month = String(date.getMonth() + 1).padStart(2, '0'); // Month is zero-based
            var day = String(date.getDate()).padStart(2, '0');
            return year + month + day; // Returns YYYYMMDD
        },

        onSelectColumnsPress: function () {
            debugger;
            if (!this._dialog) {
                this._dialog = new Dialog({
                    title: "Select Columns",
                    content: this._createColumnSelectionContent(),
                    draggable: true, // Enable dragging
                    beginButton: new Button({
                        text: "OK",
                        press: function () {
                            this._dialog.close();
                        }.bind(this)
                    }),
                    afterClose: function () {
                        this._dialog.destroy();
                        this._dialog = null;
                    }.bind(this)
                });
            }
            this._dialog.open();
        },

        _createColumnSelectionContent: function () {
            debugger;
            var oVBox = new VBox();
            var columns = [
                { id: "_IDGenColumn1", label: "ASN Number" },
                { id: "_IDGenColumn2", label: "ASN Item" },
                { id: "_IDGenColumn3", label: "PO Number" },
                { id: "_IDGenColumn4", label: "PO Item" },
                { id: "_IDGenColumn5", label: "Material Number" },
                { id: "_IDGenColumn6", label: "Material Description" },
                { id: "_IDGenColumn7", label: "DC Number" },
                { id: "_IDGenColumn8", label: "DC Date" },
                { id: "_IDGenColumn9", label: "Asn Qty" },
                { id: "_IDGenColumn10", label: "Asn Status" },
                { id: "_IDGenColumn11", label: "DMRR Number" },
                { id: "_IDGenColumn12", label: "GR Number" },
                { id: "_IDGenColumn13", label: "IR Number" },
                { id: "_IDGenColumn14", label: "Payment Status" },
                { id: "_IDGenColumn15", label: "Payment Reference" },
                { id: "_IDGenColumn17", label: "Accepted Quantity" },
                { id: "_IDGenColumn18", label: "Rejected Quantity" }
            ];

            // HBox for Select All and Deselect All buttons
            var oHBox = new HBox({
                justifyContent: "SpaceBetween" // Space between the buttons
            });

            // Select All Button
            var btnSelectAll = new Button({
                text: "Select All",
                press: function () {
                    columns.forEach(function (column) {
                        var columnControl = this.byId("asnTable").getColumns().find(col => col.getId().endsWith(column.id));
                        if (columnControl) {
                            columnControl.setVisible(true); // Show all columns
                            // Update checkbox state if needed (not directly used in the below checkboxes)
                        }
                    }, this);
                    this._updateCheckBoxes(oVBox, true); // Update checkboxes to reflect the change
                }.bind(this)
            });

            // Deselect All Button
            var btnDeselectAll = new Button({
                text: "Deselect All",
                press: function () {
                    columns.forEach(function (column) {
                        var columnControl = this.byId("asnTable").getColumns().find(col => col.getId().endsWith(column.id));
                        if (columnControl) {
                            columnControl.setVisible(false); // Hide all columns
                        }
                    }, this);
                    this._updateCheckBoxes(oVBox, false); // Update checkboxes to reflect the change
                }.bind(this)
            });

            // Add buttons to the VBox
            oHBox.addItem(btnSelectAll);
            oHBox.addItem(btnDeselectAll);

            // Add HBox to the VBox
            oVBox.addItem(oHBox);

            columns.forEach(function (column) {
                var columnControl = this.byId("asnTable").getColumns().find(col => col.getId().endsWith(column.id));
                if (columnControl) {
                    var checkBox = new CheckBox({
                        selected: columnControl.getVisible(), // Set initial state based on column visibility
                        text: column.label,
                        select: function (oEvent) {
                            var isSelected = oEvent.getParameter("selected");
                            columnControl.setVisible(isSelected); // Toggle column visibility
                        }
                    });
                    oVBox.addItem(checkBox);
                }
            }, this);
            return oVBox;
        },

        _updateCheckBoxes: function (oVBox, isSelected) {
            // Update the checkbox states
            oVBox.getItems().forEach(function (item) {
                if (item instanceof sap.m.CheckBox) {
                    item.setSelected(isSelected);
                }
            });
        },

        onDownloadExcel: function () {
            var fromDate = this.byId("fromAsnDate").getDateValue(); // Gets Date object
            var toDate = this.byId("toAsnDate").getDateValue(); // Gets Date object

            var oTable = this.byId("asnTable");
            var oBinding = oTable.getBinding("items");

            var oModel = this.getView().getModel("asnRep");
            var aItems = oModel.getProperty("/");

            if (fromDate && !toDate) {
                // Case 1: Only From Date is selected → Filter for exact match
                var formattedFromDate = this.formatDateToYYYYMMDD(fromDate);
                aItems = aItems.filter(function (item) {
                    return item.Asndate1 === formattedFromDate;
                });
            } else if (fromDate && toDate) {
                // Case 2: Both From Date & To Date selected → Filter for range
                var formattedFromDate = this.formatDateToYYYYMMDD(fromDate);
                var formattedToDate = this.formatDateToYYYYMMDD(toDate);
                aItems = aItems.filter(function (item) {
                    return item.Asndate1 >= formattedFromDate && item.Asndate1 <= formattedToDate;
                });
            }

            if (!aItems || aItems.length === 0) {
                sap.m.MessageBox.error("No records found to download.");
                return;
            }
            // Prepare the data for the Excel file
            var aData = aItems.map(function (item) {
                return {
                    "ASN Number": item.Asnno,
                    "Item Number": item.Posnr,
                    "PO Number": item.Ebeln,
                    "PO Item": item.Ebelp,
                    "Material": item.Matnr,
                    "Desc": item.Maktx,
                    "DC No": item.Dcno,
                    "DC Date": item.Dcdate,
                    "ASN Qty": item.Asnqty,
                    "ASN Status": item.Asnstatus,
                    "DMRR No": item.Dmrrno,
                    "GRN No": item.Mblnr,
                    "IR No": item.Mblnr1,
                    "Payment Status": item.Pstatus,
                    "Payment Ref": item.Pcomplete,
                    "Accepted Quantity": item.Accqty,
                    "Rejected Quantity": item.Rejqty,
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
            link.setAttribute("download", "supplier_data.csv"); // Set the filename
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

        _downloadCSV: function (csvContent, filename) {
            // Create a blob object for the CSV data
            var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

            // Create a link element
            var link = document.createElement('a');
            var url = URL.createObjectURL(blob);

            link.setAttribute('href', url);
            link.setAttribute('download', filename);

            // Append the link to the body (required for Firefox)
            document.body.appendChild(link);

            // Programmatically click the link to trigger the download
            link.click();

            // Clean up
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        },

        fetchASNReport: async function (email) {
            debugger;
            const that = this; // Preserve the reference to the controller

            sap.ui.core.BusyIndicator.show();
            try {
                // Make a request to your custom Node.js backend to get the CSRF token and DA list
                const response = await $.ajax({
                    url: "/nodeapp/ASNReport",     // Your custom backend route
                    method: "GET",              // Use GET since you're retrieving data         
                    contentType: "application/json",
                    data: { email: email }   // Send the email as a query parameter
                });
                // Success handling
                sap.ui.core.BusyIndicator.hide();  // Hide the busy indicator on success

                // Process the response to get the tokens and DA list                
                const AsnRepData = response;        // Extract DA list data
                debugger;
                // Handle the DA list (e.g., bind to a model or display in a view)
                const oJsonModel = new sap.ui.model.json.JSONModel(AsnRepData);
                that.getView().setModel(oJsonModel, "asnRep");

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