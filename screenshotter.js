var Screenshotter = {
  
  imageDataURL: [],
  
  shared: {
    imageDataURL: [],
    imageDirtyCutAt: 0,
    
    originalScrollTop: 0,
    
    tab: {
      id: 0,
      url: "",
      title: ""
    }
  },
  
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
      });
    });
    
    // ****** Begin!
    this.screenshotBegin(this.shared);
  },
  
  // 1
  screenshotBegin: function(shared) { chrome.tabs.sendRequest(this.shared.tab.id, { action: 'screenshotBegin', shared: shared }); },
  
  // 2
  screenshotVisibleArea: function(shared) {
    var self = this;
    //chrome.tabs.captureVisibleTab(null, { format: "png" /* png, jpeg */, quality: 80 }, function(dataUrl) { self.imageDataURLPartial.push(dataUrl); });
    
    /*if (this.imageDataURLPartial.length == 0) {
      //this.imageDataURLPartial = "data:image/jpg;base64,"; //TODO: THIS DOESN'T CHAIN
      chrome.tabs.captureVisibleTab(null, function(dataUrl) { self.imageDataURLPartial.push(dataUrl); });
    }*/
    
    
    //TODO: Since I'm going to use canvas, why not use "canvas.drawWindow"?
    chrome.tabs.captureVisibleTab(null, { format: "png" /* png, jpeg */, quality: 80 }, function(dataUrl) {
      //TODO: to improve speed, just store and stitch later
      canvas = window.document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      if (self.imageDataURLPartial.length == 0) self.imageDataURLPartial = canvas.toDataURL("image/png");
      
      imgExisting = new Image();
      imgNew = new Image();
      
      imgExisting.onload = function() {
        imgNew.onload = function() {
          canvas.width = Math.max(imgExisting.width, imgNew.width);
          canvas.height = imgExisting.height + imgNew.height;
          canvas.getContext("2d").drawImage(imgExisting, 0, 0, imgExisting.width, imgExisting.height, 0, 0, imgExisting.width, imgExisting.height);
          //canvas.getContext("2d").drawImage(imgNew, 0, 0, imgNew.width - 20, imgNew.height, 0, imgExisting.height, imgNew.width - 20, imgNew.height);
          //canvas.getContext("2d").drawImage(imgExisting, 0, 0);
          canvas.getContext("2d").drawImage(imgNew, 0, imgExisting.height);
          
          self.imageDataURLPartial = canvas.toDataURL("image/png");
          
          self.screenshotScroll(shared);
        }
        imgNew.src = dataUrl;
      }
      imgExisting.src = self.imageDataURLPartial;
    });
  },
  
  // 3
  screenshotScroll: function(shared) { chrome.tabs.sendRequest(this.shared.tab.id, { action: 'screenshotScroll', shared: shared }); },
  
  // 4
  screenshotEnd: function(shared) {
    //TODO: use original scroll top to cut?
    //      shared.imageDirtyCutAt
    shared.imageDataURL = this.imageDataURLPartial;
    this.screenshotReturn(shared);
  },
  
  // 5
  screenshotReturn: function(shared) { chrome.tabs.sendRequest(this.shared.tab.id, { action: 'screenshotReturn', shared: shared }); },
  
  eventManagerInit: function() {
    var self = this;
    chrome.extension.onRequest.addListener(function(e) {
        switch (e.action) {
          case "grab": self.grab(); break;
          case "screenshotVisibleArea": self.screenshotVisibleArea(e.shared); break;
          case "screenshotEnd": self.screenshotEnd(e.shared); break;
        }
    });
  }
}

/* \/ Initialize callback listeners */
Screenshotter.eventManagerInit();
/* /\ Initialize callback listeners */