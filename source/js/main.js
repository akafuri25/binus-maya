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