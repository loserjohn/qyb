/**
全局都调用的全局函数
 **/

mui('.main').on('tap', '.a', function() {

	var desturl = this.getAttribute('href')
	var destid = this.getAttribute('hid')

	if(!desturl || desturl.length == 0 || desturl == '#') {
		return false
	}
	mui.openWindow({
		url: desturl,
		id: destid,
		styles: {
			top: '0px', //新页面顶部位置
			bottom: '0px', //新页面底部位置
			scrollIndicator: "none",
//			plusrequire: 'ahead'
		},
//		createNew: true, //是否重复创建同样id的webview，默认为false:不重复创建，直接显示
		show: {
			autoShow: true, //页面loaded事件发生后自动显示，默认为true
			duration: 300 //页面动画持续时间，Android平台默认100毫秒，iOS平台默认200毫秒；
		},
		extras: {
			//自定义扩展参数，可以用来处理页面间传值  
		},
		waiting: {
			autoShow: true, //自动显示等待框，默认为true
			title: '正在加载...', //等待对话框上显示的提示内容
		}
	})
});

//给输入框添加金额数字验证
if(document.getElementById('inputMoney')) {
	document.getElementById('inputMoney').addEventListener('input', function() {
		//		alert(this.getAttribute('max'))
		var val = this.value.replace(/[^0-9-]+/, '');
		val = parseInt(val)
		var max = this.getAttribute('max') || ''

		if(val <= 0 || isNaN(val)) {
			this.value = 0
		} else if(max && val > max) {
			this.value = Math.floor(max)
		} else {
			this.value = Math.floor(val)
		}
	});
}

//全部存入
mui('.container').on('tap', '#allIn', function() {
	var inputMoney = document.getElementById('inputMoney')
	if(inputMoney) {
		inputMoney.value = Math.floor(allAmount.innerText)
	}
});




//app全局工具类
(function($, owner, CryptoJS) {
	// 参数配置

	// ********主机域名
//	owner.baseUrl = 'http://192.168.1.253:8087'

//	owner.baseUrl = 'http://www.fjdmll.com'
	owner.baseUrl = 'http://manage.ttqyb.com'
	//	token同一前缀
	owner.preToken = 'Bearer '

	/**
	 * 用户登录
	 **/
	owner.login = function(loginInfo, callback, auto) {
		callback = callback || $.noop //空函数;

		loginInfo = loginInfo || {};
		loginInfo.account = loginInfo.account || '';
		loginInfo.password = loginInfo.password || '';

		if(loginInfo.account.length < 11) {
			return callback('账号为有效手机号码');
		}
		if(!checkPhone(loginInfo.account)) {
			return callback('无效的手机号');
		}
		if(loginInfo.password.length < 6) {
			return callback('密码最短为 6 个字符');
		}
		var dvt;
		
		if(plus.os.name == 'Android'){
			dvt=1
		}else{
			dvt=2
		}

		mui.ajax(owner.baseUrl + '/Data/api/Token', {
			data: {
				username: loginInfo.account,
				password: loginInfo.password,
				cid: loginInfo.cid,
				auto: auto ? 1 : '',
				devicetype:dvt
			},
			//			dataType:'json',//服务器返回json格式数据
			type: 'post', //HTTP请求类型
			timeout: 10000, //超时时间设置为10秒；
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			success: function(data) {

				//				登陆失败
				if(!data.Success) {
					return callback(data.Msg);
				} else {

					//					登陆成功
					var curToken = owner.preToken + data.Data.access_token;
//					var settings = owner.getSettings();
//					settings.autoLogin = true;
////					alert(settings.autoLogin)
//					owner.setSettings(settings);
					if(callback)callback()
					return owner.createState(loginInfo.account, loginInfo.password, curToken, loginInfo.cid);
					
				}
				
			},
			error: function(xhr, type, errorThrown) {
				//异常处理；
				alert('err')
				console.log(type);
			}
		});
	};

	/**
	 * 用户自动登陆
	 **/
	owner.autoLogin = function(preIndex,callback) {
//		console.log('执行了')
		var tk = app.getState().token;
		plus.nativeUI.showWaiting('自动登陆校验中...')
		//					判断tokone过期
		mui.ajax(owner.baseUrl + '/Data/api/Values', {
			//			dataType:'json',//服务器返回json格式数据
			type: 'get', //HTTP请求类型
			timeout: 10000, //超时时间设置为10秒；
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Authorization': tk
			},
			success: function(data) {
				plus.nativeUI.closeWaiting();
				//							没有过期则直接登陆
				if(data.Success) {
					plus.nativeUI.toast('通过身份校验');
					//								预加载页面
					preIndex()
					callback()
				} else {
					var loginInfo = {
						account: owner.getState().account,
						password: owner.getState().pass,
						cid: owner.getState().cid
					};
					plus.nativeUI.showWaiting('正在登陆');
					owner.login(loginInfo, function(err) {
						if(err) {
							plus.nativeUI.closeWaiting();

							plus.nativeUI.toast(err);
							return;
						}
						plus.nativeUI.closeWaiting();

						plus.nativeUI.toast('登陆成功');

						preIndex()
						callback()
//						toMain();
					}, true);
				}
			},
			error: function(xhr, type, errorThrown) {
				//tokon过期异常处理；
				plus.nativeUI.closeWaiting();
				if(errorThrown === "Unauthorized") {
					plus.nativeUI.toast('身份校验未通过！，请手动登陆')
					//								清除token
					owner.resetState()
				}
			}
		});
	}

	//	保存登陆的token
	owner.createState = function(name, pass, token, cid, callback) {
		var state = owner.getState();
		state.account = name;
		state.pass = pass;
		state.token = token;
		state.cid = cid;
		owner.setState(state);
		if(callback)return callback();
	};

	//	获取验证码
	owner.getCode = function(number, type, callback) {
		mui.ajax(app.baseUrl + '/Data/api/Msg/SendVerificationCode', {
			data: {
				mobile: number,
				type: type
			},
			//			dataType:'json',//服务器返回json格式数据
			type: 'post', //HTTP请求类型
			timeout: 10000, //超时时间设置为10秒；
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			success: function(data) {
				//							console.log(data.Success)
				if(!data.Success) {
					plus.nativeUI.toast(data.Msg);
					return false
				} else {
					// 获取成功
					plus.nativeUI.toast('验证码已发送');
					callback()
					return false
				}
			},
			error: function(xhr, type, errorThrown) {
				//异常处理；
				console.log(type);
			}
		});
	}

	/**
	 * 忘记密码
	 **/
	owner.forgetPassword = function(fogInfo, callback) {
		callback = callback || $.noop;
		fogInfo = fogInfo || {};
		fogInfo.account = fogInfo.username || '';
		fogInfo.password = fogInfo.password || '';
		fogInfo.verificationCode = fogInfo.verificationCode || '';

		mui.ajax(owner.baseUrl + '/Data/api/User/SetUserPass', {
			data: {
				username: fogInfo.account,
				password: fogInfo.password,
				verificationCode: fogInfo.verificationCode
			},
			//			dataType:'json',//服务器返回json格式数据
			type: 'post', //HTTP请求类型
			timeout: 10000, //超时时间设置为10秒；
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			success: function(data) {
				//				登陆失败
				if(!data.Success) {
					return callback(false, data.Msg);
				} else {
					//					登陆成功
					return callback(true, '修改成功');
				}
			},
			error: function(xhr, type, errorThrown) {
				//异常处理；
				console.log(type);
				return callback(false, '请求失败');
			}
		});

	};

	/**
	 * 获取当前状态
	 **/
	owner.getState = function() {
		var stateText = localStorage.getItem('$state') || "{}";
		return JSON.parse(stateText);
	};

	/**
	 * 设置当前状态
	 **/
	owner.setState = function(state) {
		state = state || {};
		localStorage.setItem('$state', JSON.stringify(state));
	};

	/**
	 * 清空当前的状态
	 **/
	owner.resetState = function() {
		localStorage.removeItem('$state');
		localStorage.removeItem('$settings');
	};

	/**
	 * 获取应用本地配置
	 **/
	owner.setSettings = function(settings) {
		settings = settings || {};
		localStorage.setItem('$settings', JSON.stringify(settings));
	}

	/**
	 * 设置应用本地配置
	 **/
	owner.getSettings = function() {
		var settingsText = localStorage.getItem('$settings') || "{}";
		return JSON.parse(settingsText);
	}
	owner._KEY = "/fjdmllfjdmllfjdmllfjdmllfjdmll/"
	owner._IV = "1234567890000000"
	// 邮箱验证
	var checkEmail = function(email) {
		email = email || '';
		return(email.length > 3 && email.indexOf('@') > -1);
	};
	// 有效手机号码验证
	var checkPhone = function(phone) {
		phone = phone || '';
		// 不符合则返回false
		if(!(/^1[3|4|5|8|7|6][0-9]\d{4,8}$/.test(phone))) {
			return false
		}
		return true
	};
	//	预加载页面
	owner.prePage = function(url, id, extra) {
		extra = extra || ''
		return mui.preload({
			url: url, //子页面HTML地址，支持本地地址和网络地址
			id: id, //子页面标志
			styles: {
				top: '0px', //子页面顶部位置
				bottom: '50px'
			},
			show: {
				duration: 300 //页面动画持续时间，Android平台默认100毫秒，iOS平台默认200毫秒；
			},
			waiting: {
				autoShow: true, //自动显示等待框，默认为true
				title: '正在加载...', //等待对话框上显示的提示内容
			},
			extras: extra //自定义扩展参数						      
		})
	};
	//预加载整屏页面
	owner.fullprePage = function(url, id) {
		return mui.preload({
			url: url, //子页面HTML地址，支持本地地址和网络地址
			id: id, //子页面标志
			styles: {
				top: '0px', //子页面顶部位置
				bottom: '0px'
			},
			show: {
				duration: 300 //页面动画持续时间，Android平台默认100毫秒，iOS平台默认200毫秒；
			},
			waiting: {
				autoShow: true, //自动显示等待框，默认为true
				title: '正在加载...', //等待对话框上显示的提示内容
			},
			extras: {} //自定义扩展参数						      
		})
	};
	/**
	初始化沉浸头部
	 **/
	owner.initHeader = function() {
		var isImmersedStatusbar = plus.navigator.isImmersedStatusbar();
		var StatusbarHeight = plus.navigator.getStatusbarHeight();

		var headerH = document.getElementById('header').offsetHeight;
		document.getElementById('header').style.height = headerH + StatusbarHeight + 'px';
		document.getElementById('header').style.paddingTop = StatusbarHeight + 'px';
		document.getElementById('content').style.paddingTop = headerH + StatusbarHeight + 'px';
		if(document.getElementById('slider')) {
			document.getElementById('slider').style.top = headerH + StatusbarHeight + 'px';
		}

	}

	//	页面加载完延迟2秒后跳转
	owner.createPage = function() {
//		mui.later(function() {
//			plus.nativeUI.closeWaiting();
//			plus.webview.currentWebview().show('slide-in-right', 300);
//		}, 1000)
	}

	//	月息计算
	owner.mount_Interest = function(amount, rate) {
		var s = amount * rate / 100
		return(s / 12).toFixed(2)
	}
	//	预期收益计算
	owner.planInterest = function(amount, rate, life) {
		var s = amount * rate / 100 / 365 * life

		return s.toFixed(2)
	}
	//	需要传参的子页面跳转
	owner.jumpPage = function(url, id, extra) {
		var extra = extra || ''
		mui.openWindow({
			url: url,
			id: id,
			styles: {
				top: '0px', //新页面顶部位置
				bottom: '0px', //新页面底部位置
				scrollIndicator: "none",
				plusrequire: 'ahead'
			},
			createNew: true, //是否重复创建同样id的webview，默认为false:不重复创建，直接显示
			show: {
				autoShow: true, //页面loaded事件发生后自动显示，默认为true
				duration: 300 //页面动画持续时间，Android平台默认100毫秒，iOS平台默认200毫秒；
			},
			extras: extra,
			waiting: {
				autoShow: true, //自动显示等待框，默认为true
				title: '正在加载...', //等待对话框上显示的提示内容
			}
		})
	}
	//	返回等级的图片地址
	owner.localLevelPicUrl = function(key) {
		//		console.log('level',key)
		key = parseInt(key)
		return '../../img/level (' + key + ').png'
	}
	//	ajax同一的错误处理,主要处理token丢失
	owner.ajaxError = function(errorThrown) {
		if(errorThrown === "Unauthorized") {
			mui.alert('点击返回登陆页面', '用户登陆状态失效', function() {
				//								清除token
				app.resetState()

				//打开login页面
				mui.openWindow({
					url: '/login.html',
					id: 'HBuilder',
					preload: true,
					show: {
						aniShow: 'pop-in'
					},
					styles: {
						popGesture: 'hide'
					},
					waiting: {
						autoShow: false
					},
					extras: {
						hasPreload: true
					}
				});
			});
		} else {
			alert('请求没有响应哟')
		}
	}

}(mui, window.app = {}));