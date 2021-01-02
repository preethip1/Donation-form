var mongoose = require('mongoose');
var router = require('express').Router();
var passport = require('passport');
var Details = mongoose.model('Details');
var auth = require('../auth');

router.post('/details', async function (req, res, next) {
    var details = new Details();
    details.phoneNo = req.body.phoneNo
    details.address = req.body.address
    details.amount = req.body.amount
    details.donationDate = req.body.donationDate
    details.email = req.body.email
    details.name = req.body.name
    details.payment = req.body.payment
    details.period = req.body.period
    details.pincode = req.body.pincode
    details.smirtiDate = req.body.smirtiDate
    try {
        await details.save();
        res.status(200).json(details)
    } catch (e) {
        res.status(400).json({ err: "something went wrong" })
    }

});

router.get('/list', async function (req, res, next) {
    try {
        let list = Array.from(await Details.find());
        let fList = [];
        list.forEach((l) => {
            if (isMatch(l.smirtiDate, l.period)) {
                fList.push(l);
            }
        });
        console.log(fList);
        res.status(200).json({ list: fList })
    } catch (e) {
        console.log(e);
        res.status(400).json({ err: "something went wrong" })
    }

});

function isMatch(date1, interval) {
    let diifInMS = Date.now() - new Date(date1);
    if (interval == -1 || diifInMS < 0) return false;
    let diffInDays = diifInMS / 86400000;
    console.log("diffInDays", diffInDays);
    let intDays = interval * 30;
    console.log("intDays", intDays);
    if (diffInDays < intDays - 5) return false;
    let coff = diffInDays / intDays;
    coff = Math.floor(coff);
    console.log(coff);
    let diff = Math.abs(diffInDays - (coff * intDays));
    console.log(diff);
    if (diff <= 7) return true;
    else return false;
}

module.exports = router;
