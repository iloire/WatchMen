var util = require ('util');

function StorageMocked(mocked_status){
	this.status = mocked_status;
}

util.inherits(StorageMocked, require ('../../../lib/storage/base'));

StorageMocked.prototype.get_status = function (service, callback){
	callback(null, this.status);
};

module.exports = StorageMocked;