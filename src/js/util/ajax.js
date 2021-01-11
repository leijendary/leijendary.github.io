function ajax(url, method, body, callback) {
  if (typeof body == 'function' && !callback) {
    callback = body;
  }

  // Create the AJAX object
  const xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = onReadyState;
  xhttp.open(method, url, true);
  xhttp.setRequestHeader('Content-Type', 'application/json');

  if (method.toLowerCase() === 'post') {
    xhttp.send(JSON.stringify(body));
  } else {
    xhttp.send();
  }

  function onReadyState() {
    if (this.readyState == 4 && callback) {
      try {
        this.json = JSON.parse(this.responseText);
      } catch {}

      callback.bind(this)(this);
    }
  }
}

export default ajax;