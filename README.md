Blipshot - Google Chrome Extension
==================================

**Real fast and simple one-click full-page screenshots with support for drag & drop. BSD Licensed.**  
<https://chrome.google.com/webstore/detail/mdaboflcmhejfihjcbmdiebgfchigjcf>  



WHAT IS BLIPSHOT
----------------

Blipshot is a one-click screenshot extension: just click on the icon and the page screenshot will be created: you can then drag'n'drop it wherever you want.
Why wasting time if you just want a screenshot? ;)

This extension works on Windows, Mac and Linux.


REUSABLE LIBRARIES
------------------

This extension contains two reusable libraries:

* **Screenshotter** - Screenshotting a full page in Chrome is a little difficult since there's no internal function to do that. There are various workarounds and Blipshot contains an implementation of one of these.
The screenshotter[.DOM].js library (2 files) is designed to be as reusable as possible, please do it if you want to make full screen screenshots, until Chrome will implement full page screenshot in its core ([Bug #45209](http://code.google.com/p/chromium/issues/detail?id=45209)).
* **Blanket Style Set** - A small library, packed to be used in a Chrome extension and with minimal client page impact, that allows to reset and set back a specific CSS property to all the DOM nodes. Used by Blipshot as a workaround for fixed positioned elements. Thanks to @guille for the original code.


KNOWN LIMITATIONS
-----------------

* Blipshot can't screenshot the Chrome Extensions website (Google policy)
* Blipshot can't screenshot a page loaded before it was installed (Chrome limitation)
* Waiting for Google to fix [Bug #45209](http://code.google.com/p/chromium/issues/detail?id=45209) now [Bug #469663](https://code.google.com/p/chromium/issues/detail?id=469663): whole tab screenshot
* Waiting for Google to fix [Bug #69227](http://code.google.com/p/chromium/issues/detail?id=69227): data URL crashes


TODO
----

* Fix horizontal scrollbar evaluation (now it assumes that the page hasn't the scrollbar)


MAY DO
------

* Try to find a faster way to grab screen parts (directly to canvas?)
* Store images in a local WebSQL database for late retrieval
* Find a way to "download" them in a block (zip?)


CHANGELOG
---------

* **1.1.1** (24/08/2014)
  * Updated icons. 

* **1.1.0** (24/08/2014)
  * Fixed: Added code to workaround pages with `fixed` elements. This should allow screenshotting a number of pages with fixed elements (some will still have repeating elements). This has been built as a reusable library (blankedStyleSet.js). Thanks @guille.

* **1.0.6** (12/04/2014)
  * Fixed: Changed permission to <all_urls> to workaround a Chrome change / bug.

* **1.0.5** (14/01/2013)
  * Fixed: WebKitBlobBuilder was deprecated, using Blob instead. Thanks to @ble for the code snippet.
  * Updated: Manifest V2.

* **1.0.4** (20/02/2012)
  * Fixed: re-introduced page names and timestamp on file names.

* **1.0.3** (19/02/2012)
  * Fixed: added workaround to screenshot big pages (thanks to @ble). It's a workaround for Chrome Bug #69227.
  * Added info message when you try to screenshot a Chrome Store page (it's not allowed).

* **1.0.2** (16/08/2010)
  * First public release.


LICENSE
-------

  _Copyright (C) 2010-2013, Davide Casali_  
  _Licensed under **BSD Opensource License** (free for personal and commercial use)_


> _Time is very slow for those who wait._
