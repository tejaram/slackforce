"use strict";

let auth = require("./slack-salesforce-auth"),
    force = require("./force"),

    OPPORTUNITY_TOKEN = process.env.SLACK_OPPORTUNITY_TOKEN;

exports.execute = (req, res) => {

    if (req.body.token != OPPORTUNITY_TOKEN) {
        res.send("Invalid token"+req.body.token);
        return;
    }

    let slackUserId = req.body.user_id,
        oauthObj = auth.getOAuthObject(slackUserId),
        limit = req.body.text,
        //q = "SELECT Id, Name, Amount, Probability, StageName, CloseDate FROM Opportunity where isClosed=false ORDER BY amount DESC LIMIT " + limit;
        q = "SELECT Id, Name, Description__c, image_location__c FROM FitTips__c where Time_of_Day__c = 'Late Morning' AND FitVideo__C = false AND Type__c='Stress' LIMIT 1"; //+ limit;

    if (!limit || limit=="") limit = 5;

    force.query(oauthObj, q)
        .then(data => {
            let opportunities = JSON.parse(data).records;
            if (opportunities && opportunities.length > 0) {
                let attachments = [];
                opportunities.forEach(function (opportunity) {
                    let fields = [];
                    let image_url = opportunity.image_location__c;
                    fields.push({title: "Opportunity", value: opportunity.Description__c, short: true});
                    //fields.push({title: "Stage", value: opportunity.StageName, short: true});
                    /*fields.push({
                        title: "Amount",
                        value: new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD'
                        }).format(opportunity.Amount),
                        short: true
                    });
                    fields.push({title: "Probability", value: opportunity.Probability + "%", short: true});*/
                    fields.push({title: "Open in Salesforce:", value: oauthObj.instance_url + "/" + opportunity.Id, short:false});
                    attachments.push({
                        color: "#FCB95B",
                        fields: fields,
                        image_url : image_url
                    });
                });
                res.json({
                    text: "FitTip FROM FitBliss",
                    //text: "Top " + limit + " opportunities in the pipeline:",
                    attachments: attachments
                });
            } else {
                res.send("No records");
            }
        })
        .catch(error => {
            if (error.code == 401) {				
                res.send(`Visit this URL to login to Salesforce: https://${req.hostname}/login/` + slackUserId);
            } else {
                console.log(error);
                res.send("An error as occurred");
            }
        });
};