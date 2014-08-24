/*
 *  Blanket CSS Style Set
 *  Converts a specific CSS property temporarily to another.
 *
 *  ==========================================================================================
 *  
 *  Copyright (c) 2014, Davide Casali.
 *  All rights reserved.
 *
 *  Thanks to Guillermo Rauch.
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
 *  ==========================================================================================
 *
 *  USAGE:
 *  Include this file in the manifest.js as 'content_scripts', for example:
 *
 *    "content_scripts": [ 
 *      { "js": [ "blanketStyleSet.js" ], "matches": [ "<all_urls>" ], "run_at": "document_end" }
 *    ],
 * 
 *  Call its functions using:
 *
 *    chrome.tabs.sendMessage(this.shared.tab.id, { action: 'blanketStyleSet', property: 'position', from: "fixed", to: 'absolute' });
 *
 *  Restore by calling:
 *
 *    chrome.tabs.sendMessage(this.shared.tab.id, { action: 'blanketStyleRestore', property: 'position' });
 *
 */

(function() {
  
  var reverse = []; // Store the nodes to restore for each changed property (2-levels array)
  
  // ****************************************************************************************** EVENT MANAGER / HALF
  function eventManagerInit() {
    /****************************************************************************************************
     * This function prepares the internal plugin callbacks to bounce between the plugin and DOM side.
     * It's initialized right after declaration.
     */
    chrome.extension.onMessage.addListener(function(e) {
        switch (e.action) {
          case "blanketStyleSet": blanketStyleSet(e.property, e.from, e.to); break;
          case "blanketStyleRestore": blanketStyleRestore(e.property); break;
        }
    });
  }
  eventManagerInit(); // Init
  
  function blanketStyleSet(property, from, to) {
    /****************************************************************************************************
     * Convert a CSS property value to a specific value for every DOM node
     * From a function by @guille
     */
    var els = document.getElementsByTagName('*');
    var el;
    var styles;
    
    // ****** Store the Restores
    if (property in reverse) {
      // This property was already reset!
      // Switch back before applying...
      blanketStyleRestore(property);
    }
    reverse[property] = [];
    
    // ****** Iterate the DOM
    for (var i = 0, l = els.length; i < l; i++) {
      el = els[i];
      
      if (from == el.style[property]) {
        // *** Check for node style:
        el.style[property] = to;
        reverse[property].push(function() {
          this.style[property] = from;
        }.bind(el));
      } else {
        // *** Check for computed style:
        styles = getComputedStyle(el);
        if (from == styles.getPropertyValue(property)) {
          el.style[property] = to;
          reverse[property].push(function(){
            this.style[property] = from;
          }.bind(el));
        }
      }
    }
  }
  
  function blanketStyleRestore(property) {
    /****************************************************************************************************
     * Convert back
     * From a function by @guille
     */
    var fx;
    
    while (fx = reverse[property].shift()) {
      fx();
    }
    delete reverse[property];
  };
  
})();