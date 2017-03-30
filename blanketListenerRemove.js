/*
 *  Blanket Event Remover
 *  Removes and restores events of a specific type. Chrome only.
 *
 *  ==========================================================================================
 *
 *  Copyright (c) 2017, Davide Casali.
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
 *  ==========================================================================================
 *
 *  USAGE:
 *  Include this file in the manifest.js as 'content_scripts', for example:
 *
 *    "content_scripts": [
 *      { "js": [ "blanketListenerRemove.js" ], "matches": [ "<all_urls>" ], "run_at": "document_end" }
 *    ],
 *
 *  Remove listeners using:
 *
 *    chrome.tabs.sendMessage(this.shared.tab.id, { action: 'blanketListenerRemove', node: object, type: "scroll" });
 *
 *  Restore by calling:
 *
 *    chrome.tabs.sendMessage(this.shared.tab.id, { action: 'blanketListenerRestore', node: object });
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
          case "blanketListenerRemove": blanketListenerRemove(e.node, e.type); break;
          case "blanketListenerRestore": blanketListenerRestore(e.node, e.type); break;
        }
    });
  }
  eventManagerInit(); // Init

  function blanketListenerRemove(node, type) {
    /****************************************************************************************************
     * Loops through all the listeners of a type, detaches them and stores them for later.
     */
    reverse[node] = reverse[node] || [];
    reverse[node][type] = reverse[node][type] || [];

    if (node === 'window') node = window;
    if (node === 'document') node = document;

    getEventListeners(node)[type].forEach(
      function(listenerObject) {
        reverse[node][type].push(function() {
          node.addEventListener(type, listenerObject.listener);
        });
        listenerObject.remove();
      }
    );
  }

  function blanketListenerRestore(node, type) {
    /****************************************************************************************************
     * Convert back
     */
    var fx;

    while (fx = reverse[node][type].shift()) {
      fx();
    }
    delete reverse[node][type];
  };

})();