/*
 * We are pleased to support the open source community by making
 * Hippy Exposure available.
 *
 * Copyright (c) 2015-present 马上消费金融股份有限公司, https://www.msxf.com/
 *
 * Licensed under the MIT LICENSE.
 */

import { ExposureElement, Rect, ExposureSize } from "./type"
import { createExposureElement } from './element';
import {
  debugLogCollectElementWhenRecord,
} from './debug';
import { isHippyElement } from "./utils";
import { HippyElement } from '@hippy/vue-next';
import { getRectInWindowWithPolyfill } from './polyfill';
import taskQueue from './task';
import { scheduleIdleCleanup } from './gc';

let rootElement: ExposureElement | null = null;  // #root
let rootContainerElement: ExposureElement | null = null; // root
let listElement: ExposureElement | null = null;
const elementMap: Map<number, ExposureElement> = new Map();

let _rootId: string | undefined = undefined;
let _rootSize: ExposureSize | undefined = undefined;

export const _setRootId = (rootId: string) => {
  _rootId = rootId;
}

export const _getRootSize = () : ExposureSize | undefined => {
  return _rootSize;
}

export const _setRootSize = (size: ExposureSize) => {
  _rootSize = size;
  
  const rootRect: Rect = {
    x: 0, y: 0, ...size
  }
  if (rootElement) {
    rootElement.rectInParent = rootRect;
    rootElement.rectInWindow = rootRect;
    rootElement.intersectAreaRatioInWindow = 1.0;
  }
  if (rootContainerElement) {
    rootContainerElement.rectInParent = rootRect;
    rootContainerElement.rectInWindow = rootRect;
    rootContainerElement.intersectAreaRatioInWindow = 1.0;
  }
}

export const getRootElement = (): ExposureElement | null => {
  return rootElement;
}

export const getListElement = () => {
  return listElement;
}

export const setListElement = (element: ExposureElement) => {
  listElement = element;
}

export const recycleElementWithDeepTraverse = (element: ExposureElement) => {
  elementMap.delete(element.el.nodeId);
  element.el.childNodes.forEach((item) => {
    const ele = elementMap.get(item.nodeId);
    if (ele) {
      recycleElementWithDeepTraverse(ele);
    }
  });
}

export const recordElement = (el: HippyElement, style: any) => {

  // 300ms 时间内，注册一次 idle 空闲时间的清理任务
  // 如果 550ms 内都没有空闲时间，就强制执行 gc 任务
  scheduleIdleCleanup(550, 300);
  debugLogCollectElementWhenRecord(el);

  if (isHippyElement(el) === false) { 
    return; 
  }
  const existElement = elementMap.get(el.nodeId);
  if (existElement) {
    existElement.el = el;
  } else {
    const ele = createExposureElement(el, style);
    collectElement(ele);
  }

};

const forceCheckRootElement = async () => {
  if (!rootElement) throw new Error(`root element should already record before onlayout`);
  if (!rootElement.rectInParent || !rootElement.rectInWindow) {
    const rectInWindow = await getRectInWindowWithPolyfill(rootElement);
    rootElement.rectInParent = rectInWindow;
    rootElement.rectInWindow = rectInWindow;
    return;
  }

  if (
    rootContainerElement && 
    (!rootContainerElement.rectInParent || !rootContainerElement.rectInWindow)
  ) {
    const rectInWindow = await getRectInWindowWithPolyfill(rootContainerElement);
    rootContainerElement.rectInParent = rectInWindow;
    rootContainerElement.rectInWindow = rectInWindow;
  }
}

const _setRootElement = (element: ExposureElement) => {
  rootElement = element;
  // taskQueue.setPreCheck(async () => {
  //   await forceCheckRootElement();
  //   return true;
  // })
}

const collectElement = (element: ExposureElement) => {
  elementMap.set(element.el.nodeId, element);

  const el = element.el;
  if (!rootElement) {
    if (el.isRootNode()) {
      _setRootElement(element);
    }
  }

  if (_rootId && !rootContainerElement) {
      // 如果用户指定了 rootid 一直等待 rootId
    if (el.id === _rootId) {
      // console.log('pvpvpvpv-regist root id: ', _rootId);
      rootContainerElement = element;
    }
  }
}

export const getElementMap = () => {
    return elementMap;
}

const seekRootElement = (el: HippyElement, style) => {

  if (el.isRootNode()) return createExposureElement(el, style);

  let res: ExposureElement | null = null;
  let curr = el.parentNode;
  while (curr) {
    if (curr.isRootNode()) {
      res = createExposureElement(el, style);
      break;
    }
    curr = curr.parentNode;
  }
  return res;
}