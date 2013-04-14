function StorageBase (){ }

StorageBase.prototype._get_key = function (service, callback){
	return service.host.host + service.host.port + service.url;
};

StorageBase.prototype.get_status = function (service, callback){
	callback(null, null);
};

StorageBase.prototype.update_status = function (service, status, callback){
	callback(null);
};

//----------------------------------------------
// Reporting
//----------------------------------------------
StorageBase.prototype.report_all = function (callback){
	callback(null, null);
};

StorageBase.prototype.report_one = function (service, callback){
	callback(null, null);
};

StorageBase.prototype.quit = function (callback){

};

module.exports = StorageBase;