/*
 * We are pleased to support the open source community by making
 * Hippy Exposure available.
 *
 * Copyright (c) 2015-present 马上消费金融股份有限公司, https://www.msxf.com/
 *
 * Licensed under the MIT LICENSE.
 */


import { ExposureElement, ExposureLayout, VisibleStatus } from "./type"; 
import { getElement, needFilter } from './utils';
import { getRootElement } from './collect';
import { 
  pollForNewcomeVisibleStatus,
  pollForNewcomeInvisibleStatus,
} from './visible';
import { 
  ignoredDeepTraverseInWindow,
  ignoredDeepTraverseInScroll 
} from './performance';
import { 
  debugLogOnNormalMeasureBeforeVisible,
  debugLogOnListItemsMeasure,
  debugLogOnScrollItemsMeasure,
  debugLogForHippyNodeType,
  debugLogForScrollItemsMeasureWhenScroll,
  debugLogForListItemsMeasureWhenListScroll,
  debugLogMeasureOnLayoutUpdate,
  debugLogOnNormalMeasureStart,
  debugLogElementWhenException
} from './debug';
import { getIntersectionAreaRatio } from './math';
import { ViewPagerEvent } from "@hippy/vue-next";
import { postToMeasureSwiperSelf, postSwiperSlideVisible } from './swiper';

// 1: 只处理，不在 list 和 scroll 的 element
// 2：不会深度递归
export const postToMeasure = async (element: ExposureElement) => {

  debugLogOnNormalMeasureStart(element);

  if (element.isInListView || element.isInScrollView) return;

  const rootElement = getRootElement();
  if (!rootElement || !rootElement.rectInWindow) 
    throw new Error(`rootElement and it's rect should be set before measured!`);

  let elRectInWindow = element.rectInWindow;
  if (!elRectInWindow) {
    // elRectInWindow = await getRectInWindowWithPolyfill(element);
    debugLogElementWhenException(element.el, 'element rectInWindow exception');
    return;
  }
  const rootInW = rootElement.rectInWindow;
  const ratio = getIntersectionAreaRatio(elRectInWindow, rootInW);
  const lastRatio = element.intersectAreaRatioInWindow;
  element.lastIntersectAreaRatioInWindow = lastRatio;
  element.intersectAreaRatioInWindow = ratio;

  debugLogOnNormalMeasureBeforeVisible(element, rootInW);

  if (ratio > 0) {
    // visible
    pollForNewcomeVisibleStatus(element, lastRatio, ratio);
  } else {
    // invisible
    pollForNewcomeInvisibleStatus(element);
  }
}

export const postToCheckSwiperAhead = (element: ExposureElement) => {
  if (element.isSwiper) {
    // 检查 swiper
    postToMeasureSwiperSelf(element, element.currSwiperSelectedIndex);
    return true;
  }

  // swiperSlide 无需在这里检查
  if (element.isSwiperSlide) return true;

  if (element.isInScrollView && element.ancestorScrollElement) {
    const ancestorElement = element.ancestorScrollElement;
    if (ancestorElement.isSwiper) {
      // swiper 后代节点，在 onPageSelected 中特殊计算，这里暂时不需要处理
      return true;
    }
  }

  return false;
}

// onLayout 重新触发，递归查询所有子节点
export const postToMeasureOnLayoutUpdated = async (
  element: ExposureElement,
  deepIgnoreCheck: boolean = true,
) => {

  // swiper 相关走特殊处理，无需深度递归
  if (postToCheckSwiperAhead(element)) return;

  if (element.isInListView) {
    const clippedRect = element.ancestorScrollElement?.clippedRect;
    if (clippedRect) {
      postToMeasureInListWithDeepTraverse(element, clippedRect, deepIgnoreCheck);
    }
  } else if (element.isInScrollView) {
    const ancestor = element.ancestorScrollElement;
    const clippedRect = ancestor?.clippedRect;
    if (clippedRect) {
      postToMeasureInScrollWithDeepTraverse(element, clippedRect, deepIgnoreCheck);
    }
  } else {
    // 优化过滤
    if (ignoredDeepTraverseInWindow(element)) return;

    postToMeasure(element);

    debugLogMeasureOnLayoutUpdate(element);
    
    // 遍历子节点
    for (const item of element.el.childNodes) {
      debugLogForHippyNodeType(item);
      
      if (needFilter(item)) continue;
      const subElement = getElement(item.nodeId);
      if (!subElement) {
        const excepInfo = `get undefined subElement when loop for nodeId: ${item.nodeId}`
        debugLogElementWhenException(element.el, excepInfo);
        continue;
      }
      // 递归遍历
      postToMeasureOnLayoutUpdated(subElement);
    }
  }
}

/* 2: 只处理在 scrollView 中，且 scrollView 是静止的
 * 静止态，不做深度递归，每个元素都发过来计算
 *
 * Future 优化：提前检查 w h，有一个为 0，停止深度递归，
 * 优化需验证：是否 onLayout 布局不严格：即存在父元素 w * h = 0; 但子元素可见。
 */
export const postToMeasureInScroll = async (
  element: ExposureElement,
  clippedRect: ExposureLayout | undefined
) => {

  if (!clippedRect) {
    // throw new Error(`ancestorScrollElement clippedRect must have been set on ahead`);
    const excepInfo =`ancestorScrollElement clippedRect must have been set on ahead`
    debugLogElementWhenException(element.el, excepInfo);
    return;
  }
  
  // 和 clippedRect 计算相交
  const rectInScroll = element.rectInScroll;
  if (!rectInScroll) {
    // throw new Error(`rectInScroll must have been set on ahead`);
    const excepInfo = `rectInScroll must have been set on ahead`;
    debugLogElementWhenException(element.el, excepInfo);
    return;
  }

  if (postToCheckSwiperAhead(element)) return;

  const ratio = getIntersectionAreaRatio(rectInScroll, clippedRect);
  const lastRatio = element.intersectAreaRatioInScroll;
  element.lastIntersectAreaRatioInScroll = lastRatio;
  element.intersectAreaRatioInScroll = ratio;

  debugLogOnScrollItemsMeasure(element, clippedRect);

  if (ratio > 0) {
    // visible
    pollForNewcomeVisibleStatus(element, lastRatio, ratio);
  } else {
    // invisible
    pollForNewcomeInvisibleStatus(element);
  }
}

export const postToMeasureInScrollWithDeepTraverse = async (
  element: ExposureElement,
  clippedArea: ExposureLayout,
  deepIgnoreCheck: boolean = true,
) => {

  if (element.isInScrollView === false) return;

  if (!clippedArea) {
    // throw new Error(`[postToMeasureInListWithDeepTraverse]: capture undefined newClipped in list`);
    const excepInfo = `[postToMeasureInListWithDeepTraverse]: capture undefined clippedArea in list`;
    debugLogElementWhenException(element.el, excepInfo);
    return;
  }

  const rectInScroll = element.rectInScroll;
  if (deepIgnoreCheck && rectInScroll !== undefined ) { 
    /* !!! important: 这里不能检查和 window 的关系
    * 存在上次为可见，然后划出了 clipped 区域 (变为不可见)，但是相对 window 仍是可见状态
    */
    // if(ignoredDeepTraverseInWindow(subElement)) continue;
    if(ignoredDeepTraverseInScroll(element, rectInScroll, clippedArea)) return;
  }

  debugLogForScrollItemsMeasureWhenScroll(element, clippedArea);

  // swiper 相关走特殊处理，无需深度递归
  if (postToCheckSwiperAhead(element)) return;

  const eId = element.el.nodeId;
  // 1: 先测量自己
  try {
    postToMeasureInScroll(element, clippedArea);
  } catch (error) {
    // throw new Error(`[postToMeasureInListWithDeepTraverse]: capture null exposure element: ${eId}`);
    const excepInfo = `[postToMeasureInListWithDeepTraverse]: capture error in postToMeasureInScroll`;
    debugLogElementWhenException(element.el, excepInfo);
  }

  // 2: 递归测量所有子节点
  for(const item of element.el.childNodes) {

    debugLogForHippyNodeType(item);
    
    if (needFilter(item)) continue;

    const subElement = getElement(item.nodeId);
    // 不抛错误，让后续的节点还有机会检查
    if (!subElement) {
      const excepInfo = `[postToMeasureInListWithDeepTraverse]: capture null exposure element: ${item}`;
      debugLogElementWhenException(element.el, excepInfo);
      continue;
    }
    postToMeasureInScrollWithDeepTraverse(subElement, clippedArea);
  }
}

/* 
 * 3:只处理在 ListView
 * clippedRect: ExposureLayout 让外部传入，方便让异步函数进行值捕获
 * 目的：list 滑动的时候，捕获滑动瞬时的值，检查粒度更细
 * 不做深度递归
 */
export const postToMeasureInList = async (
  element: ExposureElement,
  clippedRect: ExposureLayout | undefined
) => {

  /* FUTURE: 
   *
   * 目前假设了所有 ListView 容器本身一定全部出现在了 window 上
   * 并且咱不处理多层 list / scroll 相互嵌套的情况
   * 
   * FUTURE: 可以优化的点
   * 1: 多层 list / scroll 嵌套的情况，判断所有的祖先 list / scroll
   */

  if (!clippedRect) {
    // throw new Error(`ancestorScrollElement clippedRect must have been set on ahead`);
    const excepInfo = `ancestorScrollElement clippedRect must have been set on ahead`;
    debugLogElementWhenException(element.el, excepInfo);
    return;
  }
  
  // 和 clippedRect 计算相交
  const rectInScroll = element.rectInScroll;
  if (!rectInScroll) {
    // throw new Error(`rectInScroll must have been set on ahead`);
    const excepInfo = `rectInScroll must have been set on ahead`;
    debugLogElementWhenException(element.el, excepInfo);
    return;
  }

  if (postToCheckSwiperAhead(element)) return;

  debugLogOnListItemsMeasure(element, clippedRect);

  const ratio = getIntersectionAreaRatio(rectInScroll, clippedRect);
  const lastRatio = element.intersectAreaRatioInScroll;
  element.lastIntersectAreaRatioInScroll = lastRatio;
  element.intersectAreaRatioInScroll = ratio;

  if (ratio > 0) {
    // visible
    pollForNewcomeVisibleStatus(element, lastRatio, ratio);
  } else {
    // invisible
    pollForNewcomeInvisibleStatus(element);
  }
}

/* 
 * 3:只处理在 ListView，且深度递归查询
 * deepIgnoreCheck 是否对子节点进行忽略检查
 */
export const postToMeasureInListWithDeepTraverse = async (
  element: ExposureElement,
  clippedArea: ExposureLayout,
  deepIgnoreCheck: boolean = true,
) => {

  if (element.isInListView === false) return;

  if (!clippedArea) {
    const excepInfo = `[postToMeasureInListWithDeepTraverse]: capture undefined clippedArea in list`;
    debugLogElementWhenException(element.el, excepInfo);
    return;
  }

  const rectInScroll = element.rectInScroll;
  if (deepIgnoreCheck && rectInScroll !== undefined ) { 
    /* !!! important: 这里不能检查和 window 的关系
    * 存在上次为可见，然后划出了 clipped 区域 (变为不可见)，但是相对 window 仍是可见状态
    */
    // if(ignoredDeepTraverseInWindow(subElement)) continue;
    if(ignoredDeepTraverseInScroll(element, rectInScroll, clippedArea)) return;
  }

  debugLogForListItemsMeasureWhenListScroll(element, clippedArea);

  // swiper 相关走特殊处理，无需深度递归
  if (postToCheckSwiperAhead(element)) return;

  const eId = element.el.nodeId;
  // 1: 先测量自己
  try {
    postToMeasureInList(element, clippedArea);
  } catch (error) {
    const excepInfo = `[postToMeasureInListWithDeepTraverse]: capture null exposure element: ${eId}`;
    debugLogElementWhenException(element.el, excepInfo);
  }

  // 2: 递归测量所有子节点
  for(const item of element.el.childNodes) {

    // debugLogForHippyNodeType(item);
    
    if (needFilter(item)) continue;

    const subElement = getElement(item.nodeId);
    // 不抛错误，让后续的节点还有机会检查
    if (!subElement) {
      const excepInfo = `[postToMeasureInListWithDeepTraverse]: capture null exposure element: ${item}`;
      debugLogElementWhenException(element.el, excepInfo);
      continue;
    }
    
    postToMeasureInListWithDeepTraverse(subElement, clippedArea);
  }
}

// 从 onPageSelected 调入，检查可见性
export const postToMeasureSwiper = (swiper: ExposureElement, vpEvent: ViewPagerEvent) => {
  const currentIndex = vpEvent.currentSlide;
  if (currentIndex === undefined) return;
  swiper.currSwiperSelectedIndex = currentIndex;

  if (swiper.currentVisibleStatus === VisibleStatus.visible) {
    // swiper 可见，只检查 swiper slide 的可见性，swiper 自身由其他逻辑处理
    postSwiperSlideVisible(swiper, currentIndex);
  }
}