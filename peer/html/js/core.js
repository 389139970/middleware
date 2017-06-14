function reg() {
    var txt_username = document.getElementsByName('loginname')[0];
    var txt_pass = document.getElementsByName('loginpsw')[0];
    var loginerror = document.getElementById("loginerror");
    var username = txt_username.value;
    var password = txt_pass.value;
    console.log('reg:' + username + ',' + password);

    var xhr = window.XMLHttpRequest?new XMLHttpRequest():new ActiveXObject("Microsoft.XMLHttp");
    xhr.open('GET', 'reg?username=' + username + "&password=" + password, true);
    xhr.onreadystatechange = function () {
	if (xhr.readyState == 4 && xhr.status == 200) {
        	var DataSource = JSON.parse(xhr.responseText);
        	if (DataSource.result == 0) {
	    	loginerror.innerHTML = '注册成功';
            		console.log('login success!');
        	} else {
            		loginerror.innerHTML = '注册失败';
            		//alert('登录失败');
            		console.log('reg failed!');
        	}
	}
    }
    xhr.send();
}