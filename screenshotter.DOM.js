(function() {
  function dataToBlobURL(dataURL) {
    var parts = dataURL.match(/data:([^;]*)(;base64)?,([0-9A-Za-z+/]+)/);

    //assume base64 encoding
    var binStr = atob(parts[3]);

    //convert to binary in ArrayBuffer
    var buf = new ArrayBuffer(binStr.length);
    var view = new Uint8Array(buf);
    for(var i = 0; i < view.length; i++)
      view[i] = binStr.charCodeAt(i);


    var builder = new WebKitBlobBuilder();
    builder.append(buf);

    //create blob with mime type, create URL for it
    var URL = webkitURL.createObjectURL(builder.getBlob(parts[1]))
    return URL;
  }
  var shared = {};
  
  // 1
  function screenshotBegin(shared) {
    shared.originalScrollTop = window.document.body.scrollTop; // ->[] save user scrollTop
    shared.tab.hasVscrollbar = (window.innerHeight < window.document.body.scrollHeight);
    window.document.body.scrollTop = 0;
    setTimeout(function() { screenshotVisibleArea(shared); }, 100);
  }
  
  // 2
  function screenshotVisibleArea(shared) { chrome.extension.sendRequest({ action: 'screenshotVisibleArea', shared: shared }); }
  
  // 3
  function screenshotScroll(shared) {
    var scrollTopCurrent = window.document.body.scrollTop;
    
    //TODO: bug: doesn't screenshot correctly
    window.document.body.scrollTop += window.innerHeight; // scroll!
    
    if (window.document.body.scrollTop == scrollTopCurrent) {
      // END ||
      shared.imageDirtyCutAt = scrollTopCurrent % window.document.documentElement.clientHeight;
      window.document.body.scrollTop = shared.originalScrollTop; // <-[] restore user scrollTop
      screenshotEnd(shared);
    } else {
      // LOOP >>
      setTimeout(function() { screenshotVisibleArea(shared); }, 100);
    }
  }
  
  // 4
  function screenshotEnd(shared) { chrome.extension.sendRequest({ action: 'screenshotEnd', shared: shared }); }
  
  // 5
  function screenshotReturn(shared) {
    function pad2(str) { if ((str + "").length == 1) return "0" + str; return "" + str; }
    
    var d = new Date();
    var timestamp = '' + d.getFullYear() + '' + pad2(d.getMonth() + 1) + '' + pad2(d.getDay()) + '-' + pad2(d.getHours()) + '' + pad2(d.getMinutes()) + '';
    var filename = "pageshot of '" + shared.tab.title.replace(/"/, '\'') + "' @ " + timestamp;
    
    var div = window.document.createElement('div');
    div.id = "blipshot";
    div.innerHTML = '<div id="dim" style="position: absolute !important; height: ' + window.document.body.scrollHeight + 'px !important; width: 100% !important; top: 0px !important; left: 0px !important; background: #000000 !important; opacity: 0.66 !important; z-index: 666666 !important;"> </div>';
    var blobURL = dataToBlobURL(shared.imageDataURL);
    div.innerHTML += '<p style="-webkit-box-shadow: 0px 5px 10px #000000; margin: 20px; background: #ffffff; position: absolute; top: 0; right: 0; z-index: 666667 !important;"><img alt="' + filename + '" src="' +  blobURL + '" width= "400" /></p>';
    window.document.body.appendChild(div);
    
    function removeDiv() {
      var blipshotdiv = window.document.getElementById('blipshot');
      if (blipshotdiv) blipshotdiv.parentElement.removeChild(blipshotdiv);
    }
    window.document.getElementById('dim').addEventListener("click", removeDiv);
  }
  
  // ****** eventManagerInit
  var self = this;
  chrome.extension.onRequest.addListener(function(e) {
      switch (e.action) {
        case "screenshotBegin": screenshotBegin(e.shared); break;
        case "screenshotScroll": screenshotScroll(e.shared); break;
        case "screenshotReturn": screenshotReturn(e.shared); break;
      }
  });
})();
