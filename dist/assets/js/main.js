(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* require */
var bimay 	= require('./module/bimay')
,	storage = require('./module/store');

setInterval(function () {
	$("#time").html(moment().format('h:mm:ss'));
	$("#date").html(moment().format('dddd, D MMMM YYYY'));
}, 1000);

storage.renderData();

$("#jadwalKuliah").on('click', function(e) {
	bimay.initial();
	return false;
});
},{"./module/bimay":2,"./module/store":3}],2:[function(require,module,exports){
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
},{"./store":3}],3:[function(require,module,exports){
module.exports = {

	storage: chrome.storage.local,

	getData: function(cb) {
		this.storage.get('bimay_schedule', function(result) {
			cb(result);
		});
	},

	storeData: function(data) {
		var self = this;
		this.storage.set({bimay_schedule: data}, function(result) {
			self.renderData();
		});
	},

	renderData: function() {
		var elm = $("#list-jadwal");
		elm.find("ul").empty();
		this.getData(function(data) {
			console.log(data);
			if(data.bimay_schedule.length) {
				$.each(data.bimay_schedule, function(i, d) {

					elm.find("ul").append(
					'<li>'
				+		'<p class="time">' + d.date + '</p>'
				+		'<p class="tim">' + d.time + '</p>'
				+		'<p class="kelas">' + d.clas + '</p>'
				+		'<p class="course">' + d.course.split('-')[1] + '</p>'
				+		'<p class="room">' + d.room + '</p>'
				+		'<p class="campus">' + d.building + '</p>'
				+	'</li>'
					);

					if(moment(d.date).format('DD-MM-YYYY') == moment().format('DD-MM-YYYY')) {
						elm.find("ul li:last-child").css({
							background: '#282828'
						,	color: '#FFF'
						});
					}
				});
			} else {
				elm.find("ul").append('<li><p class="not_found">No schedule found</p></li>');
			}
		})

	}

}
},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzb3VyY2UvanMvbWFpbiIsInNvdXJjZS9qcy9tb2R1bGUvYmltYXkuanMiLCJzb3VyY2UvanMvbW9kdWxlL3N0b3JlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiByZXF1aXJlICovXG52YXIgYmltYXkgXHQ9IHJlcXVpcmUoJy4vbW9kdWxlL2JpbWF5JylcbixcdHN0b3JhZ2UgPSByZXF1aXJlKCcuL21vZHVsZS9zdG9yZScpO1xuXG5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG5cdCQoXCIjdGltZVwiKS5odG1sKG1vbWVudCgpLmZvcm1hdCgnaDptbTpzcycpKTtcblx0JChcIiNkYXRlXCIpLmh0bWwobW9tZW50KCkuZm9ybWF0KCdkZGRkLCBEIE1NTU0gWVlZWScpKTtcbn0sIDEwMDApO1xuXG5zdG9yYWdlLnJlbmRlckRhdGEoKTtcblxuJChcIiNqYWR3YWxLdWxpYWhcIikub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuXHRiaW1heS5pbml0aWFsKCk7XG5cdHJldHVybiBmYWxzZTtcbn0pOyIsInZhclx0c3RvcmFnZSA9IHJlcXVpcmUoJy4vc3RvcmUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cblx0YmltYXk6ICdodHRwOi8vYmludXNtYXlhLmJpbnVzLmFjLmlkJyxcblx0X2JpbWF5QXBpOiAnaHR0cDovL2FwcHMuYmludXNtYXlhLmJpbnVzLmFjLmlkJyxcblxuXHRpbml0aWFsOiBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGluaSA9IHRoaXM7XG5cdFx0JC5nZXQoaW5pLmJpbWF5ICsgJy8nLCBmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHRpbmkuX2Nla0xvZ2luKGRhdGEsIGZ1bmN0aW9uKGhhc2lsKSB7XG5cdFx0XHRcdGlmKGhhc2lsID09IGZhbHNlKSB7XG5cdFx0XHRcdFx0aW5pLl9sb2dpbihkYXRhKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRpbmkuX2xvYWRNeUNsYXNzKGRhdGEpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0fSk7XG5cdFx0fSlcblx0XHQuZmFpbChmdW5jdGlvbigpIHtcblx0XHRcdGluaS5fZXJyKCdGYWlsZWQgdG8gbG9hZCBiaW51cyBtYXlhJyk7XG5cdFx0fSk7XG5cdH0sXG5cblx0X2Nla0xvZ2luOiBmdW5jdGlvbihkYXRhLCBjYWxsYmFjaykge1xuXHRcdHZhciB1c2VyID0gJChkYXRhKS5maW5kKFwiI2NvbnRlbnQgI3RvcGJhciAucmlnaHRcIik7XG5cdFx0aWYodXNlci5sZW5ndGggPiAwKSB7XG5cdFx0XHQkKFwiLnN1Yi1oZWFkZXIgPiBzcGFuXCIpLmh0bWwodXNlci5odG1sKCkpO1xuXHRcdFx0Y2FsbGJhY2soZGF0YSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGNhbGxiYWNrKGZhbHNlKTtcblx0XHR9XG5cblx0fSxcblxuXHQvKiBsb2dpbiAqL1xuXHRfbG9naW46IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHR2YXIgaW5pID0gdGhpcztcblx0XHRpbmkuX2RvTG9naW4oKTtcblx0XHRcblx0fSxcblxuXHRfZG9Mb2dpbjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGluaSA9IHRoaXM7XG5cdFx0Y2hyb21lLndpbmRvd3MuY3JlYXRlKHsndXJsJzogaW5pLmJpbWF5ICsgJy9EZWZhdWx0LmFzcHgjYmltYXlleHRzJywgJ3R5cGUnOiAncG9wdXAnLCAnd2lkdGgnOiA2NTIsICdoZWlnaHQnOiA1MTB9LCBmdW5jdGlvbih3aW5kb3cpIHtcblx0XHR9KTtcblx0XHRcblx0fSxcblxuXHRfbG9hZE15Q2xhc3M6IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHQvKiBUbyBtdWNoIFNlY3VyaXR5ICovXG5cdFx0dmFyIGluaSA9IHRoaXM7XG5cdFx0dmFyIHVybCA9IGluaS5iaW1heSArICQoZGF0YSkuZmluZCgnLml0ZW1Db250ZW50OmVxKDApIHVsIGxpOmVxKDApID4gYScpLmF0dHIoJ2hyZWYnKTtcblx0XHQkLmdldCh1cmwsIGZ1bmN0aW9uKGRhdGEpIHtcblxuXHRcdFx0JC5nZXQoaW5pLmJpbWF5ICsgJChkYXRhKS5maW5kKFwiI2N0bDAwX2NwMV9pZnJBcHBcIikuYXR0cignc3JjJyksIGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdFx0JC5nZXQoJChkYXRhKS5maW5kKFwiI2lmckFwcFwiKS5hdHRyKCdzcmMnKSwgZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0XHRcdGluaS5fbG9hZFNjaGVkdWxlKGRhdGEsIGZ1bmN0aW9uKHRvZGF5LCBuZXh0KSB7XG5cdFx0XHRcdFx0XHR2YXIgdG9kYXkgPSBpbmkuX3RvSnNvbih0b2RheSk7XG5cdFx0XHRcdFx0XHR2YXIgbmV4dCAgPSBpbmkuX3RvSnNvbihuZXh0KTtcblx0XHRcdFx0XHRcdHN0b3JhZ2Uuc3RvcmVEYXRhKHRvZGF5LmNvbmNhdChuZXh0KSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0pXG5cdFx0XHRcdC5mYWlsKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGluaS5fZXJyKCdGYWlsZWQgdG8gbG9hZCBiaW51cyBtYXlhJyk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSlcblx0XHRcdC5mYWlsKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRpbmkuX2VycignRmFpbGVkIHRvIGxvYWQgYmludXMgbWF5YScpO1xuXHRcdFx0fSk7XG5cdFx0fSlcblx0XHQuZmFpbChmdW5jdGlvbigpIHtcblx0XHRcdGluaS5fZXJyKCdGYWlsZWQgdG8gbG9hZCBiaW51cyBtYXlhJyk7XG5cdFx0fSk7XG5cdH0sXG5cblx0X2xvYWRTY2hlZHVsZTogZnVuY3Rpb24oZGF0YSwgY2IpIHtcblx0XHR2YXIgX2VsbSA9ICQoZGF0YSlcblx0XHQsXHR1cmwgPSB0aGlzLl9iaW1heUFwaSArICcvTE1TL015Q2xhc3MuYXNweCdcblx0XHQsXHRpbmkgPSB0aGlzO1xuXHRcdCQucG9zdCh1cmwsIHtcblx0XHRcdCdfX0VWRU5UVEFSR0VUJzogJ2N0bDAwJENvbnRlbnRQbGFjZUhvbGRlcjEkYnRuU2NoZWR1bGUnLFxuXHRcdFx0J19fRVZFTlRWQUxJREFUSU9OJzogX2VsbS5maW5kKCcjX19FVkVOVFZBTElEQVRJT04nKS52YWwoKSxcblx0XHRcdCdfX1ZJRVdTVEFURSc6IF9lbG0uZmluZCgnI19fVklFV1NUQVRFJykudmFsKCksXG5cdFx0XHQnX19WSUVXU1RBVEVHRU5FUkFUT1InOiBfZWxtLmZpbmQoJyNfX1ZJRVdTVEFURUdFTkVSQVRPUicpLnZhbCgpLFxuXHRcdFx0J19fY3RsMDAkQ29udGVudFBsYWNlSG9sZGVyMSRkZGxQZXJpb2QnOiBfZWxtLmZpbmQoXCJvcHRpb246c2VsZWN0ZWRcIikudmFsKClcblx0XHR9LCBmdW5jdGlvbihkYXRhKSB7XG5cblx0XHRcdC8vIExJU1QgU0NIRURVTEVcblx0XHRcdHZhciBfc2NoZWR1bGUgPSAkKGRhdGEpLmZpbmQoXCJ0YWJsZVwiKVxuXHRcdFx0LFx0X3RvZGF5ID0gX3NjaGVkdWxlLmVxKDApLmh0bWwoKVxuXHRcdFx0LFx0X25leHQgPSBfc2NoZWR1bGUuZXEoMSkuaHRtbCgpO1xuXG5cdFx0XHRjYihfdG9kYXksIF9uZXh0KTtcblx0XHR9KVxuXHRcdC5mYWlsKGZ1bmN0aW9uKCkge1xuXHRcdFx0aW5pLl9lcnIoJ0ZhaWxlZCB0byBsb2FkIGJpbnVzIG1heWEnKTtcblx0XHR9KTtcblx0fSxcblxuXHRfZXJyOiBmdW5jdGlvbigpIHtcblx0XHRhbGVydCgnZXJyb3IgbG9hZGluZyBkYXRhLi4uJyk7XG5cdH0sXG5cblx0X2xvYWRpbmc6IGZ1bmN0aW9uKCkge1xuXHRcdCQoXCIubG9hZGluZy1jb250YWluZXJcIikucmVtb3ZlQ2xhc3MoJ3N1Y2Nlc3MnKTtcblx0XHQkKFwiLm91dGVyLWNvbnRlbnQgPiBkaXZcIikuYWRkQ2xhc3MoJ2hpZGUtbG9hZGluZycpO1xuXHR9LFxuXG5cdF9sb2FkaW5nRW5kOiBmdW5jdGlvbihlbG0pIHtcblx0XHQkKFwiLmxvYWRpbmctY29udGFpbmVyXCIpLmFkZENsYXNzKCdzdWNjZXNzJyk7XG5cdFx0JChlbG0pLnJlbW92ZUNsYXNzKCdoaWRlLWxvYWRpbmcnKTtcblx0fSxcblxuXHRfdG9Kc29uOiBmdW5jdGlvbihkYXRhKSB7XG5cdFx0dmFyIGhhc2lsID0gW107XG5cdFx0JChkYXRhKS5maW5kKCd0cicpLmVhY2goZnVuY3Rpb24oaSwgYSkge1xuXHRcdFx0dmFyIGh0ID0gJCh0aGlzKS5maW5kKCd0ZCcpO1xuXHRcdFx0aWYoaSA+IDApIHtcblx0XHRcdFx0aGFzaWwucHVzaCh7XG5cdFx0XHRcdFx0XHRkYXRlOiBodC5lcSgwKS5odG1sKClcblx0XHRcdFx0XHQsXHR0aW1lOiBodC5lcSgxKS5odG1sKClcblx0XHRcdFx0XHQsXHRzdGF0ZTogaHQuZXEoMikuaHRtbCgpXG5cdFx0XHRcdFx0LFx0Y291cnNlOiBodC5lcSgzKS5odG1sKClcblx0XHRcdFx0XHQsXHRjbGFzOiBodC5lcSg1KS5odG1sKClcblx0XHRcdFx0XHQsXHRyb29tOiBodC5lcSg2KS5odG1sKClcblx0XHRcdFx0XHQsXHRidWlsZGluZzogaHQuZXEoNykuaHRtbCgpXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHJldHVybiBoYXNpbDtcblx0fVxuXG59OyIsIm1vZHVsZS5leHBvcnRzID0ge1xuXG5cdHN0b3JhZ2U6IGNocm9tZS5zdG9yYWdlLmxvY2FsLFxuXG5cdGdldERhdGE6IGZ1bmN0aW9uKGNiKSB7XG5cdFx0dGhpcy5zdG9yYWdlLmdldCgnYmltYXlfc2NoZWR1bGUnLCBmdW5jdGlvbihyZXN1bHQpIHtcblx0XHRcdGNiKHJlc3VsdCk7XG5cdFx0fSk7XG5cdH0sXG5cblx0c3RvcmVEYXRhOiBmdW5jdGlvbihkYXRhKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdHRoaXMuc3RvcmFnZS5zZXQoe2JpbWF5X3NjaGVkdWxlOiBkYXRhfSwgZnVuY3Rpb24ocmVzdWx0KSB7XG5cdFx0XHRzZWxmLnJlbmRlckRhdGEoKTtcblx0XHR9KTtcblx0fSxcblxuXHRyZW5kZXJEYXRhOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgZWxtID0gJChcIiNsaXN0LWphZHdhbFwiKTtcblx0XHRlbG0uZmluZChcInVsXCIpLmVtcHR5KCk7XG5cdFx0dGhpcy5nZXREYXRhKGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdGNvbnNvbGUubG9nKGRhdGEpO1xuXHRcdFx0aWYoZGF0YS5iaW1heV9zY2hlZHVsZS5sZW5ndGgpIHtcblx0XHRcdFx0JC5lYWNoKGRhdGEuYmltYXlfc2NoZWR1bGUsIGZ1bmN0aW9uKGksIGQpIHtcblxuXHRcdFx0XHRcdGVsbS5maW5kKFwidWxcIikuYXBwZW5kKFxuXHRcdFx0XHRcdCc8bGk+J1xuXHRcdFx0XHQrXHRcdCc8cCBjbGFzcz1cInRpbWVcIj4nICsgZC5kYXRlICsgJzwvcD4nXG5cdFx0XHRcdCtcdFx0JzxwIGNsYXNzPVwidGltXCI+JyArIGQudGltZSArICc8L3A+J1xuXHRcdFx0XHQrXHRcdCc8cCBjbGFzcz1cImtlbGFzXCI+JyArIGQuY2xhcyArICc8L3A+J1xuXHRcdFx0XHQrXHRcdCc8cCBjbGFzcz1cImNvdXJzZVwiPicgKyBkLmNvdXJzZS5zcGxpdCgnLScpWzFdICsgJzwvcD4nXG5cdFx0XHRcdCtcdFx0JzxwIGNsYXNzPVwicm9vbVwiPicgKyBkLnJvb20gKyAnPC9wPidcblx0XHRcdFx0K1x0XHQnPHAgY2xhc3M9XCJjYW1wdXNcIj4nICsgZC5idWlsZGluZyArICc8L3A+J1xuXHRcdFx0XHQrXHQnPC9saT4nXG5cdFx0XHRcdFx0KTtcblxuXHRcdFx0XHRcdGlmKG1vbWVudChkLmRhdGUpLmZvcm1hdCgnREQtTU0tWVlZWScpID09IG1vbWVudCgpLmZvcm1hdCgnREQtTU0tWVlZWScpKSB7XG5cdFx0XHRcdFx0XHRlbG0uZmluZChcInVsIGxpOmxhc3QtY2hpbGRcIikuY3NzKHtcblx0XHRcdFx0XHRcdFx0YmFja2dyb3VuZDogJyMyODI4MjgnXG5cdFx0XHRcdFx0XHQsXHRjb2xvcjogJyNGRkYnXG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZWxtLmZpbmQoXCJ1bFwiKS5hcHBlbmQoJzxsaT48cCBjbGFzcz1cIm5vdF9mb3VuZFwiPk5vIHNjaGVkdWxlIGZvdW5kPC9wPjwvbGk+Jyk7XG5cdFx0XHR9XG5cdFx0fSlcblxuXHR9XG5cbn0iXX0=
