"use strict";

let auth = require("./slack-salesforce-auth"),
    force = require("./force"),
    DAILY_TOKEN = process.env.SLACK_DAILY_TOKEN;

exports.execute = (req, res) => {

    if (req.body.token != DAILY_TOKEN) {
        console.log("Invalid token");
        res.send("Invalid token");
        return;
    }
    
    let slackUserId = req.body.user_id,
        oauthObj = auth.getOAuthObject(slackUserId),
        userId = '';

    force.whoami(oauthObj)
        .then(data => {
            let userInfo = JSON.parse(data);
            userId = userInfo.user_id;
        })
        .catch(error => {
            if (error.code == 401) {
                res.send(`Visit this URL to login to Salesforce: https://${req.hostname}/login/` + slackUserId);
            } else {
                console.log(error);
                res.send("An error as occurred");
            }
        });
    let q = "SELECT id, Activity_Calories__c, Calories_Burned__c, Date__c, Steps__c, Distance__c,Sedentary_Minutes__c,"+
        " Floors__c, Duration__c, Note__c, Image__c, User__r.fullphotoURL, User__r.Name "+
            "FROM Daily_FitConnect__c where User__c = '"+userId+"'' AND date__c = TODAY limit 1";
        //q = "select Id, Name, Status__c,End__c,start__c,Winning_Score2__c,Type_Unit__c,Winner__c,Type__c,Prize__c from "+
        //    "FitChallenge__c WHERE Name LIKE '%" + req.body.text + "%'  order by start__c desc LIMIT 2";
        //q = "SELECT Id, Name, Phone, BillingAddress FROM Account WHERE Name LIKE '%" + req.body.text + "%' LIMIT 5";
        //AND Status__c = 'In Progress'

    force.query(oauthObj, q)
        .then(data => {
            let accounts = JSON.parse(data).records;
            if (accounts && accounts.length>0) {
                let attachments = [];
                accounts.forEach(function(account) {
                    let fields = [];
                    fields.push({title: "Steps", value: account.Steps__c, short:true});
                    fields.push({title: "Distance", value: account.Distance__c, short:true});                    
                    fields.push({title: "Calories", value: account.Calories_Burned__c, short:true});
                    fields.push({title: "Floors", value: account.Floors__c, short:true});
                    fields.push({title: "Sedentary Minutes", value: account.Sedentary_Minutes__c, short:true});
                    fields.push({title: "Activity Minutes", value: (account.Duration__c/60), short:true});
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
                console.log(error);
                res.send("An error as occurred");
            }
        });
};