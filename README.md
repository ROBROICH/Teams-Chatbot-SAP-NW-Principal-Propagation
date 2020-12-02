# Hands-On Lab: Implementing a Node.JS client as Azure Bot and leveraging principal propagation between Azure, SAP Cloud Platform Integration, SAP Cloud Connector and OData Gateway

# Introduction 
This hands-on lab extends the existing implementation in this [repos](https://github.com/ROBROICH/Teams-Chatbot-SAP-NW-Principal-Propagation) of a principal propagation, also known as OAuth2 SAML Bearer Assertion Flow, between Azure AD and SAP Netweaver(NW) OData-services via SAP Cloud Platform and Cloud Connector.

The scenario of this lab is a basic Node.JS client to display data from SAP NW OData services in Microsoft Teams using an Azure Bot. 

**In a nutshell:** 
*This scenario enables Azure developers to implement cloud-native Azure applications that are enabled to consume OData data-sources from SAP Netweaver. This includes applying and mapping the SAP ABAP authorizations of the same user-logged on to Azure AD and maintained in SAP NW.* 

*As a result, this approach allows to reuse existing ...

The overall scenario implementation and procedure is described in the following sections: 
* Development environment setup 
* Development environment validation
* Validate the setup and configuration with Postman
* Node.JS application setup
