/*
 * We are pleased to support the open source community by making
 * Hippy Exposure available.
 *
 * Copyright (c) 2015-present 马上消费金融股份有限公司, https://www.msxf.com/
 *
 * Licensed under the MIT LICENSE.
 */


import { 
  HippyLayoutEvent,
  HippyEvent,
  ViewPagerEvent,
} from "@hippy/vue-next";
import {
  updateAttachedState,
} from './element'
import {
  getScrollContainerElement,
  getElement,
  needFilter,
  isCustomScroll,
} from './utils';
import {
  ExposureLayout,
  ExposureElement,
} from './type';

import { 
  postToMeasureInScroll,
  postToMeasureSwiper,
  postToMeasureInListWithDeepTraverse,
  postToMeasureInScrollWithDeepTraverse,
} from './measure';
import { readyMeasureOnAttached, readyUpdateOnLayout } from './ready';

import {
  debugLogOnLayout,
  debugLogOnAttaced,
  debugLogForHippyNodeType,
  debugLogForListScrolling,
  debugLogForScrollScrolling,
  debugLogForSwiperPaging
} from './debug';
import taskQueue from './task';

export const onLayout = (element:ExposureElement, layoutEvent: HippyLayoutEvent) => {
  debugLogOnLayout(element, layoutEvent);

  if (taskQueue.isReady()) {
    readyUpdateOnLayout(element, layoutEvent);
  } else {
    taskQueue.addBacklog('layout', element, layoutEvent);
  }
}

export const onAttachedToWindow = (element:ExposureElement, event: HippyEvent) => {

  debugLogOnAttaced(element, event);
  
  element.onAttachedCount = element.onAttachedCount + 1;
  /* 进入 onAttached 回调的 case:
   * 1: 首次 attache, ListView 中的后代节点
   * 2: listView 滑动过程中的后代节点 (复用机制)
   * 2: scrollView 中的全部
   * 3: 不在 scrollView 和 listView 中的，首次报或者 detached 后，重新 attached
   */
  
  updateAttachedState(element, true);

  if (taskQueue.isReady()) {
    readyMeasureOnAttached(element);
  } else {
    taskQueue.addBacklog('attached', element);
  }
}

// listview 的监听
export const onListViewScroll = (element:ExposureElement, event: HippyEvent) => {
  // 更新 clipped 区域
  const clipped = element.clippedRect;
  if (!clipped) {
    // throw new Error(`[onListViewScroll] scroll's | list's clippedRect must have been set on ahead`);
    return;
  }

  const ox = Math.round((event as any).offsetX);
  const oy = Math.round((event as any).offsetY);

  // 如果有 pull header 需要对 y 值做补偿
  let recoupedOffsetY = 0;
  if (element.pullHeaderRect) {
    const recoupedRect = element.pullHeaderRect;
    recoupedOffsetY = recoupedRect.height + recoupedRect.y;
  }
  element.contentOffset = { x: ox, y: oy };
  const newClipped = {
    x: ox,
    y: oy + recoupedOffsetY,
    width: clipped.width,
    height: clipped.height,
  }
  element.clippedRect = newClipped;
  debugLogForListScrolling(element, newClipped);
  // taskQueue.add(async () => {
  // });
  if (isCustomScroll(element.el) === false) {
    // TODO: 用户自定义的 scroll 暂时无法完美支持
    readyMeasureOnListScroll(element, newClipped);
  }
}

const readyMeasureOnListScroll = async (list: ExposureElement, newClipped: ExposureLayout) => {

  const lId = list.el.nodeId;

  for (const item of list.el.childNodes) {
    debugLogForHippyNodeType(item);

    if (needFilter(item)) continue;

    const subListElement: ExposureElement | undefined = getElement(item.nodeId);
    // 不抛错误，让后续的节点还有机会检查
    if (!subListElement) {
      continue;
    }

    postToMeasureInListWithDeepTraverse(subListElement, newClipped);
  };
}

// scrollView 的监听
export const onScrollViewScroll = (element:ExposureElement, event: HippyEvent) => {
  // 更新 clipped 区域
  const clipped = element.clippedRect;
  if (!clipped) {
    // throw new Error(`[onListViewScroll] scroll's | list's clippedRect must have been set on ahead`);
    return;
  }

  const ox = Math.round((event as any).offsetX);
  const oy = Math.round((event as any).offsetY);
  element.contentOffset = { x: ox, y: oy };
  const newClipped = {
    x: ox,
    y: oy,
    width: clipped.width,
    height: clipped.height,
  }
  element.clippedRect = newClipped;

  debugLogForScrollScrolling(element, newClipped);
  // taskQueue.add(async () => {
  // });
  if (isCustomScroll(element.el) === false) {
    // TODO: 用户自定义的 scroll 暂时无法完美支持
    readyMeasureOnScrollView(element, newClipped);
  }
}

const readyMeasureOnScrollView = async (scroll: ExposureElement, newClipped: ExposureLayout) => {

  const lId = scroll.el.nodeId;
  const scrollContainer = getScrollContainerElement(scroll.el);
  if (!scrollContainer) return;

  // 先测量自己，内部不进行递归
  postToMeasureInScroll(scrollContainer, newClipped);

  for (const item of scrollContainer.el.childNodes) {
    debugLogForHippyNodeType(item);

    if (needFilter(item)) continue;

    const subListElement: ExposureElement | undefined = getElement(item.nodeId);
    // 不抛错误，让后续的节点还有机会检查
    if (!subListElement) {
      continue;
    }
    postToMeasureInScrollWithDeepTraverse(subListElement, newClipped);
  };
}

// swiper 监听
let lastSwiperCallTime = 0;
let lastSwiperNodeId = -1110;
export const onPageSelected = (swiper: ExposureElement, vpEvent: ViewPagerEvent) => {

  if (taskQueue.isReady() === false) return;
   
  const nid = swiper.el.nodeId;
  if (nid === lastSwiperNodeId) {
    lastSwiperNodeId = nid;
    // onPageSelected 回调不准确，同一个 swiper 存在连续多次调用的情况
    // 未来可以将这个防抖时间做成配置

    const now = Date.now();
    const timeDiff = Math.abs(now - lastSwiperCallTime);
    lastSwiperCallTime = now;
    if (timeDiff < 150) {
      return;
    }
    
  }
  lastSwiperNodeId = nid;

  debugLogForSwiperPaging(swiper, vpEvent);
  
  // swiper 有值
  if (swiper.rectInParent) {
    // 计算曝光
    postToMeasureSwiper(swiper, vpEvent);
  } else {
    // 记录
    taskQueue.addSwiperBacklog(swiper, vpEvent);
  }
}

export const onDetachedFromWindow = (element:ExposureElement, event: HippyEvent) => {
  // onDetached 回调不准确，暂时不使用
  
  // console.log('===onDetachedFromWindow');
  // debugLogOnDetached(element, event);
  // updateAttachedState(element, false, true);
  // recycleElementWithDeepTraverse(element);
  // debugLogAfterDetached(element, event);
}

export const onAppear = (element:ExposureElement, event: HippyEvent) => {
}

export const onDisappear = (element:ExposureElement, event: HippyEvent) => {
}

export const onWillAppear = (element:ExposureElement, event: HippyEvent) => {
}

export const onWillDisappear = (element:ExposureElement, event: HippyEvent) => {
}

export const onListMomentumScrollBegin = (element:ExposureElement, event: HippyEvent) => {
}

export const onListMomentumScrollEnd = (element:ExposureElement, event: HippyEvent) => {
}

export const onListScrollBeginDrag = (element:ExposureElement, event: HippyEvent) => {
}

export const onListScrollEndDrag = (element:ExposureElement, event: HippyEvent) => {
}

export const onMomentumScrollBegin = (element:ExposureElement, event: HippyEvent) => {
}

export const onMomentumScrollEnd = (element:ExposureElement, event: HippyEvent) => {
}

export const onScrollBeginDrag = (element:ExposureElement, event: HippyEvent) => {
}

export const onScrollEndDrag = (element:ExposureElement, event: HippyEvent) => {
}