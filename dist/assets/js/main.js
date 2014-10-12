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
		ini._setState("Check Login ...");
		$.get(ini.bimay + '/', function(data) {
			ini._cekLogin(data, function(hasil) {
				if(hasil == false) {
					ini._setState("");
					ini._login(data);
				} else {
					ini._setState("Stage MyClass ...");
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
		ini._setState("Loading My Class ...");
		$.get(url, function(data) {
			ini._setState("Loading My Class ...");
			$.get(ini.bimay + $(data).find("#ctl00_cp1_ifrApp").attr('src'), function(data) {
				ini._setState("Loading stage Frame ...");
				$.get($(data).find("#ifrApp").attr('src'), function(data) {
					ini._setState("Loading schedule ...");
					ini._loadSchedule(data, function(today, next) {
						ini._setState("");
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

	_setState: function(state) {
		$(".loading-state").text(state);
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

					//Make short code
					if(d.state.split(" ")[1]) {
						var state = '';
						var sta = d.state.split(" ");
						for(i=0; i < sta.length;i++) {
							state += sta[i][0];
						}
					} else {
						var state = d.state;
					}

					elm.find("ul").append(
					'<li>'
				+		'<p class="time">' + d.date + '</p>'
				+		'<p class="tim">' + d.time + '</p>'
				+		'<p class="kelas">' + d.clas + '</p>'
				+		'<p class="state" title="' + d.state + '">' + state + '</p>'
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzb3VyY2UvanMvbWFpbiIsInNvdXJjZS9qcy9tb2R1bGUvYmltYXkuanMiLCJzb3VyY2UvanMvbW9kdWxlL3N0b3JlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyogcmVxdWlyZSAqL1xudmFyIGJpbWF5IFx0PSByZXF1aXJlKCcuL21vZHVsZS9iaW1heScpXG4sXHRzdG9yYWdlID0gcmVxdWlyZSgnLi9tb2R1bGUvc3RvcmUnKTtcblxuc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuXHQkKFwiI3RpbWVcIikuaHRtbChtb21lbnQoKS5mb3JtYXQoJ2g6bW06c3MnKSk7XG5cdCQoXCIjZGF0ZVwiKS5odG1sKG1vbWVudCgpLmZvcm1hdCgnZGRkZCwgRCBNTU1NIFlZWVknKSk7XG59LCAxMDAwKTtcblxuc3RvcmFnZS5yZW5kZXJEYXRhKCk7XG5cbiQoXCIjamFkd2FsS3VsaWFoXCIpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0YmltYXkuaW5pdGlhbCgpO1xuXHRyZXR1cm4gZmFsc2U7XG59KTsiLCJ2YXJcdHN0b3JhZ2UgPSByZXF1aXJlKCcuL3N0b3JlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXG5cdGJpbWF5OiAnaHR0cDovL2JpbnVzbWF5YS5iaW51cy5hYy5pZCcsXG5cdF9iaW1heUFwaTogJ2h0dHA6Ly9hcHBzLmJpbnVzbWF5YS5iaW51cy5hYy5pZCcsXG5cblx0aW5pdGlhbDogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBpbmkgPSB0aGlzO1xuXHRcdGluaS5fc2V0U3RhdGUoXCJDaGVjayBMb2dpbiAuLi5cIik7XG5cdFx0JC5nZXQoaW5pLmJpbWF5ICsgJy8nLCBmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHRpbmkuX2Nla0xvZ2luKGRhdGEsIGZ1bmN0aW9uKGhhc2lsKSB7XG5cdFx0XHRcdGlmKGhhc2lsID09IGZhbHNlKSB7XG5cdFx0XHRcdFx0aW5pLl9zZXRTdGF0ZShcIlwiKTtcblx0XHRcdFx0XHRpbmkuX2xvZ2luKGRhdGEpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGluaS5fc2V0U3RhdGUoXCJTdGFnZSBNeUNsYXNzIC4uLlwiKTtcblx0XHRcdFx0XHRpbmkuX2xvYWRNeUNsYXNzKGRhdGEpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0fSk7XG5cdFx0fSlcblx0XHQuZmFpbChmdW5jdGlvbigpIHtcblx0XHRcdGluaS5fZXJyKCdGYWlsZWQgdG8gbG9hZCBiaW51cyBtYXlhJyk7XG5cdFx0fSk7XG5cdH0sXG5cblx0X2Nla0xvZ2luOiBmdW5jdGlvbihkYXRhLCBjYWxsYmFjaykge1xuXHRcdHZhciB1c2VyID0gJChkYXRhKS5maW5kKFwiI2NvbnRlbnQgI3RvcGJhciAucmlnaHRcIik7XG5cdFx0aWYodXNlci5sZW5ndGggPiAwKSB7XG5cdFx0XHQkKFwiLnN1Yi1oZWFkZXIgPiBzcGFuXCIpLmh0bWwodXNlci5odG1sKCkpO1xuXHRcdFx0Y2FsbGJhY2soZGF0YSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGNhbGxiYWNrKGZhbHNlKTtcblx0XHR9XG5cblx0fSxcblxuXHQvKiBsb2dpbiAqL1xuXHRfbG9naW46IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHR2YXIgaW5pID0gdGhpcztcblx0XHRpbmkuX2RvTG9naW4oKTtcblx0XHRcblx0fSxcblxuXHRfZG9Mb2dpbjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGluaSA9IHRoaXM7XG5cdFx0Y2hyb21lLndpbmRvd3MuY3JlYXRlKHsndXJsJzogaW5pLmJpbWF5ICsgJy9EZWZhdWx0LmFzcHgjYmltYXlleHRzJywgJ3R5cGUnOiAncG9wdXAnLCAnd2lkdGgnOiA2NTIsICdoZWlnaHQnOiA1MTB9LCBmdW5jdGlvbih3aW5kb3cpIHtcblx0XHR9KTtcblx0XHRcblx0fSxcblxuXHRfbG9hZE15Q2xhc3M6IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHQvKiBUbyBtdWNoIFNlY3VyaXR5ICovXG5cdFx0dmFyIGluaSA9IHRoaXM7XG5cdFx0dmFyIHVybCA9IGluaS5iaW1heSArICQoZGF0YSkuZmluZCgnLml0ZW1Db250ZW50OmVxKDApIHVsIGxpOmVxKDApID4gYScpLmF0dHIoJ2hyZWYnKTtcblx0XHRpbmkuX3NldFN0YXRlKFwiTG9hZGluZyBNeSBDbGFzcyAuLi5cIik7XG5cdFx0JC5nZXQodXJsLCBmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHRpbmkuX3NldFN0YXRlKFwiTG9hZGluZyBNeSBDbGFzcyAuLi5cIik7XG5cdFx0XHQkLmdldChpbmkuYmltYXkgKyAkKGRhdGEpLmZpbmQoXCIjY3RsMDBfY3AxX2lmckFwcFwiKS5hdHRyKCdzcmMnKSwgZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0XHRpbmkuX3NldFN0YXRlKFwiTG9hZGluZyBzdGFnZSBGcmFtZSAuLi5cIik7XG5cdFx0XHRcdCQuZ2V0KCQoZGF0YSkuZmluZChcIiNpZnJBcHBcIikuYXR0cignc3JjJyksIGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdFx0XHRpbmkuX3NldFN0YXRlKFwiTG9hZGluZyBzY2hlZHVsZSAuLi5cIik7XG5cdFx0XHRcdFx0aW5pLl9sb2FkU2NoZWR1bGUoZGF0YSwgZnVuY3Rpb24odG9kYXksIG5leHQpIHtcblx0XHRcdFx0XHRcdGluaS5fc2V0U3RhdGUoXCJcIik7XG5cdFx0XHRcdFx0XHR2YXIgdG9kYXkgPSBpbmkuX3RvSnNvbih0b2RheSk7XG5cdFx0XHRcdFx0XHR2YXIgbmV4dCAgPSBpbmkuX3RvSnNvbihuZXh0KTtcblx0XHRcdFx0XHRcdHN0b3JhZ2Uuc3RvcmVEYXRhKHRvZGF5LmNvbmNhdChuZXh0KSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0pXG5cdFx0XHRcdC5mYWlsKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGluaS5fZXJyKCdGYWlsZWQgdG8gbG9hZCBiaW51cyBtYXlhJyk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSlcblx0XHRcdC5mYWlsKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRpbmkuX2VycignRmFpbGVkIHRvIGxvYWQgYmludXMgbWF5YScpO1xuXHRcdFx0fSk7XG5cdFx0fSlcblx0XHQuZmFpbChmdW5jdGlvbigpIHtcblx0XHRcdGluaS5fZXJyKCdGYWlsZWQgdG8gbG9hZCBiaW51cyBtYXlhJyk7XG5cdFx0fSk7XG5cdH0sXG5cblx0X2xvYWRTY2hlZHVsZTogZnVuY3Rpb24oZGF0YSwgY2IpIHtcblx0XHR2YXIgX2VsbSA9ICQoZGF0YSlcblx0XHQsXHR1cmwgPSB0aGlzLl9iaW1heUFwaSArICcvTE1TL015Q2xhc3MuYXNweCdcblx0XHQsXHRpbmkgPSB0aGlzO1xuXHRcdCQucG9zdCh1cmwsIHtcblx0XHRcdCdfX0VWRU5UVEFSR0VUJzogJ2N0bDAwJENvbnRlbnRQbGFjZUhvbGRlcjEkYnRuU2NoZWR1bGUnLFxuXHRcdFx0J19fRVZFTlRWQUxJREFUSU9OJzogX2VsbS5maW5kKCcjX19FVkVOVFZBTElEQVRJT04nKS52YWwoKSxcblx0XHRcdCdfX1ZJRVdTVEFURSc6IF9lbG0uZmluZCgnI19fVklFV1NUQVRFJykudmFsKCksXG5cdFx0XHQnX19WSUVXU1RBVEVHRU5FUkFUT1InOiBfZWxtLmZpbmQoJyNfX1ZJRVdTVEFURUdFTkVSQVRPUicpLnZhbCgpLFxuXHRcdFx0J19fY3RsMDAkQ29udGVudFBsYWNlSG9sZGVyMSRkZGxQZXJpb2QnOiBfZWxtLmZpbmQoXCJvcHRpb246c2VsZWN0ZWRcIikudmFsKClcblx0XHR9LCBmdW5jdGlvbihkYXRhKSB7XG5cblx0XHRcdC8vIExJU1QgU0NIRURVTEVcblx0XHRcdHZhciBfc2NoZWR1bGUgPSAkKGRhdGEpLmZpbmQoXCJ0YWJsZVwiKVxuXHRcdFx0LFx0X3RvZGF5ID0gX3NjaGVkdWxlLmVxKDApLmh0bWwoKVxuXHRcdFx0LFx0X25leHQgPSBfc2NoZWR1bGUuZXEoMSkuaHRtbCgpO1xuXG5cdFx0XHRjYihfdG9kYXksIF9uZXh0KTtcblx0XHR9KVxuXHRcdC5mYWlsKGZ1bmN0aW9uKCkge1xuXHRcdFx0aW5pLl9lcnIoJ0ZhaWxlZCB0byBsb2FkIGJpbnVzIG1heWEnKTtcblx0XHR9KTtcblx0fSxcblxuXHRfZXJyOiBmdW5jdGlvbigpIHtcblx0XHRhbGVydCgnZXJyb3IgbG9hZGluZyBkYXRhLi4uJyk7XG5cdH0sXG5cblx0X2xvYWRpbmc6IGZ1bmN0aW9uKCkge1xuXHRcdCQoXCIubG9hZGluZy1jb250YWluZXJcIikucmVtb3ZlQ2xhc3MoJ3N1Y2Nlc3MnKTtcblx0XHQkKFwiLm91dGVyLWNvbnRlbnQgPiBkaXZcIikuYWRkQ2xhc3MoJ2hpZGUtbG9hZGluZycpO1xuXHR9LFxuXG5cdF9sb2FkaW5nRW5kOiBmdW5jdGlvbihlbG0pIHtcblx0XHQkKFwiLmxvYWRpbmctY29udGFpbmVyXCIpLmFkZENsYXNzKCdzdWNjZXNzJyk7XG5cdFx0JChlbG0pLnJlbW92ZUNsYXNzKCdoaWRlLWxvYWRpbmcnKTtcblx0fSxcblxuXHRfc2V0U3RhdGU6IGZ1bmN0aW9uKHN0YXRlKSB7XG5cdFx0JChcIi5sb2FkaW5nLXN0YXRlXCIpLnRleHQoc3RhdGUpO1xuXHR9LFxuXG5cdF90b0pzb246IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHR2YXIgaGFzaWwgPSBbXTtcblx0XHQkKGRhdGEpLmZpbmQoJ3RyJykuZWFjaChmdW5jdGlvbihpLCBhKSB7XG5cdFx0XHR2YXIgaHQgPSAkKHRoaXMpLmZpbmQoJ3RkJyk7XG5cdFx0XHRpZihpID4gMCkge1xuXHRcdFx0XHRoYXNpbC5wdXNoKHtcblx0XHRcdFx0XHRcdGRhdGU6IGh0LmVxKDApLmh0bWwoKVxuXHRcdFx0XHRcdCxcdHRpbWU6IGh0LmVxKDEpLmh0bWwoKVxuXHRcdFx0XHRcdCxcdHN0YXRlOiBodC5lcSgyKS5odG1sKClcblx0XHRcdFx0XHQsXHRjb3Vyc2U6IGh0LmVxKDMpLmh0bWwoKVxuXHRcdFx0XHRcdCxcdGNsYXM6IGh0LmVxKDUpLmh0bWwoKVxuXHRcdFx0XHRcdCxcdHJvb206IGh0LmVxKDYpLmh0bWwoKVxuXHRcdFx0XHRcdCxcdGJ1aWxkaW5nOiBodC5lcSg3KS5odG1sKClcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0cmV0dXJuIGhhc2lsO1xuXHR9XG5cbn07IiwibW9kdWxlLmV4cG9ydHMgPSB7XG5cblx0c3RvcmFnZTogY2hyb21lLnN0b3JhZ2UubG9jYWwsXG5cblx0Z2V0RGF0YTogZnVuY3Rpb24oY2IpIHtcblx0XHR0aGlzLnN0b3JhZ2UuZ2V0KCdiaW1heV9zY2hlZHVsZScsIGZ1bmN0aW9uKHJlc3VsdCkge1xuXHRcdFx0Y2IocmVzdWx0KTtcblx0XHR9KTtcblx0fSxcblxuXHRzdG9yZURhdGE6IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0dGhpcy5zdG9yYWdlLnNldCh7YmltYXlfc2NoZWR1bGU6IGRhdGF9LCBmdW5jdGlvbihyZXN1bHQpIHtcblx0XHRcdHNlbGYucmVuZGVyRGF0YSgpO1xuXHRcdH0pO1xuXHR9LFxuXG5cdHJlbmRlckRhdGE6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBlbG0gPSAkKFwiI2xpc3QtamFkd2FsXCIpO1xuXHRcdGVsbS5maW5kKFwidWxcIikuZW1wdHkoKTtcblx0XHR0aGlzLmdldERhdGEoZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0Y29uc29sZS5sb2coZGF0YSk7XG5cdFx0XHRpZihkYXRhLmJpbWF5X3NjaGVkdWxlLmxlbmd0aCkge1xuXHRcdFx0XHQkLmVhY2goZGF0YS5iaW1heV9zY2hlZHVsZSwgZnVuY3Rpb24oaSwgZCkge1xuXG5cdFx0XHRcdFx0Ly9NYWtlIHNob3J0IGNvZGVcblx0XHRcdFx0XHRpZihkLnN0YXRlLnNwbGl0KFwiIFwiKVsxXSkge1xuXHRcdFx0XHRcdFx0dmFyIHN0YXRlID0gJyc7XG5cdFx0XHRcdFx0XHR2YXIgc3RhID0gZC5zdGF0ZS5zcGxpdChcIiBcIik7XG5cdFx0XHRcdFx0XHRmb3IoaT0wOyBpIDwgc3RhLmxlbmd0aDtpKyspIHtcblx0XHRcdFx0XHRcdFx0c3RhdGUgKz0gc3RhW2ldWzBdO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHR2YXIgc3RhdGUgPSBkLnN0YXRlO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGVsbS5maW5kKFwidWxcIikuYXBwZW5kKFxuXHRcdFx0XHRcdCc8bGk+J1xuXHRcdFx0XHQrXHRcdCc8cCBjbGFzcz1cInRpbWVcIj4nICsgZC5kYXRlICsgJzwvcD4nXG5cdFx0XHRcdCtcdFx0JzxwIGNsYXNzPVwidGltXCI+JyArIGQudGltZSArICc8L3A+J1xuXHRcdFx0XHQrXHRcdCc8cCBjbGFzcz1cImtlbGFzXCI+JyArIGQuY2xhcyArICc8L3A+J1xuXHRcdFx0XHQrXHRcdCc8cCBjbGFzcz1cInN0YXRlXCIgdGl0bGU9XCInICsgZC5zdGF0ZSArICdcIj4nICsgc3RhdGUgKyAnPC9wPidcblx0XHRcdFx0K1x0XHQnPHAgY2xhc3M9XCJjb3Vyc2VcIj4nICsgZC5jb3Vyc2Uuc3BsaXQoJy0nKVsxXSArICc8L3A+J1xuXHRcdFx0XHQrXHRcdCc8cCBjbGFzcz1cInJvb21cIj4nICsgZC5yb29tICsgJzwvcD4nXG5cdFx0XHRcdCtcdFx0JzxwIGNsYXNzPVwiY2FtcHVzXCI+JyArIGQuYnVpbGRpbmcgKyAnPC9wPidcblx0XHRcdFx0K1x0JzwvbGk+J1xuXHRcdFx0XHRcdCk7XG5cblx0XHRcdFx0XHRpZihtb21lbnQoZC5kYXRlKS5mb3JtYXQoJ0RELU1NLVlZWVknKSA9PSBtb21lbnQoKS5mb3JtYXQoJ0RELU1NLVlZWVknKSkge1xuXHRcdFx0XHRcdFx0ZWxtLmZpbmQoXCJ1bCBsaTpsYXN0LWNoaWxkXCIpLmNzcyh7XG5cdFx0XHRcdFx0XHRcdGJhY2tncm91bmQ6ICcjMjgyODI4J1xuXHRcdFx0XHRcdFx0LFx0Y29sb3I6ICcjRkZGJ1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGVsbS5maW5kKFwidWxcIikuYXBwZW5kKCc8bGk+PHAgY2xhc3M9XCJub3RfZm91bmRcIj5ObyBzY2hlZHVsZSBmb3VuZDwvcD48L2xpPicpO1xuXHRcdFx0fVxuXHRcdH0pXG5cblx0fVxuXG59Il19
