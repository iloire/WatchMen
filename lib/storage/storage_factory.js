//fetch storage according to settings
var provider_name = require ('../../config/storage').provider;

module.exports = {
	get_storage_instance : function (){
		var options = require ('../../config/storage').options[provider_name];
		var provider = require ('./providers/' + provider_name);
		return new provider(options);
	}
};