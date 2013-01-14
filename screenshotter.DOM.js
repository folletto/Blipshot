/*
 *  Blipshot
 *  Screenshotter.DOM.js
 *  Half of the screenshotter algorithm. See Screenshotter.js for the other half.
 *
 *  ==========================================================================================
 *  
 *  Copyright (c) 2010-2012, Davide Casali.
 *  All rights reserved.
 *  
 *  Redistribution and use in source and binary forms, with or without modification, are 
 *  permitted provided that the following conditions are met:
 *  
 *  Redistributions of source code must retain the above copyright notice, this list of 
 *  conditions and the following disclaimer.
 *  Redistributions in binary form must reproduce the above copyright notice, this list of 
 *  conditions and the following disclaimer in the documentation and/or other materials 
 *  provided with the distribution.
 *  Neither the name of the Baker Framework nor the names of its contributors may be used to 
 *  endorse or promote products derived from this software without specific prior written 
 *  permission.
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY 
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES 
 *  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT 
 *  SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, 
 *  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, 
 *  PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS 
 *  INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT 
 *  LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE 
 *  OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 */

(function() {
  
  var shared = {};
  
  // ****************************************************************************************** SCREENSHOT SEQUENCE
  
  // 1
  function screenshotBegin(shared) {
    shared.originalScrollTop = window.document.body.scrollTop; // ->[] save user scrollTop
    shared.tab.hasVscrollbar = (window.innerHeight < window.document.body.scrollHeight);
    window.document.body.scrollTop = 0;
    setTimeout(function() { screenshotVisibleArea(shared); }, 100);
  }
  
  // 2
  function screenshotVisibleArea(shared) { chrome.extension.sendMessage({ action: 'screenshotVisibleArea', shared: shared }); }
  
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
  function screenshotEnd(shared) { chrome.extension.sendMessage({ action: 'screenshotEnd', shared: shared }); }
  
  // 5
  function screenshotReturn(shared) {
    function pad2(str) { if ((str + "").length == 1) return "0" + str; return "" + str; }
    
    var d = new Date();
    var timestamp = '' + d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDay()) + '-' + pad2(d.getHours()) + '' + pad2(d.getMinutes()) + '';
    var filename = "pageshot of '" + normalizeFileName(shared.tab.title) + "' @ " + timestamp;
    var blobURL = dataToBlobURL(shared.imageDataURL);
    
    // ****** Add DOM Elements to Page
    var div = window.document.createElement('div');
    div.id = "blipshot";
    div.innerHTML = '<div id="blipshot-dim" style="position: absolute !important; height: ' + window.document.body.scrollHeight + 'px !important; width: 100% !important; top: 0px !important; left: 0px !important; background: #000000 !important; opacity: 0.66 !important; z-index: 666666 !important;"> </div>';
    div.innerHTML += '<p style="-webkit-box-shadow: 0px 5px 10px #000000; margin: 20px; background: #ffffff; position: absolute; top: 0; right: 0; z-index: 666667 !important;"><img id="blipshot-img" alt="' + filename + '" src="' +  blobURL + '" width= "400" /></p>';
    window.document.body.appendChild(div);
    
    // ****** Add Event Listeners
    function actionRemoveDiv() {
      // Closes the extension overlays.
      var blipshotdiv = window.document.getElementById('blipshot');
      if (blipshotdiv) blipshotdiv.parentElement.removeChild(blipshotdiv);
      
      // Cleanup
      window.webkitURL.revokeObjectURL(blobURL);
    }
    function actionDrag(e) {
      e.dataTransfer.setData("DownloadURL", "image/png:" + filename + ".png:" + blobURL);
    }
    window.document.getElementById('blipshot-dim').addEventListener("click", actionRemoveDiv);
    window.document.getElementById('blipshot-img').addEventListener("dragstart", actionDrag);
  }
  
  // ****************************************************************************************** EVENT MANAGER / HALF
  function eventManagerInit() {
    /****************************************************************************************************
     * This function prepares the internal plugin callbacks to bounce between the plugin and DOM side.
     * It's initialized right after declaration.
     */
    var self = this;
    chrome.extension.onMessage.addListener(function(e) {
        switch (e.action) {
          case "screenshotBegin": screenshotBegin(e.shared); break;
          case "screenshotScroll": screenshotScroll(e.shared); break;
          case "screenshotReturn": screenshotReturn(e.shared); break;
        }
    });
  }
  eventManagerInit(); // Init
  
  // ****************************************************************************************** SUPPORT
  function dataToBlobURL(dataURL) {
    /****************************************************************************************************
     * Converts a data:// URL (i.e. `canvas.toDataURL("image/png")`) to a blob:// URL.
     * This allows a shorter URL and a simple management of big data objects.
     * 
     * Contributor: Ben Ellis <https://github.com/ble>
     */
    var parts = dataURL.match(/data:([^;]*)(;base64)?,([0-9A-Za-z+/]+)/);
    
    // Assume base64 encoding
    var binStr = atob(parts[3]);
    
    // Convert to binary in ArrayBuffer
    var buf = new ArrayBuffer(binStr.length);
    var view = new Uint8Array(buf);
    for(var i = 0; i < view.length; i++)
      view[i] = binStr.charCodeAt(i);

    // Create blob with mime type, create URL for it
    var blob = new Blob([view], {'type': parts[1]});
    var URL = webkitURL.createObjectURL(blob)
    
    return URL;
  }
  
  function normalizeFileName(string) {
    out = string;
    //out = out.replace(/"/, '\''); // To avoid collision with DOM attribute
    //out = out.replace(/\/\?<>\\:\*\|/, '-'); // Windows safe
    out = out.replace(/[^a-zA-Z0-9_\-+,;'!?$£@&%()\[\]=]/g, " ").replace(/ +/g, " "); // Hard replace
    return out;
  }
})();
