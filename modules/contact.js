"use strict";

let auth = require("./slack-salesforce-auth"),
    force = require("./force"),
    CONTACT_TOKEN = process.env.SLACK_CONTACT_TOKEN;

exports.execute = (req, res) => {

    /*if (req.body.token != CONTACT_TOKEN) {
        res.send("Invalid token"+req.body.token);
        return;
    }*/

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
        q = "SELECT Id, Name, Description__c, image_location__c FROM FitTips__c where Time_of_Day__c ='" + timeofday + "'  AND FitVideo__C = true LIMIT 1"; //+ limit;
        //q = "SELECT Id, Name, Phone, MobilePhone, Email FROM Contact WHERE Name LIKE '%" + req.body.text + "%' LIMIT 5";

    force.query(oauthObj, q)
        .then(data => {
            let contacts = JSON.parse(data).records;
            if (contacts && contacts.length>0) {
                let attachments = [];
                contacts.forEach(function(contact) {
                    let fields = [];
                    let image_url = opportunity.image_location__c;
                    fields.push({title: "Description", value: contact.Description__c, short:true});                    
                    fields.push({title: "URL for FitVideo:", value: contact.image_location__c, short:false});
                    attachments.push(
                        {
                            color: "#A094ED", 
                            fields: fields, 
                            image_url:image_url
                        }
                        );
                });
                res.json({text: "FitVideo From FitBliss '" , attachments: attachments});
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