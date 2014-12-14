var request = require("request"),
    async = require("async"),
    trim = require("trim"),
    configloader = require("config-file-loader"),
    gandilib = require("./gandilib");

var loader = new configloader.Loader();
var cfg = loader
    .setSuffixes(["", ".json", ".yml", ".yaml"])
    .setPaths([loader.home, loader.cwd])
    .get("gandi-dns-config") || [];

if (cfg.length == 0) {
    console.error("No configuration file.");
    return;
}

var domain_splitter_expr = /(.+)\.([a-zA-Z0-9\-]+\.[a-zA-Z0-9]+)/;

function isIpAddress(ip) {
    return /\d+\.\d+\.\d+\.\d+/.test(ip);
}

function getPublicIP(callback) {
    var url = "http://icanhazip.com"; // "http://ifconfig.me/ip"
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200 && isIpAddress(body)) {
            callback(null, trim(body));
        } else {
            callback(true, body);
        }
    })
}

function createNewVersionAndAddRecord(gandi, domain, zoneId, record, publicIp, callback) {
    console.log("Setting record ", publicIp, "to zoneid", zoneId);
    var version = undefined;
    async.waterfall([
        function get_new_version_for_zoneid(callback) {
            gandi.getDomainZoneVersionNew(zoneId, function(err, newVersion) {
                console.log("Created version", newVersion);
                version = newVersion;
                callback(err);
            });
        },

        function delete_record(callback) {
            if (record.phony !== true) {
                gandi.getDomainZoneRecordDelete(zoneId, version, {name: record.name }, callback);
            } else {
                callback(null, null);
            }
        },

        function add_record(phony, callback) {
            var newRecord = { name: record.name, type: record.type, value: publicIp, ttl: record.ttl || 600};
            gandi.getDomainZoneRecordAdd(zoneId, version, newRecord, callback);
        },

        function set_version(phony, callback) {
            gandi.getDomainZoneVersionSet(zoneId, version, callback);
        },

        function set_zone_id(phony, callback) {
            gandi.getDomainZoneSet(domain, zoneId, callback);
        }

    ], function(err) {
        callback(err);
    });
}

function updateGandiRecord(apiKey, fqdnRecord, callback) {
    var gandi = new gandilib.GandiRpc(apiKey);
    var publicIp = undefined;
    var zoneId = undefined;
    var domainMatch = fqdnRecord.match(domain_splitter_expr);
    var record = undefined;
    var domain = undefined;
    var currentRecordIP = undefined;
    var currentRecord = undefined;

    if (domainMatch && domainMatch.length==3) {
        record = domainMatch[1];
        domain = domainMatch[2];
    } else {
        console.error(domainMatch);
        throw new Error("Can't parse domain " + fqdnRecord);
    }

    async.parallel([
        function(callback) {
            getPublicIP(function(err, ip) {
                if (err) {
                    console.error("Can't get public ip");
                }
                publicIp = ip;
                callback(err);
            });
        },

        function(callback) {
            gandi.getDomainInfo(domain, function(err, info) {
                if (err) {
                    callback(err);
                } else {
                    zoneId = info.zone_id;
                    gandi.getDomainZoneRecordList(zoneId, 0, {name: record, type: "A"}, function (err, result) {
                        if (!err && result.length > 0) {
                            currentRecordIP = result[0].value;
                            if (!isIpAddress(currentRecordIP)) {
                                throw new Error("Not an IP (" + fqdnRecord + "): " + currentRecordIP);
                            }
                            currentRecord = result[0];
                        } else {
                            currentRecord = {name: record, type: "A", phony: true};
                            currentRecordIP = "0.0.0.0";
                        }
                        callback(null);
                    });
                }
            });

        }
    ], function(err) {
        if (!err) {

            if (publicIp != currentRecordIP) {
                console.log("Record " + fqdnRecord + " not matching " + publicIp + " (" + currentRecordIP +"), updating now");
                createNewVersionAndAddRecord(gandi, domain, zoneId, currentRecord, publicIp, callback)
            } else {
                console.log("Record " + fqdnRecord + " is already matching " + publicIp);
                callback(null);
            }
        }
    })

}

async.each((Array.isArray(cfg)?cfg:[cfg]), function(config, callback) {
    console.log("Updating domain " + config["record"]);
    updateGandiRecord(config["api-key"], config["record"], callback);
}, function(err) {
    console.log(err?"Failed.":"Success.");
});