# Hands-On Lab: Implementing a Node.JS client as Chatbot to achieve principal propagation between Azure and SAP Netweaver 

# Introduction 
This Hands-On lab demonstrates how to establish principal propagation, or an OAuth2 SAML Bearer Assertion Flow, between Azure AD and SAP Netweaver. 

In a nutshell this scenario enables Azure developers to implement cloud-native Azure applications and consume OData data-sources from SAP including applying the ABAP authorizations of the user-logged on to Azure AD. 

In practice the Azure user will be mapped to the corresponding SAP ABAP user when invoking the SAP Netweaver OData service. This approach allows to reuse existing SAP NW security, authorization- and role-concepts within Azure based applications like the Chatbot in this example. 

This lab demonstrates on the implementation of a basic Node.JS client as foundation to display the SAP data in Microsoft Teams using an Azure Bot. 

# Development environment setup 
This lab is an extension of the existing [Microsoft & SAP Graph Chatbot]( https://github.com/ROBROICH/TEAMS-Chatbot-Microsoft-SAP-Graph) Hands-On Lab. 

The general setup of the development is described in this predecessor lab and hence it is recommended to implement this previous lab in case the development environment must be setup initially.

The second essential prerequisite for implementing this lab is the configuration Azure Active Directory(AZ AD) and SAP Netwaver (SAP NW) to support the OAuth2 SAML Bearer Assertion Flow. 

This detailed configuration of Azure AD and SAP NW is displayed in a Azure Developer College repository, provided by the German Microsoft One Commercial Partner(OCP) CSA team. 
The documentation can be found [here]( https://github.com/azuredevcollege/SAP). 
Additional documentation about the assertion flow can be found in the Principal propagation in a multi-cloud solution between Microsoft Azure and SAP Cloud Platform (SCP)
 blog by Martin Raepple implemented on an alternative SAP technology 
This lab is built based on the SAP NetWeaver AS ABAP and SAP BW 7.5 SP01 on SAP HANA SP10 [Developer Edition] system, deployed on Azure via SAP [CAL]( https://cal.sap.com/)
, that can be found [here]( https://blogs.sap.com/2013/05/16/developer-trial-editions-sap-netweaver-application-server-abap-and-sap-business-warehouse-powered-by-sap-hana/). 

The first chapter of this lab is intended to help validating the SAP Netweaver and Azure AD configuration based on the SAP Netweaver Developer Edition system configuration.

# Development environment setup validation
After successfully implementing the detailed configuration [documentation]( https://github.com/azuredevcollege/SAP) the Azure AD configuration should look as following based on the SAP CAL development system configuration:

## Azure AD Enterprise Application – SAP Netweaver 
Maintained parameters 

```
Identifier (Entity ID): http://A4H001
Reply URL (Assertion Consumer Service URL):
https://vhcala4hci.dummy.nodomain:50001/sap/bc/sec/oauth2/token


```


![SAPNETWEAVERENTERPRISECONFIG]( https://github.com/ROBROICH/Teams-Chatbot-SAP-NW-Principal-Propagation/blob/master/images/AAD_Netweaver_Config.png
)

## Azure AD App registrations – SAP Netweaver (Tab “All Applications”)
Maintained parameters. 

```
https://vhcala4hci.dummy.nodomain:50001/sap/bc/sec/oauth2/token
https://token.botframework.com/.auth/web/redirect

```

![SAPNETWEAVERAPPREDIRECTURI]( https://github.com/ROBROICH/Teams-Chatbot-SAP-NW-Principal-Propagation/blob/master/images/AAD_Netweaver_APP_REDIRECT_URLS_IMPLICIT_GRANTS.png)

## Azure AD App registrations – APP-Chatbot-Channel-Teams

Maintained parameters. 

```
https://vhcala4hci.dummy.nodomain:50001/sap/bc/sec/oauth2/token
https://mychatbot.com

```

![ AAD_CHATBOT_APP_REDIRECT_URLS_IMPLICIT_GRANT
]( https://github.com/ROBROICH/Teams-Chatbot-SAP-NW-Principal-Propagation/blob/master/images/AAD_CHATBOT_APP_REDIRECT_URLS_IMPLICIT_GRANTS.png)

![ Teams-Chatbot-SAP-NW-Principal-Propagation]( https://github.com/ROBROICH/Teams-Chatbot-SAP-NW-Principal-Propagation/blob/master/images/AAD_CHATBOT_APP_API_PERMISSIONS.png
)
