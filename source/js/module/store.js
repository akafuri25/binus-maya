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