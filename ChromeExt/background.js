// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

class Node {
  constructor(element) {
    this.element = element;
    this.next = null;
    this.prev = null;
  }
}

class Queue {
  constructor(){
    this.head = null;
    this.tail = null;
    this.size = 0;
  }
  removeNode(node) {
    if (this.head == node) {
      this.head = node.next;
    } else {
      let prev = node.prev;
      prev.next = node.next;
    }
    if (this.tail == node) {
      this.tail = node.prev;
    } else {
      let next = node.next;
      next.prev = node.prev;
    }
    this.size--;
  }
  remove(element) {
    let node = this.head
    while (node != null) {
      if (node.element == element){
        this.removeNode(node);
        return;
      } else {
        node = node.next;
      }
    }
  }
  enqueue(element) {
    let node = new Node(element)
    if (this.head == null) {
      this.head = node;
      this.tail = node;
    } else {
      let curr = this.head;
      curr.prev = node;
      node.next = curr;
      this.head = node;
    }
    this.size++;
  }

  dequeue() {
    if (this.size == 0) {return null;}
    else {
      let node = this.tail;
      this.removeNode(node);
      return node.element;
    }
  }

  peekLeft() {
    return this.head.element;
  }
}

class LRUCache {
  constructor(size) {
    this.size = size;
    this.queue = new Queue();
  }

  removeUnwantedElements(){
    let removedElements = [];
    while (this.queue.size > this.size) {
      let element = this.queue.dequeue();
      removedElements.push(element);
    }
    return removedElements;
  }

  updateLRUNoRemoval(element) {
    this.queue.remove(element);
    this.queue.enqueue(element);
  }

  updateLRU(element) {
    this.updateLRUNoRemoval(element)
    return this.removeUnwantedElements();
  }

  onRemoved(element) {
    this.queue.remove(element);
  }

  updateSize(size) {
    this.size = size;
    return this.removeUnwantedElements();
  }
}

class TabManager {
  constructor(win, cacheSize) {
    this.window = win;
    this.cache = new LRUCache(cacheSize);
  }

  destroyOldTabs(tabsToDestroy) {
    chrome.tabs.remove(tabsToDestroy);
  }

  // filterOutTabsPlayingAudio(tabIdList) {
  //   let tabsPlayingAudio = [];
  //   for (const tabId in tabIdList) {
  //     console.log(tabId);
  //     chrome.tabs.get(tabId, function(tab) {
  //       if (tab.audible) {
  //         tabsPlayingAudio.push(tabId);
  //       }
  //     });
  //   }
  //   let tabsNotPlayingAudio = [];
  //   for (const tabId in tabIdList) {
  //     if (!tabsPlayingAudio.includes(tabId)) {
  //       tabsNotPlayingAudio.push(tabId);
  //     }
  //   }
  //   return tabsNotPlayingAudio;
  // }

  newTab(tab) {
    let removedTabs = this.cache.updateLRU(tab);
    // let tabsToDestroy = this.filterOutTabsPlayingAudio(removedTabs);
    this.destroyOldTabs(removedTabs);
    // for (const tabId in removedTabs) {
    //   if (!tabsToDestroy.includes(tabId)) {
    //     this.newTab(tabId);
    //   }
    // }
  }

  viewTab(tab) {
    this.cache.updateLRUNoRemoval(tab);
  }

  tabRemoved(tab) {
    this.cache.onRemoved(tab);
  }

  updateCacheSize(size) {
    let tabsToDestroy = this.cache.updateSize(size);
    this.destroyOldTabs(tabsToDestroy);
  }

}

class WindowManager {
  constructor() {
    this.windows = {};
  }

  registerWindow(win) {
    this.windows[win] = new TabManager(win, 10);
  }

  removeWindow(win) {}

  getTabManagerForWindow(win){
    return this.windows[win];
  }

}

var windowManager = new WindowManager()

chrome.windows.onCreated.addListener(function(win) {
  windowManager.registerWindow(win.id);
});
chrome.windows.onRemoved.addListener(function(WindowId) {
  windowManager.removeWindow(WindowId);
});
chrome.tabs.onActivated.addListener(function(aciveInfo) {
  let tabManager = windowManager.getTabManagerForWindow(aciveInfo.windowId);
  tabManager.viewTab(aciveInfo.tabId)
});
chrome.tabs.onCreated.addListener(function(tab) {
  let tabManager = windowManager.getTabManagerForWindow(tab.windowId);
  tabManager.newTab(tab.id);
});
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo){
  if (!removeInfo.isWindowClosing) {
    let tabManager = windowManager.getTabManagerForWindow(removeInfo.windowId);
    tabManager.tabRemoved(tabId)
  }
});
chrome.tabs.onDetached.addListener(function(tabId, detachInfo){
  let tabManager = windowManager.getTabManagerForWindow(detachInfo.oldWindowId);
  tabManager.tabRemoved(tabId)
});
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  let tabManager = windowManager.getTabManagerForWindow(message["windowId"]);
  tabManager.updateCacheSize(message["cacheSize"]);
});
