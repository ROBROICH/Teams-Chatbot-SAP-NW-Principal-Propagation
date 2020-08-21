# Hands-On Lab: Implementing a Node.JS client as Chatbot to achieve principal propagation between Azure and SAP Netweaver 

# Introduction 
This Hands-On lab demonstrates how to establish principal propagation, also known as OAuth2 SAML Bearer Assertion Flow, between Azure AD and SAP Netweaver. 

In a nutshell this scenario enables Azure developers to implement cloud-native Azure applications and consume OData data-sources from SAP including applying the ABAP authorizations of the user-logged on to Azure AD. 

In practice the Azure user will be mapped to the corresponding SAP ABAP user when invoking the SAP Netweaver OData service. This approach allows to reuse existing SAP NW security, authorization- and role-concepts within Azure based applications like the Chatbot in this example. 

This lab demonstrates on the implementation of a basic Node.JS client as foundation to display the SAP data in Microsoft Teams using an Azure Bot. 

# Development environment setup 
This lab is an extension of the existing [Microsoft & SAP Graph Chatbot]( https://github.com/ROBROICH/TEAMS-Chatbot-Microsoft-SAP-Graph) Hands-On Lab. 

The general setup of the development is described in this predecessor lab and hence it is recommended to implement this previous lab in case the development environment must be setup initially.

The second essential prerequisite for implementing this lab is the configuration Azure Active Directory(AZ AD) and SAP Netwaver (SAP NW) to support the OAuth2 SAML Bearer Assertion Flow. 

This configuration of Azure AD and SAP NW in details is explained in a Azure Developer College repository, provided by the German Microsoft One Commercial Partner(OCP) CSA team. 
The full documentation can be found [here]( https://github.com/azuredevcollege/SAP). 
 
Additional documentation about the assertion flow can be found in the 
[Principal propagation in a multi-cloud solution between Microsoft Azure and SAP Cloud Platform (SCP)
]( https://blogs.sap.com/2020/07/17/principal-propagation-in-a-multi-cloud-solution-between-microsoft-azure-and-sap-cloud-platform-scp/) blog by Martin Raepple implemented on complementary SAP technology. 


This lab is built based on the SAP NetWeaver AS ABAP and SAP BW 7.5 SP01 on SAP HANA SP10 [Developer Edition] system, deployed on Azure via SAP [CAL]( https://cal.sap.com/), that can be found [here]( https://blogs.sap.com/2013/05/16/developer-trial-editions-sap-netweaver-application-server-abap-and-sap-business-warehouse-powered-by-sap-hana/). 

The first chapter of this lab is intended to help validating the SAP Netweaver and Azure AD configuration based on the SAP Netweaver Developer Edition system configuration.

# Development environment setup validation
After successfully implementing the detailed configuration [documentation]( https://github.com/azuredevcollege/SAP) the Azure AD configuration should look as following based on the SAP CAL SAP NetWeaver AS ABAP and SAP BW 7.5 SP01 on SAP HANA SP10 [Developer Edition] system configuration:

## Azure AD Enterprise Application – SAP Netweaver 
This App will later be used as clientId with corresponding secret. 

###Maintained parameters:

```
Identifier (Entity ID): http://A4H001
Reply URL (Assertion Consumer Service URL):
https://vhcala4hci.dummy.nodomain:50001/sap/bc/sec/oauth2/token
```

![SAPNETWEAVERENTERPRISECONFIG]( https://github.com/ROBROICH/Teams-Chatbot-SAP-NW-Principal-Propagation/blob/master/images/AAD_Netweaver_Config.png)

###Azure AD to SAP ABAP user mapping:
In this example we used the following parameters to map the Azure AD user via the email-address to the SAP ABAP user via the e-mail address as well:
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

### Maintained parameters. 

```
Redirect URIs:
https://vhcala4hci.dummy.nodomain:50001/sap/bc/sec/oauth2/token
https://mychatbot.com

```

![ AAD_CHATBOT_APP_REDIRECT_URLS_IMPLICIT_GRANT
]( https://github.com/ROBROICH/Teams-Chatbot-SAP-NW-Principal-Propagation/blob/master/images/AAD_CHATBOT_APP_REDIRECT_URLS_IMPLICIT_GRANTS.png)
### SAP Netweaver  Enterprise App API permissions granted to the Azure Bot Channel App
Here we grant API access to the SAP Netweaver Enterprise App:
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
This lab uses a SAP Enterprise Procurement Model (EPM) OData service. 
The service EPM_REF_APPS_SHOP_SRV is referenced as shop in the EPM demo application. Further information about this shop OData service can be found [here]( https://developers.sap.com/tutorials/odata-02-exploration-epm.html
).
### Configuration of OAUTH 2.0 client
When using the SAP NW development system. SAP OAuth 2.0 client has to be [configured]( https://github.com/azuredevcollege/SAP/blob/master/sap-oauth-saml-flow/SAPConfiguration/README.md#configure-scopes-in-sap
)
as following:
![ SAP_OAUTH_SCOPE.png]( https://github.com/ROBROICH/Teams-Chatbot-SAP-NW-Principal-Propagation/blob/master/images/SAP_OAUTH_SCOPE.png)

In the SAP transaction PFCG the user role as to be [configured]( https://github.com/azuredevcollege/SAP/blob/master/sap-oauth-saml-flow/SAPConfiguration/README.md#generate-user
)
as following:
![ SAP_ROLE_CONFIG]( https://github.com/ROBROICH/Teams-Chatbot-SAP-NW-Principal-Propagation/blob/master/images/SAP_ROLE_CONFIG.png)





In the SAP transaction SICF, enable OAuth 2.0 Authentication for the OData service by adding the handler “/IWFND/CL_SODATA_HTTP_HNDL_OAT”

![ SICFCONFIG]( https://github.com/ROBROICH/Teams-Chatbot-SAP-NW-Principal-Propagation/blob/master/images/SAP_SERVICE_CONFIG_HANDLER.png)



{ "error":"invalid_grant","error_description":"Provided authorization grant is invalid. Exception was Attribute 'Recipient' of element 'SubjectConfirmationData' is invalid. For more information, consult the kernel traces or the OAuth 2.0 trouble shooting SAP note 1688545" }

https://www.itsfullofstars.de/2020/05/troubleshooting-recipient-in-subjectconfirmationdata-is-invalid/


