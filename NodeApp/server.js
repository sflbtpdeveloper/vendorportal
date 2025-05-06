const express = require("express");                      // Provides a framework for creating the app and routes
const { JWTStrategy } = require("@sap/xssec");           //Provides functionality for working with SAP's XSUAA
const xsenv = require("@sap/xsenv");                     //Loads environment variables, including service credentials, which are usually required to authenticate against SAP services.
const passport = require("passport");                    //for user authentication in Node.js applications
const app = express();                                   //Sets up an Express application (app)
const { XssecPassportStrategy, XsuaaService } = require("@sap/xssec"); //handle JWT (JSON Web Token) authentication, which is typically used with SAP Cloud services to validate user identity based on tokens.
const approuter = require('@sap/approuter');            //acts as a reverse proxy and handles routing between frontend applications and backend services, with features for authentication, authorization, and routing.
const router = express.Router();                        //define routes and handle HTTP requests.
const csurf = require('csurf');                          //Adds CSRF (Cross-Site Request Forgery) protection to the application by generating and validating CSRF tokens
const cookieParser = require('cookie-parser');          // Middleware that parses cookies attached to the client request objects.
const axios = require("axios");                         //A promise-based HTTP client for making requests to external APIs or services.
const SapCfAxios = require("sap-cf-axios").default;     //A wrapper for Axios designed specifically for Cloud Foundry, allowing easy interaction with SAP services that use destinations defined in the SAP Cloud.
const session = require('express-session');             //  Middleware for session management, which keeps track of user sessions on the server. This is often used to persist user login information across multiple requests.
const jwt = require("jsonwebtoken");                    //Used to handle JWTs, allowing the application to generate and verify tokens, typically for authentication purposes
const crypto = require("crypto");                       // generating secure tokens, hashing data, or encrypting/decrypting information
// const session = require("express-session");     // to enable session management.
const bodyParser = require('body-parser');


// Set body-parser limit to handle larger payloads
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use(express.json({ limit: "50mb" })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));


const PORT = process.env.PORT || 8082;

const axios1 = SapCfAxios("SFD_HTTPS");

//---------------------------------------------------------------------
//  fetch data for getting Vendor Details 
//---------------------------------------------------------------------

app.get("/vendor", async (req, res) => {
  const email = req.query.email;
  try {
    const response = await axios1({
      method: "GET",
      url: "/sap/opu/odata/sap/ZMM_SUBCON_VENDORS_SRV/ZET_VENDORSSet",
      params: {
        $format: "json",
        $filter: `Email eq '${email}'`,
        "sap-client": "999"
      },
      headers: {
        "content-type": "application/json"
      }
    });

    res.status(200).send(response.data.d.results);

  } catch (error) {
    console.error("Error in vendrodata:", error); // Log the error for debugging
    console.error("Error details:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      headers: error.response?.headers,
      data: error.response?.data, // Body of the error response (may contain more details)
      config: error.config, // The config for the request made
    });
    res.status(error.response?.status || 500).send({
      message: error.message,
      errorDetails: error.response?.data || "Unknown error occurred"
    });

  }
});

//---------------------------------------------------------------------
//  fetch data for Subcontract DA Report
//---------------------------------------------------------------------

app.get("/dalist", async (req, res) => {
  const email = req.query.email;
  console.log("dalist has been hitted", email);

  try {
    const response = await axios1({
      method: "GET",
      url: "/sap/opu/odata/sap/ZMM_SUBCON_DA_SRV/zet_da_listSet",
      params: {
        $format: "json",
        $filter: `Email eq '${email}'`,
        "sap-client": "999"
      },
      headers: {
        "content-type": "application/json"
      }
    });

    // Process the fetched data to add the "noOfDays" field
    const today = new Date(); // Current date
    const processedData = response.data.d.results.map(item => {
      if (item.Exdat) {
        const dcDate = item.Exdat; // Convert `dcdate` to a Date object 20241126
        const isoDate = convertToISOFormat(dcDate);
        
        const timeDifference = today - new Date(isoDate); // Difference in milliseconds
        const noOfDays = Math.floor(timeDifference / (1000 * 60 * 60 * 24)); // Convert to days
        item.noOfDays = noOfDays; // Add the calculated field
        console.error("today", today);
        console.error("item.dcDate", dcDate);
        console.error("timeDifference", timeDifference);
        console.error("item.dcDate", noOfDays);
      } else {
        item.noOfDays = null; // Handle missing or invalid `dcdate`
      }
      return item; // Return the modified item
    });

    // res.status(200).send(response.data.d.results);
    res.status(200).send(processedData);

  } catch (error) {
    console.error("Error in datest:", error); // Log the error for debugging
    console.error("Error details:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      headers: error.response?.headers,
      data: error.response?.data, // Body of the error response (may contain more details)
      config: error.config, // The config for the request made
    });
    res.status(error.response?.status || 500).send({
      message: error.message,
      errorDetails: error.response?.data || "Unknown error occurred"
    });

  }
});

//---------------------------------------------------------------------
//  fetch data for Subcontract DA Report
//---------------------------------------------------------------------

app.get("/asselist", async (req, res) => {
  const email = req.query.email;
  console.log("asselist has been hitted", email);

  try {
    const response = await axios1({
      method: "GET",
      url: "/sap/opu/odata/sap/ZMM_SUBCON_DA_SRV/zet_asse_listSet",
      params: {
        $format: "json",
        $filter: `Email eq '${email}'`,
        "sap-client": "999"
      },
      headers: {
        "content-type": "application/json"
      }
    });

    // Process the fetched data to add the "noOfDays" field
    const today = new Date(); // Current date
    const processedData = response.data.d.results.map(item => {
      if (item.Exdat) {
        const dcDate = item.Exdat; // Convert `dcdate` to a Date object 20241126
        const isoDate = convertToISOFormat(dcDate);
        
        const timeDifference = today - new Date(isoDate); // Difference in milliseconds
        const noOfDays = Math.floor(timeDifference / (1000 * 60 * 60 * 24)); // Convert to days
        item.noOfDays = noOfDays; // Add the calculated field
        console.error("today", today);
        console.error("item.dcDate", dcDate);
        console.error("timeDifference", timeDifference);
        console.error("item.dcDate", noOfDays);
      } else {
        item.noOfDays = null; // Handle missing or invalid `dcdate`
      }
      return item; // Return the modified item
    });

    // res.status(200).send(response.data.d.results);
    res.status(200).send(processedData);

  } catch (error) {
    console.error("Error in datest:", error); // Log the error for debugging
    console.error("Error details:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      headers: error.response?.headers,
      data: error.response?.data, // Body of the error response (may contain more details)
      config: error.config, // The config for the request made
    });
    res.status(error.response?.status || 500).send({
      message: error.message,
      errorDetails: error.response?.data || "Unknown error occurred"
    });

  }
});

const convertToISOFormat = (dcDate) => {
  // Extract year, month, and day from the yyyymmdd string
  const year = dcDate.substring(0, 4);
  const month = dcDate.substring(4, 6); // Month is already in 1-indexed format
  const day = dcDate.substring(6, 8);

  // Create a Date object
  const dateObj = new Date(`${year}-${month}-${day}T00:00:00Z`); // Add time and Z for UTC

  // Format it to ISO string
  return dateObj.toISOString();
};
//---------------------------------------------------------------------
//  fetch data for Change Material Popup
//---------------------------------------------------------------------
app.get("/changemat", async (req, res) => {
  const ip_matnr = req.query.ip_matnr;  
  const ebeln = req.query.ebeln;
  const ebelp = req.query.ebelp;
  const lifnr = req.query.lifnr;
  const werks = req.query.werks;
  
  try {
    // Construct the $filter parameter
    let filter = `Ebeln eq '${ebeln}'`;
    if (ebelp) {
      filter += ` and Ebelp eq '${ebelp}'`;
    }
    if (ip_matnr) {
      filter += ` and Ip_Matnr eq '${ip_matnr}'`;
    }
    if (werks) {
      filter += ` and Werks eq '${werks}'`;
    }
    if (lifnr) {
      filter += ` and Lifnr eq '${lifnr}'`;
    }    

    console.log("Constructed $filter:", filter);
      
    const response = await axios1({
      method: "GET",
      url: "/sap/opu/odata/sap/ZMM_SUBCON_DA_SRV/zet_chg_matSet",
      params: {
        $format: "json",        
        $filter: filter,
        "sap-client": "999"
      },
      headers: {
        "content-type": "application/json"
      }
    });

    res.status(200).send(response.data.d.results);

  } catch (error) {
    console.error("Error in asnstatus:", error); // Log the error for debugging
    console.error("Error details:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      headers: error.response?.headers,
      data: error.response?.data, // Body of the error response (may contain more details)
      config: error.config, // The config for the request made
    });
    res.status(error.response?.status || 500).send({
      message: error.message,
      errorDetails: error.response?.data || "Unknown error occurred"
    });

  }
});

//---------------------------------------------------------------------
//  fetch data for ASN Status Report
//---------------------------------------------------------------------

app.get("/asnstatus", async (req, res) => {
  const email = req.query.email;
  try {
    const response = await axios1({
      method: "GET",
      url: "/sap/opu/odata/sap/ZMM_SUBCON_ASN_CR_SRV/ZET_ASN_STATSet",
      params: {
        $format: "json",
        $filter: `Email eq '${email}'`,
        "sap-client": "999"
      },
      headers: {
        "content-type": "application/json"
      }
    });

    res.status(200).send(response.data.d.results);

  } catch (error) {
    console.error("Error in asnstatus:", error); // Log the error for debugging
    console.error("Error details:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      headers: error.response?.headers,
      data: error.response?.data, // Body of the error response (may contain more details)
      config: error.config, // The config for the request made
    });
    res.status(error.response?.status || 500).send({
      message: error.message,
      errorDetails: error.response?.data || "Unknown error occurred"
    });

  }
});


//---------------------------------------------------------------------
//  fetch data for ASN Delete Report
//---------------------------------------------------------------------

app.get("/asndelete", async (req, res) => {
  const email = req.query.email;
  try {
    const response = await axios1({
      method: "GET",
      url: "/sap/opu/odata/sap/ZMM_SUBCON_ASN_CR_SRV/ZET_ASN_CRTSet",
      params: {
        $format: "json",
        $filter: `Email eq '${email}'`,
        "sap-client": "999"
      },
      headers: {
        "content-type": "application/json"
      }
    });

    res.status(200).send(response.data.d.results);

  } catch (error) {
    console.error("Error in asnstatus:", error); // Log the error for debugging
    console.error("Error details:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      headers: error.response?.headers,
      data: error.response?.data, // Body of the error response (may contain more details)
      config: error.config, // The config for the request made
    });
    res.status(error.response?.status || 500).send({
      message: error.message,
      errorDetails: error.response?.data || "Unknown error occurred"
    });

  }
});


//---------------------------------------------------------------------
//  fetch data for Supplier Po List Report
//---------------------------------------------------------------------

app.get("/supplierPO", async (req, res) => {
  const email = req.query.email;
  try {
    const response = await axios1({
      method: "GET",
      url: "/sap/opu/odata/sap/YMM_SUPPLIER_PO_SRV/YMM_SUPPLIER_PO_ITEMSSet",
      params: {
        $format: "json",
        $filter: `Email eq '${email}'`,
        "sap-client": "999"
      },
      headers: {
        "content-type": "application/json"
      }
    });

    res.status(200).send(response.data.d.results);

  } catch (error) {
    console.error("Error in supplierPO:", error); // Log the error for debugging
    console.error("Error details:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      headers: error.response?.headers,
      data: error.response?.data, // Body of the error response (may contain more details)
      config: error.config, // The config for the request made
    });
    res.status(error.response?.status || 500).send({
      message: error.message,
      errorDetails: error.response?.data || "Unknown error occurred"
    });

  }
});


//---------------------------------------------------------------------
//  fetch data for Supplier Po Detail Report
//---------------------------------------------------------------------

app.get("/supplierPODetail", async (req, res) => {
  const email = req.query.email;
  try {
    const response = await axios1({
      method: "GET",
      url: "/sap/opu/odata/sap/YMM_SUPPLIER_PO_SRV/YMM_SUPPLIER_PO_ASNSet",
      params: {
        $format: "json",
        $filter: `Email eq '${email}'`,
        "sap-client": "999"
      },
      headers: {
        "content-type": "application/json"
      }
    });

    res.status(200).send(response.data.d.results);

  } catch (error) {
    console.error("Error in supplierPODetail:", error); // Log the error for debugging
    console.error("Error details:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      headers: error.response?.headers,
      data: error.response?.data, // Body of the error response (may contain more details)
      config: error.config, // The config for the request made
    });
    res.status(error.response?.status || 500).send({
      message: error.message,
      errorDetails: error.response?.data || "Unknown error occurred"
    });

  }
});


//---------------------------------------------------------------------
//  fetch data for Supplier ASN Report
//---------------------------------------------------------------------

app.get("/ASNReport", async (req, res) => {
  const email = req.query.email;
  try {
    const response = await axios1({
      method: "GET",
      url: "/sap/opu/odata/sap/YMM_SUPPLIER_PO_SRV/YMM_SUPPLIER_PO_ASN_REPSet",
      params: {
        $format: "json",
        $filter: `Email eq '${email}'`,
        "sap-client": "999"
      },
      headers: {
        "content-type": "application/json"
      }
    });

    res.status(200).send(response.data.d.results);

  } catch (error) {
    console.error("Error in supplierPODetail:", error); // Log the error for debugging
    console.error("Error details:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      headers: error.response?.headers,
      data: error.response?.data, // Body of the error response (may contain more details)
      config: error.config, // The config for the request made
    });
    res.status(error.response?.status || 500).send({
      message: error.message,
      errorDetails: error.response?.data || "Unknown error occurred"
    });

  }
});


//---------------------------------------------------------------------
//  fetch data for Supplier ASN Delete
//---------------------------------------------------------------------

app.get("/SupASNDel", async (req, res) => {
  const email = req.query.email;
  try {
    const response = await axios1({
      method: "GET",
      url: "/sap/opu/odata/sap/YMM_SUPPLIER_PO_SRV/YMM_SUPPLIER_PO_ASN_DELSet",
      params: {
        $format: "json",
        $filter: `Email eq '${email}'`,
        "sap-client": "999"
      },
      headers: {
        "content-type": "application/json"
      }
    });

    res.status(200).send(response.data.d.results);

  } catch (error) {
    console.error("Error in supplierASNDelete:", error); // Log the error for debugging
    console.error("Error details:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      headers: error.response?.headers,
      data: error.response?.data, // Body of the error response (may contain more details)
      config: error.config, // The config for the request made
    });
    res.status(error.response?.status || 500).send({
      message: error.message,
      errorDetails: error.response?.data || "Unknown error occurred"
    });

  }
});


//---------------------------------------------------------------------
//  fetch data for checking machine is mandatory
//---------------------------------------------------------------------

app.get("/mandtmachine", async (req, res) => {
  const v_bukrs = req.query.bukrs;
  const v_werks = req.query.werks;
  try {
    const response = await axios1({
      method: "GET",
      url: "/sap/opu/odata/sap/ZMM_SUBCON_DA_SRV/ZDMRR_CUSSet",
      params: {
        $format: "json",
        $filter: `Bukrs eq '${v_bukrs}' and Werks eq '${v_werks}'`,
        "sap-client": "999"
      },
      headers: {
        "content-type": "application/json"
      }
    });
    const results = response.data.d.results;
    console.log('mandtmachine response is ', response);
    console.log('mandtmachine response.data.d.results is ', response.data.d.results);
    // res.status(200).send(response.data.d.results);  
    console.log('mandtmachine result is ', results);
    res.status(200).send(results);

  } catch (error) {
    console.error("Error in supplierPODetail:", error); // Log the error for debugging
    console.error("Error details:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      headers: error.response?.headers,
      data: error.response?.data, // Body of the error response (may contain more details)
      config: error.config, // The config for the request made
    });
    res.status(error.response?.status || 500).send({
      message: error.message,
      errorDetails: error.response?.data || "Unknown error occurred"
    });

  }
});

//---------------------------------------------------------------------
//  fetch data for Packge Type drop down
//---------------------------------------------------------------------

app.get("/packtype", async (req, res) => {
  try {
    const response = await axios1({
      method: "GET",
      url: "/sap/opu/odata/sap/YMM_SUPPLIER_PO_SRV/YMM_SUPPLIER_PO_BAGSet",
      params: {
        $format: "json",
        "sap-client": "999"
      },
      headers: {
        "content-type": "application/json"
      }
    });

    res.status(200).send(response.data.d.results);

  } catch (error) {
    console.error("Error in Package Type:", error); // Log the error for debugging
    console.error("Error details:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      headers: error.response?.headers,
      data: error.response?.data, // Body of the error response (may contain more details)
      config: error.config, // The config for the request made
    });
    res.status(error.response?.status || 500).send({
      message: error.message,
      errorDetails: error.response?.data || "Unknown error occurred"
    });

  }
});


//---------------------------------------------------------------------
//  fetch data for Machine List drop down
//---------------------------------------------------------------------

app.get("/machinelist", async (req, res) => {
  try {
    const response = await axios1({
      method: "GET",
      url: "/sap/opu/odata/sap/ZMM_SUBCON_DA_SRV/ZMVPMACHINESet",
      params: {
        $format: "json",
        "sap-client": "999"
      },
      headers: {
        "content-type": "application/json"
      }
    });

    res.status(200).send(response.data.d.results);

  } catch (error) {
    console.error("Error in Machine List:", error); // Log the error for debugging
    console.error("Error details:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      headers: error.response?.headers,
      data: error.response?.data, // Body of the error response (may contain more details)
      config: error.config, // The config for the request made
    });
    res.status(error.response?.status || 500).send({
      message: error.message,
      errorDetails: error.response?.data || "Unknown error occurred"
    });

  }
});

//---------------------------------------------------------------------
//fetch the service details from xsuaa service from sap btp cockpit
//---------------------------------------------------------------------
const services = xsenv.getServices({
  xsuaa: {
    name: 'sfd-xsuaa'  // Replace with your actual service name
  }
});
console.log("Retrieved XSUAA service details from SAP BTP Cockpit:", services);


app.use(session({
  secret: services.xsuaa.clientsecret, // Replace with a secure secret
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set secure: true if using HTTPS
}));

app.use(passport.session());

// Add JSON body parsing middleware
app.use(express.json());

const credentials = {

  "tenantmode": services.xsuaa.tenantid,
  "sburl": services.xsuaa.sburl,
  "subaccountid": services.xsuaa.subaccountid,
  "credential-type": services.xsuaa.credential,
  "clientid": services.xsuaa.clientid,
  "xsappname": services.xsuaa.xsappname,
  "clientsecret": services.xsuaa.clientsecret,
  "serviceInstanceId": services.xsuaa.serviceInstanceId,
  "url": services.xsuaa.url,
  "uaadomain": services.xsuaa.uaadomain,
  "verificationkey": services.xsuaa.verificationkey,
  "apiurl": services.xsuaa.apiurl,
  "identityzone": services.xsuaa.identityzone,
  "identityzoneid": services.xsuaa.identityzoneid,
  "tenantid": services.xsuaa.tenantid,
  "zoneid": services.xsuaa.zoneid
};

console.log("Retrieved credentials from XSUAA service:", credentials);

//---------------------------------------------------------------------
// Test purpose - sample 
//---------------------------------------------------------------------
app.get("/", (req, res, next) => {
  console.log("Root endpoint hit");
  res.send("Welcome to TVS Next")
});


//---------------------------------------------------------------------
//integrating SAP's XSUAA (XS User Account and Authentication) service
// with the Passport.js authentication middleware
//---------------------------------------------------------------------
const authService = new XsuaaService(credentials)
passport.use(new XssecPassportStrategy(authService));

//---------------------------------------------------------------------
//initializes Passport middleware in your Express application
//adds req.user to the request object, 
//which will hold the authenticated user's information if the user is logged in
// should be placed before any routes that require authentication,
// as it prepares Passport to authenticate requests later on
//---------------------------------------------------------------------

app.use(passport.initialize());
// Custom callback for passport.authenticate

// Protected route to retrieve user information
app.get("/userinfo", passport.authenticate("JWT", { session: false }), (req, res) => {
  // Access user information from req.user
  console.log("Authenticated user:", req.user);
  const { given_name, family_name, email } = req.user;

  console.log("User's given name:", given_name);
  console.log("User's family name:", family_name);
  console.log("User's email:", email);

  // Respond with user details
  res.json({ givenName: given_name, familyName: family_name, email });
});


// app.use((req, res, next) => {
//   console.log('Request headers:', req.headers);
//   next();
// });
//---------------------------------------------------------------------
//authenticate the user, allowing access to the protected resource
//if not logged in , using the link straightly it will show authentication failed message.
//---------------------------------------------------------------------

app.use((req, res, next) => {
  console.log("Authorization header:", req.headers.authorization);
  passport.authenticate("JWT", { session: false }, (err, user, info) => {
    if (err) {
      console.error("Authentication error:", err);
      return res.status(500).json({ message: "Internal server error during authentication." });
    }
    if (!user) {
      console.warn("Authentication failed info:", info);
      const errorMessage = (info && info.message) ? info.message : "Authentication failed";
      console.warn("Authentication failed:", errorMessage);
      return res.status(401).json({ message: errorMessage });
    }
    // If successful
    console.log("Authentication successful for user:", user);

    // Attach user to the request object for further use
    req.user = user;
    next();
  })(req, res, next);
});
//---------------------------------------------------------------------
// New endpoint to get user email
//---------------------------------------------------------------------
app.get("/email", (req, res) => {
  // console.log('Authorization info:', req.authInfo);
  // const email = req.authInfo.getEmail();  // Get the email from the token
  const email = req.user?.email;
  if (email) {
    res.json({ email });
  } else {
    res.status(400).json({ message: "Email not found in the authentication token." });
  }
});


app.get("/user", passport.authenticate("JWT", { session: false }), (req, res, next) => {
  const idUser = req.user.id;
  console.log("id of the user is ", idUser);
  res.send({ idUser });
});

app.use(cookieParser());  // To handle cookies

//---------------------------------------------------------------------
// to check scope
//---------------------------------------------------------------------
// function checkScope(req, res, next){
//   if (req.authInfo.checkLocalScope("read")){
//    next();
//   }else{    

//     res.status(403).end("you are not allowed by me");
//   }
// }

//---------------------------------------------------------------------
// Example endpoint to check scope and allow access only for Admins
//---------------------------------------------------------------------
app.get("/scope", (req, res) => {
  console.log('Authorization info:', req.authInfo);
  // if (req.authInfo.checkLocalScope("read")) {
  //   res.send("Scope is Read - you have access");
  // } else {
  //   res.status(403).send("Forbidden - Read scope is required");
  // }
});
//---------------------------------------------------------------------
//returns detailed information about the authenticated user and the XSUAA service configuration. 
//---------------------------------------------------------------------
app.get("/info", (req, res) => {
  if (req.authInfo) {
    res.json({
      email: req.authInfo.getEmail(),
      scopes: req.authInfo.scopes,
      token: req.authInfo.getAppToken(),
      userAttributes: req.authInfo.getAttribute("userAttributes"),  // Example for custom attributes
      // Include any other available details from authInfo

      xsuaaServiceDetails: {
        tenantmode: services.xsuaa.tenantid,
        sburl: services.xsuaa.sburl,
        subaccountid: services.xsuaa.subaccountid,
        credentialType: services.xsuaa.credential,
        clientid: services.xsuaa.clientid,
        xsappname: services.xsuaa.xsappname,
        serviceInstanceId: services.xsuaa.serviceInstanceId,
        url: services.xsuaa.url,
        uaadomain: services.xsuaa.uaadomain,
        apiurl: services.xsuaa.apiurl,
        identityzone: services.xsuaa.identityzone,
        identityzoneid: services.xsuaa.identityzoneid,
        tenantid: services.xsuaa.tenantid,
        zoneid: services.xsuaa.zoneid
      }
    });
  } else {
    res.status(400).json({ message: "No authentication information available." });
  }
});

//---------------------------------------------------------------------
// to serve static files from the webapp directory
//---------------------------------------------------------------------
// Static content (optional)
app.use("/", express.static("webapp/"));


// Import necessary modules

//---------------------------------------------------------------------
// Helper function to generate CSRF token
//---------------------------------------------------------------------
let csrfTokens = {};
// const csrfProtection = csurf({ cookie: true });
// app.use(csrfProtection);

function generateCsrfToken() {
  return crypto.randomBytes(32).toString("hex");
}

//---------------------------------------------------------------------
// Middleware to return CSRF token in headers for "GET" or "HEAD" requests
//---------------------------------------------------------------------
// app.use((req, res, next) => {
//   if (req.method === 'HEAD' || req.method === 'GET') {
//     res.set('X-CSRF-Token', req.csrfToken());  // Send CSRF token in response headers
//   }
//   next();
// });


//---------------------------------------------------------------------
// Fetch CSRF token for logout
//---------------------------------------------------------------------
app.get("/custom/logout", passport.authenticate("JWT", { session: false }), (req, res) => {
  const csrfToken = generateCsrfToken();
  csrfTokens[req.user.id] = csrfToken;  // Store token in memory (or session)

  // Send CSRF token to client
  res.setHeader('x-csrf-token', csrfToken);
  res.status(200).send({ message: "CSRF token generated." });
});

//---------------------------------------------------------------------
// POST logout endpoint with token revocation and CSRF validation
//---------------------------------------------------------------------
app.post("/custom/logout", passport.authenticate("JWT", { session: false }), async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const csrfToken = req.headers['x-csrf-token'];
  // Validate CSRF token
  if (!csrfToken || csrfToken !== csrfTokens[req.user.id]) {
    return res.status(403).json({ message: "CSRF token invalid or missing." });
  }
  // Revoke OAuth token (using XSUAA API)
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided." });
  }
  try {
    await revokeToken(token).then(() => {
      // Clear session or token information      
      req.logout();  // If using session-based authentication    
      res.clearCookie('authToken');  // Clear the authentication token
      res.clearCookie('JSESSIONID');  // Clear any session cookies
      res.clearCookie('sap-xsrf-token');  // Clear XSRF token if applicable      
      req.session.destroy();
      // res.redirect('/logout.html'); // Redirect to logout page
      res.json({ message: "Logged out successfully." });
    })
      .catch(err => {
        console.error('Failed to revoke token:', err);
        // res.redirect('/error.html'); // Handle error appropriately
      });
  } catch (error) {
    console.error("Token revocation failed:", error);
    res.status(500).json({ message: "Failed to revoke token." });
  }
});

//---------------------------------------------------------------------
// Function to revoke the token (using SAP XSUAA API)
//---------------------------------------------------------------------
async function revokeToken(token) {
  const revokeUrl = `${services.xsuaa.apiurl}/oauth/revoke`;  // XSUAA revoke endpoint
  await fetch(revokeUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({ token })
  });
  if (!response.ok) {
    throw new Error('Token revocation failed');
  } else
    console.log('Token revoked successfully:');
}

//---------------------------------------------------------------------
// Middleware to check user role
//---------------------------------------------------------------------
function checkRoleAndScope(role, scope) {
  return (req, res, next) => {
    console.log("User Roles:", req.authInfo && req.authInfo.roles);
    console.log("User Scopes:", req.authInfo && req.authInfo.scopes);

    const userRoles = req.authInfo && req.authInfo.roles || [];
    const userScopes = req.authInfo && req.authInfo.scopes || []; // Get the user scopes

    // Log for debugging
    console.log("User Roles:", userRoles);
    console.log("User Scopes:", userScopes);


    // Check if the user has the required role
    if (!userRoles || !userRoles.includes(role)) {
      return res.status(403).send("Access denied: Insufficient role");
    }

    // Check if the user has the required scope
    if (!userScopes || !userScopes.includes(scope)) {
      return res.status(403).send("Access denied: Insufficient scope");
    }

    return next(); // User has both required role and scope
  };
}
//---------------------------------------------------------------------
// Set up session handling (adjust according to your session management strategy)
//---------------------------------------------------------------------
app.use(session({
  secret: crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 6 * 60 * 60 * 1000 } // 6 hours session timeout
}));

app.get("/refreshSession", passport.authenticate("JWT", { session: false }), (req, res) => {
  const csrfToken = generateCsrfToken();
  csrfTokens[req.user.id] = csrfToken;  // Store token in memory (or session)
  req.session.csrfToken = csrfToken;
  // Send CSRF token to client
  res.setHeader('x-csrf-token', csrfToken);
  res.status(200).send({ message: "CSRF token generated." });
});
//---------------------------------------------------------------------
// Middleware to load environment variables and handle authentication
//---------------------------------------------------------------------
app.post("/refreshSession", passport.authenticate('JWT', { session: false }), (req, res) => {

  const csrfTokenFromClient = req.headers["x-csrf-token"];
  const storedCsrfToken = req.session.csrfToken;  // Retrieve the token from the session

  // Validate the CSRF token
  if (csrfTokenFromClient !== storedCsrfToken) {
    return res.status(403).send({ message: "Invalid CSRF token." });
  }

  res.status(200).json({
    message: 'Session refreshed',
    newExpiryTime: new Date(Date.now() + 6 * 60 * 60 * 1000) // Extend the session for 6 more hours
  });
});


//---------------------------------------------------------------------
// Fetch CSRF token for ASN CREATION
//---------------------------------------------------------------------
// app.get("/custom/asncreate", passport.authenticate("JWT", { session: false }), async (req, res) => {
//   // const csrfToken = generateCsrfToken();
//   // const userId = req.user.id;
//   // const jwtToken = req.user.token;
//   // const csrfResponse = await fetchCsrfToken(jwtToken );
//   console.log("Hitting - node server GET call");
//   const csrfResponse = await axios1({
//     method: "GET",
//     url: "/sap/opu/odata/sap/ZMM_SUBCON_ASN_CR_SRV/",
//     headers: {
//       'x-csrf-token': 'Fetch',  // Request a new CSRF token      
//       "content-type": "application/json",
//       "sap-client": "999",
//       // 'Authorization': `Bearer ${jwtToken}`
//     },
//     withCredentials: true
//   });

//   const csrfToken = csrfResponse.headers['x-csrf-token']; // Get the CSRF token from response headers  
//   if (!csrfToken) {
//     console.error("CSRF Token not found in OData response headers.");
//     return res.status(403).json({ message: "Failed to retrieve CSRF token from OData service." });
//   }

//   // csrfTokens[userId] = csrfToken;
//   // console.log(`CSRF Token generated for user ${userId}:`, csrfToken);
//   // console.log(`jwt Token generated for user ${userId}:`, req.user.token);

//   // console.log(`CSRF Token generated:`, csrfToken);
//   // console.log(`JWT Token generated:`, req.user.token);

//   // Send CSRF token to client
//   res.setHeader('x-csrf-token', csrfToken);
//   res.status(200).send({ message: "CSRF token generated.", csrfToken: csrfToken });
// });

//---------------------------------------------------------------------
// POST ASN CREATION endpoint with token revocation and CSRF validation
//---------------------------------------------------------------------
app.post("/custom/asnpost", passport.authenticate("JWT", { session: false }), async (req, res) => {
  console.log("Hitting - node server post call");
  console.log("asnpost req details", req);
  const records = req.body
  console.log("Data being sent to OData service befor get call:", records);


  const csrfResponse = await axios1({
    method: "GET",
    url: "/sap/opu/odata/sap/ZMM_SUBCON_ASN_CR_SRV/",
    headers: {
      'x-csrf-token': 'Fetch',  // Request a new CSRF token      
      "content-type": "application/json",
      "sap-client": "999",      
      // 'Authorization': `Bearer ${jwtToken}`
    },
    withCredentials: true
  });
  const cookies = csrfResponse.headers['set-cookie'];
  console.log("Set-Cookie headers:", cookies);
  console.log("CSRF Response Headers:", csrfResponse.headers);
  console.log("Request Headers:", req.headers);
  console.log("Request User :", req.user);
  const csrfToken = csrfResponse.headers['x-csrf-token'];
  const data = req.body
  console.log("Data being sent to OData service:", data);
  const token = req.headers.authorization?.split(' ')[1];
  // const csrfToken = req.headers['x-csrf-token'];
  const storedToken = csrfTokens[req.user.id];
  console.log("Received JWT Token (Server-side):", token);
  console.log("Received CSRF Token (Server-side):", csrfToken);  // Log the token from request
  console.log("Expected CSRF Token (Server-side):", storedToken);

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided." });
  }
  try {
    const response = await axios1({
      method: "POST",
      url: "/sap/opu/odata/sap/ZMM_SUBCON_ASN_CR_SRV/ZET_ASN_CRTSet",
      headers: {
        'X-CSRF-Token': csrfToken,
        "content-type": "application/json; charset=UTF-8",
        "sap-client": "999",        
        'Authorization': `Bearer ${token}`,
        'Cookie': cookies.join('; ')
      },
      data: data,
      withCredentials: true
    });
    res.status(200).json(response.data);
    console.log("response data :", response.data);    
  } catch (error) {
    // console.error("CSRF token expired, refreshing token and retrying...");      
    const detailedErrorMessage = {
      message: "Error calling SAP OData service",
      status: error.response ? error.response.status : "N/A",
      statusText: error.response ? error.response.statusText : "N/A",
      data: error.response ? error.response.data : null,
      request: {
        method: error.request ? error.request.method : "N/A",
        url: error.request ? error.request.url : "N/A",
        headers: error.request ? error.request.headers : {},
      },
      originalError: error.message // Keep the original error message
    };

    console.error("Detailed Error:", JSON.stringify(detailedErrorMessage, null, 2));
    res.status(500).json({ message: "Failed to call SAP OData service.", error: detailedErrorMessage });

  }
});



//---------------------------------------------------------------------
// POST SUPPLIER ASN CREATION endpoint with token revocation and CSRF validation
//---------------------------------------------------------------------
app.post("/custom/supasnpost", passport.authenticate("JWT", { session: false }), async (req, res) => {
  console.log("Hitting - node server post call");
  console.log("asnpost req details", req);
  const records = req.body
  console.log("Data being sent to OData service befor get call:", records);

  const csrfResponse = await axios1({
    method: "GET",
    url: "/sap/opu/odata/sap/YMM_SUPPLIER_PO_SRV/",
    headers: {
      'x-csrf-token': 'Fetch',  // Request a new CSRF token      
      "content-type": "application/json",
      "sap-client": "999",
      // 'Authorization': `Bearer ${jwtToken}`
    },
    withCredentials: true
  });
  const cookies = csrfResponse.headers['set-cookie'];
  console.log("Set-Cookie headers:", cookies);
  console.log("CSRF Response Headers:", csrfResponse.headers);
  console.log("Request Headers:", req.headers);
  console.log("Request User :", req.user);
  const csrfToken = csrfResponse.headers['x-csrf-token'];
  const data = req.body
  console.log("Data being sent to OData service:", data);
  const token = req.headers.authorization?.split(' ')[1];
  // const csrfToken = req.headers['x-csrf-token'];
  const storedToken = csrfTokens[req.user.id];
  console.log("Received JWT Token (Server-side):", token);
  console.log("Received CSRF Token (Server-side):", csrfToken);  // Log the token from request
  console.log("Expected CSRF Token (Server-side):", storedToken);

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided." });
  }
  try {
    const response = await axios1({
      method: "POST",
      url: "/sap/opu/odata/sap/YMM_SUPPLIER_PO_SRV/YMM_SUPPLIER_POSet",
      headers: {
        'X-CSRF-Token': csrfToken,
        "content-type": "application/json; charset=UTF-8",
        "sap-client": "999",
        'Authorization': `Bearer ${token}`,
        'Cookie': cookies.join('; ')
      },
      data: data,
      withCredentials: true
    });
    res.status(200).json(response.data);
    console.log("response data :", response.data);

  } catch (error) {
    // console.error("CSRF token expired, refreshing token and retrying...");      
    const detailedErrorMessage = {
      message: "Error calling SAP OData service",
      status: error.response ? error.response.status : "N/A",
      statusText: error.response ? error.response.statusText : "N/A",
      data: error.response ? error.response.data : null,
      request: {
        method: error.request ? error.request.method : "N/A",
        url: error.request ? error.request.url : "N/A",
        headers: error.request ? error.request.headers : {},
      },
      originalError: error.message // Keep the original error message
    };

    console.error("Detailed Error:", JSON.stringify(detailedErrorMessage, null, 2));
    res.status(500).json({ message: "Failed to call SAP OData service.", error: detailedErrorMessage });

  }
});

//---------------------------------------------------------------------
// Start the app
//---------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});