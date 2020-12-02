// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const {CardFactory, AttachmentLayoutTypes } = require('botbuilder');
const {
    OAuthPrompt,
    ComponentDialog,
    ConfirmPrompt,
    DialogSet,
    DialogTurnStatus,
    TextPrompt,
    WaterfallDialog
} = require('botbuilder-dialogs');
const { SimpleSAPNWODataClient } = require('../simple-SAP-NW-client');


const OAUTH_PROMPT = 'OAuthPrompt';

const USER_PROFILE = 'USER_PROFILE';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const CONFIRM_PROMPT_OAUTH = 'CONFIRM_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';

class UserProfileDialog extends ComponentDialog {
    // The user interaction flow is defined in the constructor
    constructor(userState) {
        super('userProfileDialog');

        this.userProfile = userState.createProperty(USER_PROFILE);

        // Prompt for OAUTH
        this.addDialog(
            new OAuthPrompt(OAUTH_PROMPT, {
                connectionName: process.env.connectionName,
                text: 'Please Sign In',
                title: 'Sign In',
                timeout: 300000
            }));

        this.addDialog(new TextPrompt(TEXT_PROMPT));

        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT_OAUTH));

        // Start the user interaction / waterfall dialog
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.promptStep.bind(this),
            this.loginStep.bind(this),
            this.displayTokenStep1.bind(this),
            this.displayTokenStep2.bind(this),
            this.commandStep.bind(this),
            this.processStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} turnContext
     * @param {*} accessor
     */
    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    // Here we start
    async promptStep(stepContext) {
        return await stepContext.beginDialog(OAUTH_PROMPT);
    }

    async loginStep(stepContext) {
        // Get the token from the previous step. Note that we could also have gotten the
        // token directly from the prompt itself. There is an example of this in the next method.
        const tokenResponse = stepContext.result;
        if (tokenResponse) {
            await stepContext.context.sendActivity('You are now logged in.');
            return await stepContext.prompt(CONFIRM_PROMPT_OAUTH, 'Would you like to view your token? Please prompt \'YES\' for this demo');
        }
        await stepContext.context.sendActivity('Login was not successful please try again.');
        return await stepContext.endDialog();
    }

    async displayTokenStep1(stepContext) {
        await stepContext.context.sendActivity('Thank you.');

        const result = stepContext.result;
        if (result) {
            // Call the prompt again because we need the token. The reasons for this are:
            // 1. If the user is already logged in we do not need to store the token locally in the bot and worry
            // about refreshing it. We can always just call the prompt again to get the token.
            // 2. We never know how long it will take a user to respond. By the time the
            // user responds the token may have expired. The user would then be prompted to login again.
            //
            // There is no reason to store the token locally in the bot because we can always just call
            // the OAuth prompt to get the token or get a new token if needed.
            return await stepContext.beginDialog(OAUTH_PROMPT);
        }
        return await stepContext.endDialog();
    }

    async displayTokenStep2(stepContext) {
        const tokenResponse = stepContext.result;
        if (tokenResponse && tokenResponse.token) {
            await stepContext.context.sendActivity(`Here is your token ${ tokenResponse.token }`);
            return await stepContext.prompt(TEXT_PROMPT, { prompt: 'Wich \'SAP Product\' are you interested in? For instance HT-1000.' });
        }
        return await stepContext.endDialog();
    }

   /* async actionStep(step) {
        // Get the token from the previous step. Note that we could also have gotten the
        // token directly from the prompt itself. There is an example of this in the next method.
        const tokenResponse = step.result;
        if (tokenResponse.token) {
            await step.context.sendActivity('You are now logged in.');
            return await step.prompt(TEXT_PROMPT, { prompt: 'Please type \'SAP Products\' to display the products from SAP)' });
        }
        await step.context.sendActivity('Login was not successful please try again.');
        return await step.endDialog();
    }*/

    async commandStep(step) {
        step.values.command = step.result;

        // Call the prompt again because we need the token. The reasons for this are:
        // 1. If the user is already logged in we do not need to store the token locally in the bot and worry
        // about refreshing it. We can always just call the prompt again to get the token.
        // 2. We never know how long it will take a user to respond. By the time the
        // user responds the token may have expired. The user would then be prompted to login again.
        //
        // There is no reason to store the token locally in the bot because we can always just call
        // the OAuth prompt to get the token or get a new token if needed.
        return await step.beginDialog(OAUTH_PROMPT);
    }

    async processStep(step) {
        if (step.result) {
            // We do not need to store the token in the bot. When we need the token we can
            // send another prompt. If the token is valid the user will not need to log back in.
            // The token will be available in the Result property of the task.
            const tokenResponse = step.result;

            // If we have the token use the user is authenticated so we may use it to make API calls.
            if (tokenResponse && tokenResponse.token) {
                var products = null;

                if (step.result) {
                    // We do not need to store the token in the bot. When we need the token we can
                    // send another prompt. If the token is valid the user will not need to log back in.
                    // The token will be available in the Result property of the task.
                    const tokenResponse = step.result;

                    var simpleSAPADClient = new SimpleSAPNWODataClient();

                    // Execute token assertion and ODATA-Call 
                    products = await simpleSAPADClient.getSAPNWODataStepOne(tokenResponse.token, step.context._activity.text);

                }

                const numberOfProducts = products.d.results.length;

                // Get the images from the public SAO E5 system
                var imageURL = 'https://sapes5.sapdevcenter.com';

                // Create a hero card and loop over  resultset
                // https://docs.microsoft.com/en-us/adaptive-cards/
                const reply = { attachments: [], attachmentLayout: AttachmentLayoutTypes.List };
                for (let cnt = 0; cnt < numberOfProducts; cnt++) {
                    var product = products.d.results[cnt];
                    var productImageURL = imageURL + product.ProductPictureURL;
                    const card = CardFactory.heroCard(
                        'Product Id ' + product.ProductUUID /*+ ' Description ' + product.Description*/,
                        'Name: ' + product.Product, //+ ' Supplier: ' + product.Supplier.SupplierName,
                        [{ type: 'Image', alt: 'SAP Logo', url: productImageURL, height: '5px', width: '5px' }],
                        ['Order via email'],
                        { subtitle: `Price : ${ product.Price } Product Category: ${ product.ProductCategory }` }
                    );
                    reply.attachments.push(card);
                }
                await step.context.sendActivity(reply);

                return await step.endDialog();
            }
        } else {
            await step.context.sendActivity('We couldn\'t log you in. Please try again later.');
        }

        return await step.endDialog();
    }
}

exports.UserProfileDialog = UserProfileDialog;
