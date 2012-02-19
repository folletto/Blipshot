Blipshot - Google Chrome Extension
==================================

**Real fast and simple one-click full-page screenshots with support for drag & drop. BSD Licensed.**  
<https://chrome.google.com/webstore/detail/mdaboflcmhejfihjcbmdiebgfchigjcf>  



WHAT IS BLIPSHOT
----------------

Blipshot is a one-click screenshot extension: just click on the icon and the page screenshot will be created: you can then drag'n'drop it wherever you want.
Why wasting time if you just want a screenshot? ;)

This extension works on Windows, Mac and Linux.


REUSABLE COMPONENTS
-------------------

Screenshotting a full page in Chrome is a little difficult since there's no internal function to do that. There are various workarounds and Blipshot contains an implementation of one of these.
The screenshotter[.DOM].js library is designed to be as reusable as possible, please do it if you want to make full screen screenshots, until Chrome will implement full page screenshot in its core.

KNOWN LIMITATIONS
-----------------

* Blipshot can't screenshot the Chrome Extensions website (Google policy)
* Blipshot can't screenshot a page loaded before it was installed (Chrome limitation)
* Waiting for Google to fix [Bug #45209](http://code.google.com/p/chromium/issues/detail?id=45209): whole tab screenshot
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

* **1.0.3** (19/02/2012)
  * Fixed: added workaround to screenshot big pages (thanks to @ble).

* **1.0.2** (16/08/2010)
  * First public release.


LICENSE
-------

  _Copyright (C) 2010-2012, Davide Casali_  
  _Licensed under **BSD Opensource License** (free for personal and commercial use)_


> _Time is very slow for those who wait._
