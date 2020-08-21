# Hands-On Lab: Implementing a Node.JS client as Chatbot for achieving principal propagation between Azure and SAP Netweaver OData services 

# Introduction 
This hands-on lab demonstrates the implementation of a principal propagation, also known as OAuth2 SAML Bearer Assertion Flow, between Azure AD and SAP Netweaver(NW) OData-services. 
The scenario of this lab is the implementation of a basic Node.JS client as foundation to display the SAP OData service in Microsoft Teams using an Azure Bot. 

**In a nutshell:** 
*This scenario enables Azure developers to implement cloud-native Azure applications that are enabled to consume OData data-sources from SAP. This includes as well applying the SAP ABAP authorizations of the user-logged on to Azure AD and maintained in SAP NW.* 

*As a result, this approach allows to reuse existing SAP NW security, authorization- and role-concepts within Azure based applications like the Azure Bot demonstrated in this example.*

As prerequisite for leveraging this scenario, the relevant users for this scenario must be maintained in Azure AD and SAP ABAP with attributes that enable a mapping of the users from both systems. 

This for example can be achieved by [Automated user provisioning from SAP SuccessFactors]( https://techcommunity.microsoft.com/t5/azure-active-directory-identity/automated-user-provisioning-from-sap-successfactors-is-now-ga/ba-p/1257370)

# Development environment setup 
This lab is an extension of the existing [Microsoft & SAP Graph Chatbot]( https://github.com/ROBROICH/TEAMS-Chatbot-Microsoft-SAP-Graph) Hands-On Lab. 

The general setup of the development is described in the predecessor of this lab and hence it is recommended to implement the previous lab in case the development environment must be setup initially.

*The second essential prerequisite for implementing this lab is the configuration Azure Active Directory(AZ AD) and SAP Netwaver (SAP NW) to support the OAuth2 SAML Bearer Assertion Flow.*

This configuration of Azure AD and SAP NW in details is explained in a Azure Developer College repository, provided by the **German Microsoft One Commercial Partner(OCP) CSA team**. 

The full documentation can be found [here]( https://github.com/azuredevcollege/SAP). 
 
Additional documentation about the assertion flow can be found in the 
[Principal propagation in a multi-cloud solution between Microsoft Azure and SAP Cloud Platform (SCP)
]( https://blogs.sap.com/2020/07/17/principal-propagation-in-a-multi-cloud-solution-between-microsoft-azure-and-sap-cloud-platform-scp/) blog by **Martin Raepple** implemented based on the SAP Cloud Platform. 


This lab is built and based on the *SAP NetWeaver AS ABAP and SAP BW 7.5 SP01 on SAP HANA SP10 [Developer Edition] system, deployed on Azure via SAP* [CAL]( https://cal.sap.com/), that can be found [here]( https://blogs.sap.com/2013/05/16/developer-trial-editions-sap-netweaver-application-server-abap-and-sap-business-warehouse-powered-by-sap-hana/). 

The first chapter of this lab is intended to help validating the SAP Netweaver and Azure AD configuration based on the **SAP Netweaver Developer Edition system configuration** to make the scenario easier to reproduce.

# Development environment setup validation
After successfully implementing the detailed configuration [documentation]( https://github.com/azuredevcollege/SAP) the Azure AD configuration should look as following based on the *SAP NetWeaver AS ABAP and SAP BW 7.5 SP01 on SAP HANA SP10 [Developer Edition]* system configuration:

## Azure AD Enterprise Application – SAP Netweaver 
This App will later be used as **clientId** with corresponding **client secret**. 

### Maintained parameters:

```
Identifier (Entity ID): http://A4H001
Reply URL (Assertion Consumer Service URL):
https://vhcala4hci.dummy.nodomain:50001/sap/bc/sec/oauth2/token
```

![SAPNETWEAVERENTERPRISECONFIG]( https://github.com/ROBROICH/Teams-Chatbot-SAP-NW-Principal-Propagation/blob/master/images/AAD_Netweaver_Config.png)

### Azure AD to SAP ABAP user mapping:
In this example we used the following **User Attributes and Claims** parameters to map the Azure AD user via the email-address to the **SAP ABAP users email-address**:
```

Name: user.userprincipalname
Unique User Identifier: user.othermail

```

![ AAD_Netweaver_APP_USER_ATTRIBUTE_CLAIM]( https://github.com/ROBROICH/Teams-Chatbot-SAP-NW-Principal-Propagation/blob/master/images/AAD_Netweaver_APP_USER_ATTRIBUTE_CLAIM.png)


## Azure AD App registrations – SAP Netweaver (Tab “All Applications”)
### Maintained parameters:

```
Redirect URIs:
https://vhcala4hci.dummy.nodomain:50001/sap/bc/sec/oauth2/token
https://token.botframework.com/.auth/web/redirect
```

![SAPNETWEAVERAPPREDIRECTURI]( https://github.com/ROBROICH/Teams-Chatbot-SAP-NW-Principal-Propagation/blob/master/images/AAD_Netweaver_APP_REDIRECT_URLS_IMPLICIT_GRANTS.png)
### Expose the Netweaver Enterprise App as API
![ AAD_Netweaver_APP_AP]( https://github.com/ROBROICH/Teams-Chatbot-SAP-NW-Principal-Propagation/blob/master/images/AAD_Netweaver_APP_API.png)

## Azure AD App registrations – APP-Chatbot-Channel-Teams

### Maintained parameters:

```
Redirect URIs:
https://vhcala4hci.dummy.nodomain:50001/sap/bc/sec/oauth2/token
https://mychatbot.com

```

![ AAD_CHATBOT_APP_REDIRECT_URLS_IMPLICIT_GRANT
]( https://github.com/ROBROICH/Teams-Chatbot-SAP-NW-Principal-Propagation/blob/master/images/AAD_CHATBOT_APP_REDIRECT_URLS_IMPLICIT_GRANTS.png)
### SAP Netweaver  Enterprise App API permissions granted to the Azure Bot Channel App
Granting API access to the SAP Netweaver Enterprise App:
![ AAD_CHATBOT_APP_API_PERMISSIONS]( https://github.com/ROBROICH/Teams-Chatbot-SAP-NW-Principal-Propagation/blob/master/images/AAD_CHATBOT_APP_API_PERMISSIONS.png
)

## Bot Channels Registration
### Bot Channels Registration - BOT-Chan-Teams - Settings
Maintained OAuth Connection Settings:
```
Clientid :  Client id of the NW Enterprise APP 
Client secret: Client secret of the NW Enterprise APP 
Token Exchange URL: https://login.microsoftonline.com/common/oauth2/v2.0/token
//Application ID URI of the App-Chatbot-Channel-Teams 
Scopes: api:///readSAPOData
```

![ BotServiceChannel_SAP_NW_OAUTH]( https://github.com/ROBROICH/Teams-Chatbot-SAP-NW-Principal-Propagation/blob/master/images/BotServiceChannel_SAP_NW_OAUTH.png)

## SAP Netweaver Configuration 
This lab uses an **SAP Enterprise Procurement Model (EPM)** OData service. 
The service **EPM_REF_APPS_SHOP_SRV** is referenced as shop in the EPM demo application. Further information on working with SAP OData services can be found [here]( https://developers.sap.com/tutorials/odata-02-exploration-epm.html
).
### Configuration of OAUTH 2.0 client
When using the SAP NW development system. SAP OAuth 2.0 client has to be [configured]( https://github.com/azuredevcollege/SAP/blob/master/sap-oauth-saml-flow/SAPConfiguration/README.md#configure-scopes-in-sap
)
as following:
![ SAP_OAUTH_SCOPE.png]( https://github.com/ROBROICH/Teams-Chatbot-SAP-NW-Principal-Propagation/blob/master/images/SAP_OAUTH_SCOPE.png)

In the SAP transaction **PFCG** the user role as to be [configured]( https://github.com/azuredevcollege/SAP/blob/master/sap-oauth-saml-flow/SAPConfiguration/README.md#generate-user
)
as following:
![ SAP_ROLE_CONFIG]( https://github.com/ROBROICH/Teams-Chatbot-SAP-NW-Principal-Propagation/blob/master/images/SAP_ROLE_CONFIG.png)

In the SAP transaction **SICF**, enable OAuth 2.0 Authentication for the OData service by adding the handler [/IWFND/CL_SODATA_HTTP_HNDL_OAT]( https://help.sap.com/erp_hcm_ias2_2014_03/helpdata/en/1e/c60c33be784846aad62716b4a1df39/content.htm?no_cache=true)

![ SICFCONFIG]( https://github.com/ROBROICH/Teams-Chatbot-SAP-NW-Principal-Propagation/blob/master/images/SAP_SERVICE_CONFIG_HANDLER.png)

For matching the Azure AD user to the ABAP user via the user’s email-address the IDP must be configured as following via this transaction / URI: 
```
https://<SAPNETWEAVER_IP_ADDRESS>:PORT/sap/bc/webdynpro/sap/saml2?TRUSTED_PROVIDER_TYPE=OA2#
```





![ SAP_NAMEID_FORMAT]( https://github.com/ROBROICH/Teams-Chatbot-SAP-NW-Principal-Propagation/blob/master/images/SAP_NAMEID_FORMAT.png)

## Validate the setup and configuration with Postman  
After successful configuration and setup of the scenario in Azure AD and the SAP system, the recommendation is to validate the setup using Postman. 

To utilize the Postman requests the following instruction steps must be implemented: 
### Get an access token via the browser 
![ POSTMAN_GETAssertionViaBrowser]( https://github.com/ROBROICH/Teams-Chatbot-SAP-NW-Principal-Propagation/blob/master/images/POSTMAN_GETAssertionViaBrowser.png)
The GET requests URI from Postman’s address bar must be executed in a browser: 
```
https://login.microsoftonline.com/DIRECTORY_TENANT_ID/oauth2/v2.0/authorize?client_id=CLIENT_ID&response_type=token&redirect_uri=https://mychatbot.com&scope=api:// /readSAPOData&nonce=9876543&response_mode=fragment
```
After the redirect the access_token **“COPY_THIS_TOKEN”** must be copied from the browsers address bar:
```
https://mychatbot.com/#access_token=COPY_THIS_TOKEN&token_type=Bearer&expires_in=3599&scope=YOUR_SCOPE&session_state=
```
Now copy the **“COPY_THIS_TOKEN”** parameter into the value of the key assertion in the Body of the **POSTSAML2token POST** request in Postman. 
After completing the POST request a HTTP body with an **“access_token”** value will be returned. Please again copy this returned access_token to your clipboard. 
![ POSTMAN_POSTSAMtoken.png]( https://github.com/ROBROICH/Teams-Chatbot-SAP-NW-Principal-Propagation/blob/master/images/POSTMAN_POSTSAM2token.png)
In the next POST request, the following configurations must implemented. 

First the in the tab Authorization the **ABAP OAUTH client username and password** must be maintained as Basic Auth. 
![ POSTMAN_ POSTSAMl2bearer_1.png]( https://github.com/ROBROICH/Teams-Chatbot-SAP-NW-Principal-Propagation/blob/master/images/POSTMAN_POSTSAMl2bearer_1.png)
In the second configuration step the **“access_token”** returned from the previous POST request has be maintained as **VALUE** for the key **“assertion”**. 

When successfully executing the POST request, a HTTP-Body with a new **“access_token”** is returned. 
This access token must be saved again for the nest GET request. 
![ POSTMAN_ POSTSAMl2bearer_2.png]( https://github.com/ROBROICH/Teams-Chatbot-SAP-NW-Principal-Propagation/blob/master/images/POSTMAN_POSTSAMl2bearer_2.png)
In the final GET request the SAP OData-Services is called and the recent **“access_token”** must be maintained as **authorization header**:

![ POSTMAN_ POSTSAMl2bearer_2.png]( https://github.com/ROBROICH/Teams-Chatbot-SAP-NW-Principal-Propagation/blob/master/images/POSTMAN_GETODATA.png)

# Node.JS application setup 
After successful validation of the configuration using Postman, the next is to clone the Node.JS project via the following Git command:

```
git clone https://github.com/ROBROICH/Teams-Chatbot-SAP-NW-Principal-Propagation.git
```
After cloning the project from GitHub, the *.env file must be created and maintained:
```
MicrosoftAppId=Application (client ID) of the Teams App (App-ChatBot-Channel-Teams)
MicrosoftAppPassword= Secret (client secret) of the Teams App (App-ChatBot-Channel-Teams)

connectionNameSAPNW=The Service Provider Connection Settining (AD_CON_SAP_NW_OAUTH)
clientId= Application (client ID) of the Teams App (App-ChatBot-Channel-Teams)
clientSecret= Secret (client secret) of the Teams App (App-ChatBot-Channel-Teams)

scope=api:// Application ID URI of the TEAMS Apps /readSAPOData
tenantID=Azure AD tenant ID
ressourceName= Identifier (Entity ID) of the SAP Netweaver Enterprise App (SAP Netweaver) (http://A4H001)

sapURL=vhcala4hci.dummy.nodomain
sapPathOData=/sap/opu/odata/sap/EPM_REF_APPS_PROD_MAN_SRV/Products
sapPort=50001

clientIdSAPOauth=AZURECHAT1
scopeSAPOauth=ZEPM_REF_APPS_PROD_MAN_SRV_0001

clientIdSAPUser= The technical ABAP OAuth usr (AZURECHAT1)
scopeSAPBasicAuth= AZURECHAT1 Password
sapPathOAuthToken=/sap/bc/sec/oauth2/token
```


# Trouble shooting

{ "error":"invalid_grant","error_description":"Provided authorization grant is invalid. Exception was Attribute 'Recipient' of element 'SubjectConfirmationData' is invalid. For more information, consult the kernel traces or the OAuth 2.0 trouble shooting SAP note 1688545" }

https://www.itsfullofstars.de/2020/05/troubleshooting-recipient-in-subjectconfirmationdata-is-invalid/

https://wiki.scn.sap.com/wiki/display/Security/OAuth+2.0+-+Constrained+Authorization+and+Single+Sign-On+for+OData+Services


