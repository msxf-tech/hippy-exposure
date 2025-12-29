/*
 * We are pleased to support the open source community by making
 * Hippy Exposure available.
 *
 * Copyright (c) 2015-present 马上消费金融股份有限公司, https://www.msxf.com/
 *
 * Licensed under the MIT LICENSE.
 */


import { HippyLayoutEvent } from "@hippy/vue-next";
import { getRootElement } from './collect';
import { ExposureElement } from './type';
import {
  getParentExposureElement, 
  getScrollContainerElement,
  isSwiperScroll
} from './utils';
import {
  postToMeasure, 
  postToMeasureInScroll,
  postToMeasureInList,
  postToMeasureOnLayoutUpdated
} from './measure';
import {
  updateElementLayout,
} from './element';
import {
  debugLogAfterLayout
} from './debug';

export const readyUpdateOnLayout = (
  element: ExposureElement,
  layoutEvent: HippyLayoutEvent,
) => {
  element.onLayoutCount = element.onLayoutCount + 1;
  
  updateElementLayout(element, layoutEvent);
  debugLogAfterLayout(element, layoutEvent);
  
  if (element.onLayoutCount > 1) {
    // 非首次, 重新检查所有子元素的曝光并发出通知
    postToMeasureOnLayoutUpdated(element, true);
  } else {
    /* !!! doNothing
    * 首次 onLayout，只计算 layout 相关信息
    * 曝光通知，交由 onAttachedToWindow 阶段进行
    */
    if (element.onAttachedCount > 0) {
      /* Hippy 自身 bug 的 polyfill:
       * 存在已经 attach，但是还没有 onLayout 的情况，这里进行一次补报
       */
      readyMeasureOnAttached(element);
    }
  }
}

export const readyMeasureOnAttached = (element: ExposureElement) => {
  const rt = getRootElement();

  const ancestorScroll = element.ancestorScrollElement;
  if (ancestorScroll && isSwiperScroll(ancestorScroll.el)) {
    // swiper 后代节点, 较为特殊，在 onPageSelecte 中检测
    return;
  }

  if (element.isInListView === false) {
    /* 不在 list 的子节点分为
    * 1: 也不是 scroll 的后代节点
    * 2: 只是 scroll 的后代节点
    * 
    * Note 经验证：scroll 滑动的时候，onAttached 不会重复报，
    * scrollView 没有复用，onAttached 和 onlayout 回调一致
    */
    if (element.isInScrollView) {
      // 理论上这里不需要处理滑动，加个 if 提醒这里能检测到首次 attached，且在 scrollView
      const clippedRectInScroll = element.ancestorScrollElement?.clippedRect;
      postToMeasureInScroll(element, clippedRectInScroll);
    } else {
      postToMeasure(element);
      /* 如果是 scrollView，第一个根容器，不会走 onAttached，但是会走 onLayout
      * 这里 polyfill 补报一次根容器
      */
      if (element.isScrollView) {
        const scrollContainer = getScrollContainerElement(element.el);
        if (scrollContainer) { 
          const clippedRectInScroll = scrollContainer.ancestorScrollElement?.clippedRect;
          postToMeasureInScroll(scrollContainer, clippedRectInScroll);
        }
      }
    }
    return;
  }

  //!!!!!!!!!!!!!!!!!!!!!!!! 处理 ListView 的情况 !!!!!!!!!!!!!!!!!!!!!

  const parentElement = getParentExposureElement(element.el);
  const isLi = element.el.tagName === 'li';
  if (isLi) {
    /* NOTE: 理论上不会走这里，因为 ListItem 不会报 onAttached (复用机制)
    * 这里为了逻辑完备，以及应对不同环境的差异 (iOS / Android / 鸿蒙)
    */
    postToMeasure(element);
    return;
  }

  /* 接下来只处理，ListItem 的直接后代节点
  * polyfill: iOS 上 li 标签不报 attached 主动查一次
  */
  const listElement = element.ancestorScrollElement;
  if (!listElement) {
    // throw new Error(`[onAttachedToWindow]:ancestorScrollElement must have been set on ahead; ele: ${element}`);
    return;
  }
    
  let clippedRect = listElement.clippedRect;
  if (!clippedRect) {
    // throw new Error(`[onAttachedToWindow]: clippedRect must have been set on ahead; list: ${listElement}`);
    return;
  }

  if (parentElement && parentElement.el.tagName === 'li') {
    // 先向上检查父节点是否为 li，补报 li
    postToMeasureInList(parentElement, clippedRect);
  }
  // 然后测量自己
  postToMeasureInList(element, clippedRect);
}

