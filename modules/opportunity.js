"use strict";

let auth = require("./slack-salesforce-auth"),
    force = require("./force"),

    OPPORTUNITY_TOKEN = process.env.SLACK_OPPORTUNITY_TOKEN;

exports.execute = (req, res) => {

    if (req.body.token != OPPORTUNITY_TOKEN) {
        res.send("Invalid token"+req.body.token);
        return;
    }

    let timeofday = 'Late Morning';
    var date =  new Date();
    var current_hour = date.getHours();
    if(current_hour>=2 && current_hour<=8)
    {
        timeofday = 'Early Morning';
    }
    else if(current_hour>=9 && current_hour<=13)
    {
        timeofday = 'Late Morning';
    }
    else if(current_hour>= 14 && current_hour<=18)
    {
        timeofday = 'Afternoon';
    }
    else if(current_hour>= 18 && current_hour<=24)
    {
        timeofday = 'Evening';
    }
    else 
    {
        timeofday = 'Evening';
    }

    let slackUserId = req.body.user_id,
        oauthObj = auth.getOAuthObject(slackUserId),
        limit = req.body.text;
        //q = "SELECT Id, Name, Amount, Probability, StageName, CloseDate FROM Opportunity where isClosed=false ORDER BY amount DESC LIMIT " + limit;
    var q = "SELECT Id, Name, Description__c, image_location__c FROM FitTips__c where Type__c ='" + limit + "'  AND FitVideo__C = false LIMIT 1"; //+ limit;

    if (!limit || limit=="") 
        q = "SELECT Id, Name, Description__c, image_location__c FROM FitTips__c where Time_of_Day__c ='" + timeofday + "'  AND FitVideo__C = false LIMIT 1"; //+ limit;

    //if (!limit || limit=="") limit = 5;

    force.query(oauthObj, q)
        .then(data => {
            let opportunities = JSON.parse(data).records;
            if (opportunities && opportunities.length > 0) {
                let attachments = [];
                opportunities.forEach(function (opportunity) {
                    let fields = [];
                    let image_url = opportunity.image_location__c;
                    fields.push({title: "FitTip", value: opportunity.Description__c, short: true});
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
                    //text: "FitTip From FitBliss",
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