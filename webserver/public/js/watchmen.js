var interval = 2500; //ms
var _data = null;
var _timer = null;

var watchmen_client = {

	currentSort : [],

	bind : function (data, filter){
		var self = this;
		var display_data = {};

		if (filter){
			//ECMA 5 filter
			display_data.services = data.services.filter(function(item){
				return item.url_info.indexOf(filter)>-1;
			});
		}
		else{
			display_data = data;
		}

		//------------------------------------------
		// List of all services
		//------------------------------------------
		var template_list = Handlebars.compile($("#services_list_template").html());
		$('#data_holder').html(template_list(display_data));

		//------------------------------------------
		// Counters
		//------------------------------------------
		var template_totals = Handlebars.compile($("#totals_template").html());
		var totals_data = {};

		function up(service){
			return (service.data && service.data.status === "success");
		}

		function disabled(service){
			return (!service.enabled);
		}

		totals_data.all = display_data.services.length;
		totals_data.up = display_data.services.filter(up).length;
		totals_data.disabled = display_data.services.filter(disabled).length;
		totals_data.down = totals_data.all - totals_data.up - totals_data.disabled;
		$('#totals_holder').html(template_totals(totals_data));

		//------------------------------------------
		// Config table sorter, remember sort options
		//------------------------------------------
		if (display_data.services.length){
			$("table.sorted").tablesorter({
				headers: {8: {sorter: 'percent'}, 9: {sorter: false}},
				sortList: self.currentSort
			}).bind("sortEnd", function(sorter) {
				self.currentSort = sorter.target.config.sortList;
			});
		}

		self.resetTimer();
	},

	resetTimer : function(){
		var self = this;
		clearTimeout(_timer);
		_timer = setTimeout (function(){self.refresh.call(self);}, interval);
	},

	refresh : function (){
		var self = this;
		$.ajax({ url: '/getdata', data: {}, dataType: 'json', success: function (data) {
			_data = data;
			self.bind(data, $('#filter').val());

			//------------------------------------------
			// Next tick
			//------------------------------------------
			self.resetTimer();
			}
		});
	}
};