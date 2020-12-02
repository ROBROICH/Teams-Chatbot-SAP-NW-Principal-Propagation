// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

var https = require('https');
var querystring = require('querystring');
var myProductId = null;

// Constants
// The path to the Azure AD
const PATH_OAUTH = '/%AADTenantID%/oauth2/token';
// JWT-Bearer token grant type
const GRANT_TYPE_VALUE_JWT_BEARER = 'urn:ietf:params:oauth:grant-type:jwt-bearer';
// On behalf of grant type
const REQUESTED_TOKEN_USE_VALUE = 'on_behalf_of';
// Token type SAM2
const REQUESTED_TOKEN_TYPE_SAML = 'urn:ietf:params:oauth:token-type:saml2';
// Token type SAML bearer
const REQUESTED_TOKEN_TYPE_SAML_BEARER = 'urn:ietf:params:oauth:grant-type:saml2-bearer';
// MIME type OData
const MIME_TYPE_JSON = 'application/json;odata=verbose';
// SAP cookie
const SAP_CLIENT_COOKIE = 'sap-usercontext=sap-client=001';
// String token to replace the tenant ID
const STRING_REPLACE_TENANT = '%AADTenantID%';

const HEADER_URL_ENCODED = 'application/x-www-form-urlencoded';
/**     Basic client fpr SAP Netweaver(NW) that implements principal propagation from Azure AD to SAP NW
*       After authorizing a SAP NW OData service is consumed
*       Configuration properties are maintained in the .env file
 **/
class SimpleSAPNWODataClient {
    constructor() {
        this.URL = 'login.microsoftonline.com';

        // ClientId from .env file
        this.clientId = process.env.clientId;
        // ClientSecret from .env file
        this.clientSecret = process.env.clientSecret;
        // scope from .env file
        this.scope = process.env.scope;
        // ressourceName from .env file
        this.ressourceName = process.env.ressourceName;
        // AzureAD from .env file
        this.tenantID = process.env.tenantID;

        this.stringReplace = STRING_REPLACE_TENANT;
    }

    async getSAPNWODataStepOne(assertionValue, productId) {
        // Path to get OAuth token for passed assertion value
        this.servicePath = PATH_OAUTH.replace(this.stringReplace, this.tenantID);
        myProductId = productId;

        var postData = querystring.stringify({
            // The assertion passed from Teams OAuth control
            assertion: assertionValue,
            // JWT BEARER
            grant_type: GRANT_TYPE_VALUE_JWT_BEARER,
            // Client of the created app
            client_id: this.clientId,
            // secret of the created app
            client_secret: this.clientSecret,
            // The NW server
            resource: this.ressourceName,
            // Token use: on_behalf of
            requested_token_use: REQUESTED_TOKEN_USE_VALUE,
            // Requested token type: SAML2
            requested_token_type: REQUESTED_TOKEN_TYPE_SAML
        });

        // Represents step two in Postman. Step one in Postman is done via the Teams OAUTH_PROMP in the file userProfileDialog and passed to this function as assertionValue.
        // The assertion is passed to the OAUTH endpoint of the app and gets a Bearer access_token as return
        var getBearerAccessTokenFromAD = function(assertionValue, servicePath, url, postData) {
            // See Java-Sript Promise handling:
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
            return new Promise(function(resolve, reject) {
                var options = {
                    host: url,
                    port: 443,
                    method: 'POST',
                    path: servicePath,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Content-Length': postData.length
                    }
                };

                // The HTTP request
                var req = https.request(options, function(res) {
                    var result = '';

                    res.on('data', function(chunk) {
                        result += chunk;
                    });
                    res.on('end', function() {
                        console.log(result);
                        // Success and we only return the access_token from JSON
                        resolve((JSON.parse(result).access_token));
                    });
                    res.on('error', function(err) {
                        console.log(err);
                        reject(new Error(err));
                    });
                });

                // req error
                req.on('error', function(err) {
                    console.log(err);
                });

                // send request witht the postData form
                req.write(postData);
                req.end();
            });
        };

        // See Java-Sript Promise handling:
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
        var resultSet = await getBearerAccessTokenFromAD(assertionValue, this.servicePath, this.URL, postData).then(this.getSAPNWODataStepTwo);
        return resultSet;
    }

    async getSAPNWODataStepTwo(bearerToken) {
        // HTTP function to call the SAP NW OData service with final bearer token granted by SAP NW
        // See Postman step 4
        var getFromSAPODataService = function(token) {
            return new Promise((resolve, reject) => {
                const authType = 'Bearer';
                // The final bearer token granted by SAP NW
                const bearerToken = token;
                // The URL to the SAP NW OData service
                const URL = process.env.sapURL;
                // The path to the SAP NW OData service
                const servicePath = process.env.sapPathOData;
                // The port to the SAP NW OData service
                const port = process.env.sapPort;

                // The dev system doesn't have signed cerificates.
                // Warning: Setting the NODE_TLS_REJECT_UNAUTHORIZED environment variable to '0' makes TLS connections and HTTPS requests insecure by disabling certificate verification.
                process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

                // Configure the HTTPS GET request
                https.get({
                    protocol: 'https:',
                    hostname: URL,
                    port: port,
                    path: servicePath,
                    headers: {
                        Authorization: authType + ' ' + bearerToken,
                        Cookie: querystring.stringify(SAP_CLIENT_COOKIE),
                        Accept: MIME_TYPE_JSON,
                        productid: myProductId //HT-1000
                    }
                },
                (response) => {
                    let body = '';
                    response.on('data', function(data) {
                        body += String(data);
                    });

                    response.on('end', function() {
                        // console.log(body);
                        // Success finally return the resultset
                        resolve(JSON.parse(body));
                    });
                }).on('error', (err) => {
                    console.log('Error: ' + err.message);
                    reject(new Error('Error: ' + err.message));
                });
            });
        };

        // Function that gets the Bearer token  granted from SAP
        // See Postman step 3
        var getBearerTokenFromXSUAA = function(bearerToken) {
            return new Promise(function(resolve, reject) {
                // The dev system doesn't have signed cerificates.
                // Warning: Setting the NODE_TLS_REJECT_UNAUTHORIZED environment variable to '0' makes TLS connections and HTTPS requests insecure by disabling certificate verification.
                process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

                // The SAP clientId and scope configured here:
                // https://github.com/azuredevcollege/SAP/blob/master/sap-oauth-saml-flow/SAPConfiguration/README.md#configure-client-in-sap
                const clientIdSAPUser = process.env.clientIdSAPUser;
                const scopeSAPBasicAuth = process.env.scopeSAPBasicAuth;

                // Body parameters for POST request.
                var postData = querystring.stringify({
                    assertion: bearerToken,
                    grant_type: REQUESTED_TOKEN_TYPE_SAML_BEARER
                });

                // The credentials of the SAP technical OAUTH user.
                // https://github.com/azuredevcollege/SAP/blob/master/sap-oauth-saml-flow/SAPConfiguration/README.md#generate-user
                var auth = 'Basic ' + Buffer.from(clientIdSAPUser + ':' + scopeSAPBasicAuth).toString('base64');

                // Configure the URI for the SAP OData service 
                const URL = process.env.sapXSUAAURL;
                const sapPathOAuthToken = process.env.sapPathOAuthToken;

                // request option
                var options = {
                    host: URL,
                    port: 443,
                    method: 'POST',
                    path: sapPathOAuthToken,
                    headers: {
                        'Content-Type': HEADER_URL_ENCODED,
                        'Content-Length': postData.length,
                        Authorization: auth
                    }

                };

                // request object
                var req = https.request(options, function(res) {
                    var result = '';
                    res.on('data', function(chunk) {
                        result += chunk;
                    });
                    res.on('end', function() {
                        console.log(result);
                        // Success and we only return the access_token from JSON
                        console.log("XSUAA:"+result)
                        resolve((JSON.parse(result).access_token));
                    });
                    res.on('error', function(err) {
                        console.log("getBearerTokenFromXSUAA:"+err);
                    });
                });

                // req error
                req.on('error', function(err) {
                    console.log(err);
                });

                // send request witht the postData form
                req.write(postData);
                req.end();
            });
        };

        // Return the Odata result set
        // See Java-Sript Promise handling:
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
        var resultSet = await getBearerTokenFromXSUAA(bearerToken).then(getFromSAPODataService);
        return resultSet;
    }
}

exports.SimpleSAPNWODataClient = SimpleSAPNWODataClient;
