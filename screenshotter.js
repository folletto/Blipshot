/*
 *  Blipshot
 *  Screenshotter.js
 *  Half of the screenshotter algorithm. See Screenshotter.DOM.js for the other half.
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

var Screenshotter = {
  
  imageDataURL: [],
  
  shared: {
    imageDataURLPartial: [],
    imageDirtyCutAt: 0,
    imageDataURL: 0,
    
    originalScrollTop: 0,
    
    tab: {
      id: 0,
      url: "",
      title: "",
      hasVscrollbar: false
    }
  },
  
  // ****************************************************************************************** SCREENSHOT SEQUENCE START
  
  // 0
  grab: function(e) {
    /****************************************************************************************************
     * It's a chaos: the ball must bounce between background and script content since the first
     * can grab and the second can access the DOM (scroll)
     *
     * So the call stack is:
     *    grab (bg)
     *      screenshotBegin (script)
     *      loop {
     *        screenshotVisibleArea (bg)
     *        screenshotScroll (script)
     *      }
     *      screenshotEnd (bg)
     *      screenshotReturn (script)
     */ 
    var self = this;
    
    // ****** Reset screenshot container
    this.imageDataURLPartial = [];
    
    // ****** Get tab data
    chrome.windows.getCurrent(function(win) {
      chrome.tabs.getSelected(win.id, function(tab) {
        self.shared.tab = tab;
        
        // ****** Check if everything's is in order.
        var parts = tab.url.match(/https?:\/\/chrome.google.com\/?.*/);
        if (parts !== null) {
          alert("\n\n\nI'm sorry.\n\nDue to security restrictions \non the Google Chrome Store, \nBlipshot can't run here.\n\nTry on any other page. ;)\n\n\n");
          return false;
        }
        
        // ****** Begin!
        chrome.tabs.sendMessage(self.shared.tab.id, { action: 'blanketStyleSet', property: 'position', from: 'fixed', to: 'absolute' });
        self.screenshotBegin(self.shared);
      });
    });
  },
  
  // 1
  screenshotBegin: function(shared) { chrome.tabs.sendMessage(this.shared.tab.id, { action: 'screenshotBegin', shared: shared }); },
  
  // 2
  screenshotVisibleArea: function(shared) {
    var self = this;
    chrome.tabs.captureVisibleTab(null, { format: "png" /* png, jpeg */, quality: 80 }, function(dataUrl) {
      if (dataUrl) {
        // Grab successful
        self.imageDataURLPartial.push(dataUrl);
        self.screenshotScroll(shared);
      } else {
        // Grab failed, warning
        // To handle issues like permissions - https://github.com/folletto/Blipshot/issues/9
        alert("\n\n\nI'm sorry.\n\nIt seems Blipshot wasn't able to grab the screenshot of the active tab.\n\nPlease check the extension permissions.\n\nIf the problem persists contact me at \nhttp://github.com/folletto/Blipshot/issues\n\n\n");
        return false;
      }
    });
  },
  
  // 3
  screenshotScroll: function(shared) { chrome.tabs.sendMessage(this.shared.tab.id, { action: 'screenshotScroll', shared: shared }); },
  
  // 4
  screenshotEnd: function(shared) {
    var self = this;
    UI.status('azure', "make");
    
    this.recursiveImageMerge(this.imageDataURLPartial, shared.imageDirtyCutAt, shared.tab.hasVscrollbar, function(image) {
      shared.imageDataURL = image;
      self.screenshotReturn(shared);
    });
  },
  
  // 5
  screenshotReturn: function(shared) {
    UI.status('green', "done", 3000);
    chrome.tabs.sendMessage(this.shared.tab.id, { action: 'blanketStyleRestore', property: 'position' });
    chrome.tabs.sendMessage(this.shared.tab.id, { action: 'screenshotReturn', shared: shared });
  },
  
  // ****************************************************************************************** EVENT MANAGER / HALF
  eventManagerInit: function() {
    /****************************************************************************************************
     * This function prepares the internal plugin callbacks to bounce between the plugin and DOM side.
     * It's initialized at the end of this file.
     */
    var self = this;
    chrome.extension.onMessage.addListener(function(e) {
        switch (e.action) {
          case "grab": self.grab(); break;
          case "screenshotVisibleArea": self.screenshotVisibleArea(e.shared); break;
          case "screenshotEnd": self.screenshotEnd(e.shared); break;
        }
    });
  },
  
  // ****************************************************************************************** SUPPORT
  recursiveImageMerge: function(imageDataURLs, imageDirtyCutAt, hasVscrollbar, callback, images, i) {
    /****************************************************************************************************
     * This function merges together all the pieces gathered during the scroll, recursively.
     * Returns a single data:// URL object from canvas.toDataURL("image/png") to the callback.
     */
    var fx = arguments.callee;
    i = i || 0;
    images = images || [];
    
    if (i < imageDataURLs.length) {
      images[i] = new Image();
      images[i].onload = function() {
        imageDataURLs[i] = null; // clear for optimize memory consumption (not sure)
        if (i == imageDataURLs.length - 1) {
          // ****** We're at the end of the chain, let's have fun with canvas.
          var canvas = window.document.createElement('canvas');
          
          // NOTE: Resizing a canvas is destructive, we can do it just now before stictching
          canvas.width = images[0].width - (hasVscrollbar ? 15 : 0); // <-- manage V scrollbar
          
          if (images.length > 1) canvas.height = (imageDataURLs.length - 1) * images[0].height + imageDirtyCutAt;
          else canvas.height = images[0].height;
          
          // ****** Stitch
          for (var j = 0; j < images.length; j++) {
            var cut = 0;
            if (images.length > 1 && j == images.length - 1) cut = images[j].height - imageDirtyCutAt;
            
            var height = images[j].height - cut;
            var width = images[j].width;
            //alert("[i:" + i + ", j:" + j + "]" + width + "x" + height + "(cut:" + cut + ") --- images:" + imageDataURLs.length);
            
            canvas.getContext("2d").drawImage(images[j], 0, cut, width, height, 0, j * images[0].height, width, height);
          }
          
          callback(canvas.toDataURL("image/png")); // --> CALLBACK (note that the file type is used also in the drag function)
        } else {
          // ****** Down!
          fx(imageDataURLs, imageDirtyCutAt, hasVscrollbar, callback, images, ++i);
        }
      }
      images[i].src = imageDataURLs[i]; // Load!
    }
  }
}

/* \/ Initialize callback listeners */
Screenshotter.eventManagerInit();
/* /\ Initialize callback listeners */