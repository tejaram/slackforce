"use strict";

let auth = require("./slack-salesforce-auth"),
    force = require("./force"),
    ACCOUNT_TOKEN = process.env.SLACK_ACCOUNT_TOKEN;

exports.execute = (req, res) => {

    if (req.body.token != ACCOUNT_TOKEN) {
        console.log("Invalid token");
        res.send("Invalid token");
        return;
    }

    let slackUserId = req.body.user_id,
        oauthObj = auth.getOAuthObject(slackUserId),
        q = "select Id, Name, Status__c,End__c,start__c,Winning_Score2__c,Type_Unit__c,Winner__c,Type__c,Prize__c from "+
            "FitChallenge__c WHERE Name LIKE '%" + req.body.text + "%'  order by start__c desc LIMIT 2";
        //q = "SELECT Id, Name, Phone, BillingAddress FROM Account WHERE Name LIKE '%" + req.body.text + "%' LIMIT 5";AND Status__c = 'In Progress'

    force.query(oauthObj, q)
        .then(data => {
            let accounts = JSON.parse(data).records;
            if (accounts && accounts.length>0) {
                let attachments = [];
                accounts.forEach(function(account) {
                    let fields = [];
                    fields.push({title: "Name", value: account.Name, short:true});
                    fields.push({title: "Type", value: account.Type__c, short:true});                    
                    fields.push({title: "End Date", value: account.End__c, short:true});
                    fields.push({title: "Prize", value: account.Prize__c, short:true});
                    fields.push({title: "Open in Salesforce:", value: oauthObj.instance_url + "/" + account.Id, short:false});
                    attachments.push({color: "#7F8DE1", fields: fields});
                });
                res.json({text: "FitChallenges: ", attachments: attachments});
            } else {
                res.send("There are no FitChallenges going on right now!");
            }
        })
        .catch(error => {
            if (error.code == 401) {
                res.send(`Visit this URL to login to Salesforce: https://${req.hostname}/login/` + slackUserId);
            } else {
                res.send("An error as occurred");
            }
        });
};