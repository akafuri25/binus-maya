var task = {

	storage: chrome.storage.local,

	init: function() {
		var self = this

		,	_pathname = window.location.pathname
		,	_lochash  = window.location.hash

		,	_loginPage = "/Default.aspx"
		,	_homePage = "/AccessApp.aspx";

		if((_pathname == _loginPage || _pathname == _homePage) && _lochash == "#bimayexts") {

			//LOGIN PAGE
			if(_pathname == _loginPage) {
				self.setData({bimay_login : 1}, function() {
					console.log('set to redirected');
					self.run_start();
				});
			}	
			//AUTHORIZED COMPLETE
			if(_pathname == _homePage) {
				console.log("The Homepage going up");
				$("#content").hide();
				$("#footer").html('Thanks for login you can close this window now ...');
				self.getData('bimay_login', function() {
					self.delData('bimay_login');
				});
			}
			

			console.log('REDIR FUNCTION');

		} else {

			self.getData('bimay_login', function() {
				self.delData('bimay_login', function() {
					console.log('remove data');
					self.run_start();
				});
			});

			console.log('not authorized');

		}
	},

	setData: function(data, callback) {
		this.storage.set(data, function(result) {
			callback(result);
		});
	},

	getData: function(data, callback) {
		this.storage.get(data, function(result) {
			callback(result);
		});
	},

	delData: function(data, callback) {
		this.storage.remove(data, function(result) {
			callback(result);
		});
	},

	run_start: function(callback) {
		var self = this;

		console.log('hello to world state !');

		self.getData('bimay_login', function(data) {

			if(data.bimay_login == 1) {
				console.log('make it possible');
				self.makeStatic();
			} else {
				console.log('dont knowing !');
			}

		})
	},

	makeStatic: function() {
		$("body").css('background','#135581');
		$("#feature, .outer-wrap").css('display','none');
		$("#content").css('width','245px');
	}

};

task.init();