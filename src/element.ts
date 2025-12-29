/*
 * We are pleased to support the open source community by making
 * Hippy Exposure available.
 *
 * Copyright (c) 2015-present 马上消费金融股份有限公司, https://www.msxf.com/
 *
 * Licensed under the MIT LICENSE.
 */

import { 
  HippyElement,
  HippyLayoutEvent,
  HippyNode,
  Native
} from "@hippy/vue-next";
import { 
  ExposureElement,
  VisibleStatus,
  ExposureLayout,
} from './type';
import { 
  getElement, 
  getParentExposureElement,
  isScrollViewElement,
  isSwiperScroll,
  isSwiperSlideElement,
  isHiPullHeader,
  needFilter,
  classListInfo
} from './utils';
import {
  debugLogForHippyNodeType,
  debugLogForElementCreated,
  debugLogForLayoutInParent,
  debugLogForLayoutInWindow,
  debugLogForLayoutInScroll,
  debugLogForLayoutInWindowBefore,
  debugLogElementWhenException,
  debugLogForScrollContentSize
} from './debug';
import taskQueue from './task';

const deepUpdateAttachedState = (
  el: HippyNode, 
  attached: boolean,
) => {
  el.childNodes.forEach(item => {
    debugLogForHippyNodeType(item);
    
    if (needFilter(item)) return;
    const element = getElement(item.nodeId);
    if (element) {
      element.isAttached = attached
    }
    deepUpdateAttachedState(item, attached);
  });
}

export const updateAttachedState = (
  element: ExposureElement, 
  attached: boolean,
  needDeepRecursive = false, // 是否需要深度递归赋值
) => {
  element.isAttached = attached;
  if (needDeepRecursive) {
    deepUpdateAttachedState(element.el, attached);
  }
}

// TODO: 绝对定位的需要排除在体系之外 
export const createExposureElement = (el: HippyElement, style: any): ExposureElement => {

  const isListView = el.tagName === 'ul';
  const isSwiper = isSwiperScroll(el, style);
  const isSwiperSlide = isSwiperSlideElement(el, style);
  const isScrollView = isScrollViewElement(el, style) || isSwiper;
  const isListItemView = el.tagName === 'li';
  const isPullHeader = isHiPullHeader(el);

  let ancestorScrollElement: ExposureElement | null = null;

  let isInListView = false;
  let isInScrollView = false;
  let isInSwiper = false;

  /* 需要支持 scroll 嵌套情况，这里去掉判断
  if (!isListView && !isScrollView) {
    
  }
  */
  const parent = getParentExposureElement(el);
  if (parent) {
    if (isListItemView || isPullHeader) {
      ancestorScrollElement = parent;
      isInListView = true;
    } else {
      /* create 过程，从根节点开始深度遍历
        * isInListView 和 isInScrollView 只需逐层传递即可
      */
      if (parent.isScrollView || parent.isListView || parent.isSwiper) {
        ancestorScrollElement = parent;
        isInScrollView = true;
        if (parent.isSwiper) {
          isInSwiper = true;
        }
      } else {
        isInListView = (parent.isInListView || parent.isListItemView || parent.isListView);
        isInScrollView = (parent.isScrollView || parent.isInScrollView);
        // swiper 本身也是基于 scrollView 实现，所以 isInSwiper 和 isInScrollView 并不冲突
        isInSwiper = (parent.isInSwiper || parent.isSwiper || parent.isSwiperSlide);
        ancestorScrollElement = parent.ancestorScrollElement;
      }
    }
  }

  const ret: ExposureElement = {
    el: el,

    isAttached: false,

    currentVisibleStatus: VisibleStatus.invisible,
    lastVisibleStatus: VisibleStatus.invisible,

    isListView: isListView,
    isScrollView: isScrollView,
    isSwiper: isSwiper,
    isListItemView: isListItemView,

    isInListView: isInListView,
    isInScrollView: isInScrollView,
    isInSwiper: isInSwiper,
    isPullHeader: isPullHeader,

    isSwiperSlide: isSwiperSlide,

    ancestorScrollElement: ancestorScrollElement,

    hadAddLayout: false,
    hadAddAttached: false,
    hadAddDetached: false,
    hadAddAppear: false,
    hadAddDisappear: false,
    hadAddWillAppear: false,
    hadAddWillDisappear: false,
    hadAddScroll: false,
    hadAddMomentumScrollBegin: false,
    hadAddMomentumScrollEnd: false,
    hadAddScrollBeginDrag: false,
    hadAddScrollEndDrag: false,
    hadAddPageSelected: false,

    onLayoutCount: 0,
    onAttachedCount: 0,
    currSwiperSelectedIndex: 0,

    hadRemove: false
  };

  debugLogForElementCreated(ret);

  return ret;
}

// 在 onLayout 中调用
export const updateElementLayout = async (
  element: ExposureElement,
  layoutEvent: HippyLayoutEvent
) => {
  // 调用顺序固定
  updateLayoutInParent(element, layoutEvent);
  updateLayoutInWindow(element);

  // FUTURE: 优化，目前前端无法通过属性获取当前准确的 contentOffset
  setScrollContent(element);
  updateLayoutInScroll(element);
  
  if (element.isSwiper) {
    // 检查是否有需要补报的 swiper
    taskQueue.runSwiper(element);
  } else {
    // swiper 不会检查子元素的坐标，所有不需要更新子元素的位置
    // TODO: 相对父元素位置变化，且非首次 onLayout，
    // 需要重新遍历，重新计算所有子元素的 rectInectInWindow rectInScroll
    if (element.onLayoutCount > 1) {
      // const clsInfo = classListInfo(element.el);
      // console.log('onlayoutCount: ', element.onLayoutCount, '; id:', element.el.nodeId, '--', clsInfo);
      forceUpdateDescendantLayout(element);
    }
  }
}

// 深度优先遍历所有可计算且符合条件的的后代节点
// 可计算：rectInParent 已经有值
// 符合条件: needFilter 过滤后的后代节点
const forceUpdateDescendantLayout = (element: ExposureElement) => {
  for(const item of element.el.childNodes) {
    if (needFilter(item)) continue;
    const subElement = getElement(item.nodeId);
    if (subElement) {
      updateLayoutInWindow(subElement);
      updateLayoutInScroll(subElement);
      forceUpdateDescendantLayout(subElement);
    }
  }
}

export const updateLayoutInParent = (
  element: ExposureElement,
  layoutEvent: HippyLayoutEvent,
) => {
  const rect: ExposureLayout = {
    x: layoutEvent.left ?? 0,
    y: layoutEvent.top ?? 0,
    width: layoutEvent.width ?? 0,
    height: layoutEvent.height ?? 0,
  };
  element.rectInParent = rect;

  // 记录 pull header 的 rect，用来修正 offset
  if (element.isPullHeader && element.ancestorScrollElement) {
    const ancestorElement = element.ancestorScrollElement;
    const pullRect = element.rectInParent;
    ancestorElement.pullHeaderRect = pullRect;
    const clippedRect = ancestorElement.clippedRect;

    // 对初始值修正
    if (pullRect && clippedRect && clippedRect.y === 0) {
      ancestorElement.clippedRect = {
        ...clippedRect,
        y: pullRect.height + pullRect.y,
      }
    }
    
  }

  debugLogForLayoutInParent(element);
}

const updateLayoutInWindow = (
  element: ExposureElement
) => {

  const rectInParent = element.rectInParent;
  if (!rectInParent) {
    // throw new Error(`rectInParent must be set on ahead`);
    return; 
  }

  const el = element.el;
  const isRoot = el.isRootNode();

  debugLogForLayoutInWindowBefore(element);

  if (isRoot) {
    // TODO: 可配置相对于 AppWindow 或者 window
    element.rectInWindow = rectInParent;
    element.intersectAreaRatioInWindow = 1.0;
  } else {
    const parentNode = getParentExposureElement(element.el);
    if (!parentNode || !parentNode.rectInWindow) {
      const excepInfo = `[upInW]: p-error: empty parentNode or parent's rectInWindow`;
      debugLogElementWhenException(element.el, excepInfo);
      // throw new Error(`parent node should have already layouted both in parent and in window`);
      return;
    }
    
    const pRectInWindow = parentNode.rectInWindow;
    const rectInWindow = {
      x: rectInParent.x + pRectInWindow.x,
      y: rectInParent.y + pRectInWindow.y,
      width: rectInParent.width,
      height: rectInParent.height
    }
    element.rectInWindow = rectInWindow;
  }

  debugLogForLayoutInWindow(element);
}

const setScrollContent = (element: ExposureElement) => {
  if (!element.isListView && !element.isScrollView) return;

  if (!element.contentOffset) {
    /* contentOffset 在 onlayou 阶段，只需初始化执行一次
      * 其他情况，在 onScroll 中更新
      */
    element.contentOffset = { x: 0, y: 0 };
  }

  /* clippedRect 默认每次 onLayout 都更新，和容器本身的 w h 一样
    * Note: onScroll 阶段会再次更新 onScroll
    */
  if (!element.clippedRect) {
    const rect = element.rectInParent;
    const clippedRect = {
      ...element.contentOffset, 
      width: rect?.width ?? 0, 
      height: rect?.height ?? 0
    };
    element.clippedRect = clippedRect;
    debugLogForScrollContentSize(element, clippedRect);
    
  }
}

const updateLayoutInScroll = (
  element: ExposureElement
) => {

  const rectInParent = element.rectInParent;
  if (!rectInParent) {
    return; 
  }
  
  // 需要支持 scrollView 嵌套的情况, 注释掉 if 判断
  // if (!element.isInListView && !element.isInScrollView) return;

  const parent = getParentExposureElement(element.el);
  // swiper 也属于 scrollView 
  const parentIsScroll = (parent !== null && parent.isScrollView);
  const isLi = element.isListItemView;

  // 处理 scroll 嵌套的情况
  const selfIsScrollOrList = element.isListView || element.isScrollView; 

  if (selfIsScrollOrList === false && (isLi || parentIsScroll)) {
    // li 或者 scrollView 的直接后代节点，rectInScroll = rectInParent;
    // swipter 理论上也满足这个特性
    // swiper-slide 默认: top bottom left right 都是 0
    // Possilbe：目前 scroll / list / swiper 的使用，每个 item 都会有个容器 div
    // 这个逻辑暂时成立
    element.rectInScroll = rectInParent;
  } else {
    // 后代节点或者本身是 scrollOrList，通过迭代父节点，计算得出
    const parentRectInScroll = parent?.rectInScroll;
    if (parentRectInScroll) {
      element.rectInScroll = {
        x: rectInParent.x + parentRectInScroll.x,
        y: rectInParent.y + parentRectInScroll.y,
        width: rectInParent.width,
        height: rectInParent.height,
      }
    }
  }

  debugLogForLayoutInScroll(element);
}