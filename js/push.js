(function(owner) {　
	
	
	
	owner.baseUrl = 'http://www.fjdmll.com';
	//		记录当前的版本信息
	owner.versionMsg = '';
	//		推送消息*****************************
	owner.ispush=false
	owner.updated=false
	owner.pushInit = function() {
//		var info = plus.push.getClientInfo();
//		plus.push.addEventListener("receive", function(msg) {
//
//			if(mui.os.ios) {
//				plus.nativeUI.alert(msg.content);
//			} else {
//				plus.push.createMessage(msg.content, msg.payload || '', msg);
//			}
//		}, false);
//		plus.push.addEventListener("click", function(msg) {
//			plus.runtime.setBadgeNumber(0);
//			owner.ispush= true
//
//		}, false);　
	}

	//***************** 系统更新   ***************************

	//当前版本信息

	owner.versionInit = function() {
		plus.runtime.getProperty(plus.runtime.appid, function(inf) {
			owner.wgtVer = inf.version;
		   var checkUrl = owner.baseUrl + "/Data/api/Update/Check";
		//	    检查版本	    
			owner.checkUpdate(checkUrl,owner.wgtVer);
		});

		
	}

	// 判断版本信息
	owner.checkUpdate = function(checkUrl,curversion) {
//		console.log(checkUrl)
//		plus.nativeUI.showWaiting("检测更新...");
		var xhr = new XMLHttpRequest();
		
		xhr.onreadystatechange = function() {
			switch(xhr.readyState) {
				case 4:
//					plus.nativeUI.closeWaiting();
					if(xhr.status == 200) {
						owner.versionMsg = JSON.parse(xhr.responseText).Data;
//						   console.log(JSON.stringify(owner.versionMsg))
						   var newVer = owner.versionMsg.version;
						// 有更新包
						if(JSON.parse(xhr.responseText).Success) {
							owner.updated=true
							plus.nativeUI.confirm('有新版本！是否立即更新', function(e) {
								if(e.index == 0) {							
									owner.checkSystem()
								}
							}, {
								"buttons": ["Yes", "No"]
							});
							//无更新		
						} 
					} else {
						plus.nativeUI.alert("检测更新失败！");
					}
					break;
				default:
					break;
			}
		}

		xhr.open('GET', checkUrl+'?version='+curversion,true);
		xhr.setRequestHeader("content-type","application/json");
//		var postData = {version:curversion};
//		console.log(checkUrl+'?version='+curversion)
		xhr.send();
	}

	//系统检测
	owner.checkSystem = function(){
		
		if(plus.os.name == 'Android') { // Android 用户    
			　　　　　　
			if(owner.versionMsg.Android == 1) {
				return false;
			} else if(owner.versionMsg.Android == 2) {
				plus.nativeUI.alert("Plus is ready!", function() {
					owner.createDownload();
				}, "请前往下载升级", "确定");
			} else {
				owner.downWgt();
			}
		} else {
			if(owner.versionMsg.iOS == 1) {
				return false;
			} else if(owner.versionMsg.iOS == 2) {
				plus.nativeUI.alert("Plus is ready!", function() {
					plus.runtime.openURL(owner.versionMsg.ipaURL);
				}, "请升级", "确定");
			} else {
				owner.downWgt();
			}
		}
	}

	//服务器直接下载安卓整包
	owner.createDownload = function() {
		var dtask = plus.downloader.createDownload(owner.versionMsg.apkURL, {
			filename: '_doc/download/'
		}, function(d, status) {
			// 下载完成
			if(status == 200) {
				plus.runtime.install(d.filename, {}, function() {}, function(DOMException) {
//					console.log(JSON.stringify(DOMException));
				});
			} else {
				alert("Download failed: " + status);
			}
		});
		dtask.start();
	}

	//	下载差量升级包		
	owner.downWgt = function() {
//		alert('下载差量')
		// 下载wgt文件
		var wgtUrl = owner.versionMsg.wgtURL;
//      console.log(wgtUrl)
        
		var mask = document.getElementById('mask');
		var pro = document.getElementById('downProcess');
//		alert(1);
		mask.style.display = "block";
		pro.innerText = '开始下载';

//		plus.nativeUI.showWaiting("下载中...");
		
		var tasks = plus.downloader.createDownload(wgtUrl, {filename:"_doc/update/"},function(d, status) {
//			console.log(status)
			if(status == 200) {
				
//				plus.nativeUI.closeWaiting();
				
			} else {
				console.log("下载升级文件失败！");
				plus.nativeUI.alert("下载升级文件失败！");
			}
		});
 
		tasks.addEventListener("statechanged", function(download, status) {
			switch(download.state) {
				case 2:				  			   
//				    console.log("已连接到服务器");
					pro.innerText = "已连接到服务器";
					break;
				case 3:
					var percent = download.downloadedSize / download.totalSize * 100;
					pro.innerText = "已下载 " + parseInt(percent) + "%";
					mui('#pro').progressbar().setProgress(percent);
					
					break;
				case 4:
//					                          console.log("下载完成");
					pro.innerText = "下载完成";
					alert('下载完毕，立即安装')
					mask.style.display = "none";
					if(plus.os.name == 'Android'){
				    	owner.installWgt(plus.io.convertLocalFileSystemURL(download.filename))
				    
					 }else{
					 	owner.installWgt(download.filename); 
					 }
					// 安装wgt包
					
					break;
			}
		});
		tasks.start();

	}

	//		安装差量升级包
	owner.installWgt = function(path) {
//		alert('安装')
		plus.nativeUI.showWaiting("安装升级文件文件...");
		plus.runtime.install(path, {}, function() {
			plus.nativeUI.closeWaiting();
			//				console.log("安装升级文件文件成功！");
			plus.nativeUI.alert("应用资源更新完成！", function() {
				plus.runtime.restart();
			});
		}, function(e) {
			plus.nativeUI.closeWaiting();
			//				console.log("安装wgt文件失败[" + e.code + "]：" + e.message);
			plus.nativeUI.alert("安装wgt文件失败[" + e.code + "]：" + e.message);
		});
	}

}(window.systemOS = {}));