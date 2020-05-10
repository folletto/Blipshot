
var Screenshotter = {

  imageDataURL: [],

  shared: {
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
  grab: function(e) {
    var self = this;

    this.imageDataURLPartial = [];

    chrome.windows.getCurrent(function(win) {
      chrome.tabs.query({ active: true, windowId: win.id }, function(tabs) {
        var tab = tabs[0];
        self.shared.tab = tab;

        var parts = tab.url.match(/https?:\/\/chrome.google.com\/?.*/);
        if (parts !== null) {
          alert("\n\n\nI'm sorry.");
          return false;
        }

        chrome.tabs.sendMessage(self.shared.tab.id, { action: 'heartbeat' }, function(response) {
          if (!response) {
            UI.status('red', "!", 1000);
            alert("\n\n\nPlease reload ");
          }
        });
        chrome.tabs.sendMessage(self.shared.tab.id, { action: 'blanketStyleSet', property: 'position',
                                                     from: 'fixed', to: 'absolute' });
        self.screenshotBegin(self.shared);
      });
    });
  },

  screenshotBegin: function(shared) { chrome.tabs.sendMessage(this.shared.tab.id, { action: 'screenshotBegin',
                                                                                   shared: shared }); },

  screenshotVisibleArea: function(shared) {
    var self = this;
    chrome.tabs.captureVisibleTab(null, { format: "png" /* png, jpeg */, quality: 80 }, function(dataUrl) {
      if (dataUrl) {
        self.imageDataURLPartial.push(dataUrl);
        self.screenshotScroll(shared);
      } else {
        alert("\n\n\nI'm sorry.");
        return false;
      }
    });
  },

  screenshotScroll: function(shared) { chrome.tabs.sendMessage(this.shared.tab.id, { action: 'screenshotScroll',
                                                                                    shared: shared }); },

  screenshotEnd: function(shared) {
    var self = this;
    UI.status('azure', "make");

    this.recursiveImageMerge(this.imageDataURLPartial, shared.imageDirtyCutAt, shared.tab.hasVscrollbar, function(image) {
      shared.imageDataURL = image;
      self.screenshotReturn(shared);
    });
  },

  screenshotReturn: function(shared) {
    UI.status('green', "✓", 3000);
    chrome.tabs.sendMessage(this.shared.tab.id, { action: 'blanketStyleRestore', property: 'position' });
    chrome.tabs.sendMessage(this.shared.tab.id, { action: 'screenshotReturn', shared: shared });
  },

  eventManagerInit: function() {
    var self = this;
    chrome.extension.onMessage.addListener(function(e) {
        switch (e.action) {
          case "grab": self.grab(); break;
          case "screenshotVisibleArea": self.screenshotVisibleArea(e.shared); break;
          case "screenshotEnd": self.screenshotEnd(e.shared); break;
        }
    });
  },

  recursiveImageMerge: function(imageDataURLs, imageDirtyCutAt, hasVscrollbar, callback, images, i) {
    var fx = arguments.callee;
    i = i || 0;
    images = images || [];

    if (i < imageDataURLs.length) {
      images[i] = new Image();
      images[i].onload = function() {
        imageDataURLs[i] = null; 
        if (i == imageDataURLs.length - 1) {
       
          var canvas = window.document.createElement('canvas');
          canvas.width = images[0].width - (hasVscrollbar ? 15 : 0);

          if (images.length > 1) canvas.height = (imageDataURLs.length - 1) * images[0].height + imageDirtyCutAt;
          else canvas.height = images[0].height;
          if (canvas.height > 32766) canvas.height = 32766;
          for (var j = 0; j < images.length; j++) {
            var cut = 0;
            if (images.length > 1 && j == images.length - 1) cut = images[j].height - imageDirtyCutAt;

            var height = images[j].height - cut;
            var width = images[j].width;
            canvas.getContext("2d").drawImage(images[j], 0, cut, width, height, 0, j * images[0].height, width, height);
          }

          callback(canvas.toDataURL("image/png")); 
        } else {
          fx(imageDataURLs, imageDirtyCutAt, hasVscrollbar, callback, images, ++i);
        }
      }
      images[i].src = imageDataURLs[i]; 
    }
  }
}

Screenshotter.eventManagerInit();
