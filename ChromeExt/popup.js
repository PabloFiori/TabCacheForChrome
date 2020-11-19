// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

var changeCacheSizeButton = document.getElementById('cacheSizeButton');
var changeCacheSizeInput = document.getElementById('cacheSize');

changeCacheSizeButton.onclick = function(element) {
  changeCacheSizeInput = document.getElementById('cacheSize');
  if (parseInt(changeCacheSizeInput.value) > 0) {
    chrome.windows.getCurrent(function(win){
      chrome.runtime.sendMessage({"cacheSize":parseInt(changeCacheSizeInput.value),"windowId":win.id})
    });
  }
};

changeCacheSizeInput.addEventListener("keyup", function(event) {
  // Number 13 is the "Enter" key on the keyboard
  if (event.keyCode === 13) {
    // Cancel the default action, if needed
    event.preventDefault();
    // Trigger the button element with a click
    changeCacheSizeButton.click();
  }
});
