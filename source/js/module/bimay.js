var	storage = require('./store');

module.exports = {

	bimay: 'http://binusmaya.binus.ac.id',
	_bimayApi: 'http://apps.binusmaya.binus.ac.id',

	initial: function () {
		var ini = this;
		$.get(ini.bimay + '/', function(data) {
			ini._cekLogin(data, function(hasil) {
				if(hasil == false) {
					ini._login(data);
				} else {
					ini._loadMyClass(data);
				}
				
			});
		})
		.fail(function() {
			ini._err('Failed to load binus maya');
		});
	},

	_cekLogin: function(data, callback) {
		var user = $(data).find("#content #topbar .right");
		if(user.length > 0) {
			$(".sub-header > span").html(user.html());
			callback(data);
		} else {
			callback(false);
		}

	},

	/* login */
	_login: function(data) {
		var ini = this;
		ini._doLogin();
		
	},

	_doLogin: function() {
		var ini = this;
		chrome.windows.create({'url': ini.bimay + '/Default.aspx#bimayexts', 'type': 'popup', 'width': 652, 'height': 510}, function(window) {
		});
		
	},

	_loadMyClass: function(data) {
		/* To much Security */
		var ini = this;
		var url = ini.bimay + $(data).find('.itemContent:eq(0) ul li:eq(0) > a').attr('href');
		$.get(url, function(data) {

			$.get(ini.bimay + $(data).find("#ctl00_cp1_ifrApp").attr('src'), function(data) {
				$.get($(data).find("#ifrApp").attr('src'), function(data) {
					ini._loadSchedule(data, function(today, next) {
						var today = ini._toJson(today);
						var next  = ini._toJson(next);
						storage.storeData(today.concat(next));
					});
				})
				.fail(function() {
					ini._err('Failed to load binus maya');
				});
			})
			.fail(function() {
				ini._err('Failed to load binus maya');
			});
		})
		.fail(function() {
			ini._err('Failed to load binus maya');
		});
	},

	_loadSchedule: function(data, cb) {
		var _elm = $(data)
		,	url = this._bimayApi + '/LMS/MyClass.aspx'
		,	ini = this;
		$.post(url, {
			'__EVENTTARGET': 'ctl00$ContentPlaceHolder1$btnSchedule',
			'__EVENTVALIDATION': _elm.find('#__EVENTVALIDATION').val(),
			'__VIEWSTATE': _elm.find('#__VIEWSTATE').val(),
			'__VIEWSTATEGENERATOR': _elm.find('#__VIEWSTATEGENERATOR').val(),
			'__ctl00$ContentPlaceHolder1$ddlPeriod': _elm.find("option:selected").val()
		}, function(data) {

			// LIST SCHEDULE
			var _schedule = $(data).find("table")
			,	_today = _schedule.eq(0).html()
			,	_next = _schedule.eq(1).html();

			cb(_today, _next);
		})
		.fail(function() {
			ini._err('Failed to load binus maya');
		});
	},

	_err: function() {
		alert('error loading data...');
	},

	_loading: function() {
		$(".loading-container").removeClass('success');
		$(".outer-content > div").addClass('hide-loading');
	},

	_loadingEnd: function(elm) {
		$(".loading-container").addClass('success');
		$(elm).removeClass('hide-loading');
	},

	_toJson: function(data) {
		var hasil = [];
		$(data).find('tr').each(function(i, a) {
			var ht = $(this).find('td');
			if(i > 0) {
				hasil.push({
						date: ht.eq(0).html()
					,	time: ht.eq(1).html()
					,	state: ht.eq(2).html()
					,	course: ht.eq(3).html()
					,	clas: ht.eq(5).html()
					,	room: ht.eq(6).html()
					,	building: ht.eq(7).html()
				});
			}
		});
		return hasil;
	}

};