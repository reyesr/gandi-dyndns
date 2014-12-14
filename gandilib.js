var xmlrpc = require('xmlrpc');

function GandiRpc(apiKey, configuration) {
    if (!(this instanceof  GandiRpc)) {
        return new GandiRpc(configuration);
    }

    configuration = configuration || {};
    this.api = xmlrpc.createSecureClient({
        host: configuration.host || 'rpc.gandi.net',
        port: configuration.port || 443,
        path: configuration.path || '/xmlrpc/' });

    this.apiKey = apiKey;
}

GandiRpc.prototype.apiCall = function(command, args, callback) {
    this.api.methodCall(command, Array.isArray(args)?args:[args], function (error, value) {
        if (error) {
            console.error("XmlRpx error:", error);
            throw new Error("XmlRpc error on " + command + " (" +  JSON.stringify(args) + ")");
        }
        callback(error, value);
    });
}

GandiRpc.prototype.getVersion = function(callback) {
    this.apiCall('version.info', this.apiKey, function(err, value) { callback(err, value.api_version)});
};

GandiRpc.prototype.getDomainInfo = function(domain, callback) {
    this.apiCall('domain.info', [this.apiKey, domain], callback);
};

GandiRpc.prototype.getDomainZoneRecordList = function(zoneId, fileversion, options, callback) {
    this.apiCall('domain.zone.record.list', [this.apiKey, zoneId, fileversion || 0, options || {}], callback);
};

// domain.zone.version.new(apikey, zone_id[, version_id=0])
GandiRpc.prototype.getDomainZoneVersionNew = function(zoneId, callback) {
    this.apiCall('domain.zone.version.new', [this.apiKey, zoneId], callback);
};

GandiRpc.prototype.getDomainZoneVersionNew = function(zoneId, callback) {
    this.apiCall('domain.zone.version.new', [this.apiKey, zoneId], callback);
};

GandiRpc.prototype.getDomainZoneRecordUpdate = function(zoneId, versionId, oldRecord, newRecord, callback) {
    this.apiCall('domain.zone.record.update', [this.apiKey, zoneId, versionId, oldRecord, newRecord], callback);
};

GandiRpc.prototype.getDomainZoneRecordDelete = function(zoneId, versionId, record, callback) {
    console.log("gandi delete ", record);
    this.apiCall('domain.zone.record.delete', [this.apiKey, zoneId, versionId, record], callback);
};

GandiRpc.prototype.getDomainZoneRecordAdd = function(zoneId, versionId, record, callback) {
    this.apiCall('domain.zone.record.add', [this.apiKey, zoneId, versionId, record], callback);
};

GandiRpc.prototype.getDomainZoneVersionSet = function(zoneId, versionId, callback) {
    this.apiCall('domain.zone.version.set', [this.apiKey, zoneId, versionId], callback);
};

GandiRpc.prototype.getDomainZoneSet = function(domain, zoneId, callback) {
    this.apiCall('domain.zone.set', [this.apiKey, domain, zoneId], callback);
};

exports.GandiRpc = GandiRpc;