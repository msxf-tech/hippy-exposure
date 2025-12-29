/*
 * We are pleased to support the open source community by making
 * Hippy Exposure available.
 *
 * Copyright (c) 2015-present 马上消费金融股份有限公司, https://www.msxf.com/
 *
 * Licensed under the MIT LICENSE.
 */


import { swiperSlideTag } from './const';
import { ExposureElement, VisibleStatus } from "./type"; 
import { getRootElement } from './collect';
import { getIntersectionAreaRatio } from './math';
import { getElement, isHippyElement } from './utils';
import { HippyElement, HippyNode } from "@hippy/vue-next";
import { 
  visibleNotify,
  invisibleNotify,
} from './visible';

export const postToMeasureSwiperSelf = (
  swiper: ExposureElement,
  currentIndex: number
) => {

  const rootElement = getRootElement();
  const rootInW = rootElement?.rectInWindow;
  if (!rootInW) return;

  const rectW = swiper.rectInWindow;
  const rectS = swiper.rectInScroll;
  const swiperClipped = swiper.clippedRect;

  // swiper 还未初始化好
  if (!swiperClipped) return;
  if (!rectW && !rectS) return;

  let ratio = -1;
  // swiper 的自身也可能在一个 scroll 组件中
  const ancestorClipped = swiper.ancestorScrollElement?.clippedRect;
  if (rectS && ancestorClipped) {
    
    // 计算 scroll 相交比例
    ratio = getIntersectionAreaRatio(rectS, ancestorClipped);
    const lastRatio = swiper.intersectAreaRatioInScroll;
    swiper.lastIntersectAreaRatioInScroll = lastRatio;
    swiper.intersectAreaRatioInScroll = ratio;

  } else if (rectW) {
    // 计算 window 相交性
    ratio = getIntersectionAreaRatio(rectW, rootInW);
    const lastRatio = swiper.intersectAreaRatioInWindow;
    swiper.lastIntersectAreaRatioInWindow = lastRatio;
    swiper.intersectAreaRatioInWindow = ratio;
  }

  // 检查通知 swiper 自身的可见性
  const curr = swiper.currentVisibleStatus;
  if (ratio > 0) {
    // visible
    if (curr == VisibleStatus.invisible) {
      // 通知外部之前，必须先更新最新状态
      swiper.lastVisibleStatus = curr;
      swiper.currentVisibleStatus = VisibleStatus.visible;
      visibleNotify(swiper);

      const filters = swiper.el.childNodes.filter((child: HippyNode) => {
        if (isHippyElement(child) === false) return false;
        const childElement = child as HippyElement;
        if (childElement.tagName !== swiperSlideTag) return false;
        return true;
      }) as HippyElement[];

      // 只有一个 swiper slide，不会自动滚动，需要补报
      if (filters.length === 1) {
        postSwiperSlideVisible(swiper, 0);
      }
    } else {
      swiper.lastVisibleStatus = curr;
      swiper.currentVisibleStatus = VisibleStatus.visible;
    }
  } else {
    // invisible
    if (curr === VisibleStatus.visible) {
      // 通知外部之前，必须先更新最新状态
      swiper.lastVisibleStatus = curr;
      swiper.currentVisibleStatus = VisibleStatus.invisible;
      invisibleNotify(swiper);
      // 遍历所有子元素，通知不可变性
      postSwiperSlideInvisible(swiper, currentIndex);
    } else {
      swiper.lastVisibleStatus = curr;
      swiper.currentVisibleStatus = VisibleStatus.invisible;
    }
  }
}

export const postSwiperSlideVisible = (
  swiper: ExposureElement,
  currentIndex: number
) => {
  const swiperElement = swiper.el;
  const filters = swiperElement.childNodes.filter((child: HippyNode) => {
    if (isHippyElement(child) === false) return false;
    const childElement = child as HippyElement;
    if (childElement.tagName !== swiperSlideTag) return false;
    return true;
  }) as HippyElement[];

  if (filters.length <= currentIndex) return;

  const currSlide = filters[currentIndex];
  const currSlideElement = getElement(currSlide.nodeId);
  if (!currSlideElement) return;
  currSlideElement.swiperSlideIndex = currentIndex; // 记录索引

  // visible: swiper 存在定时器自动轮播的情况，比较特殊，不判断上次是否显示
  currSlideElement.lastVisibleStatus = currSlideElement.currentVisibleStatus;
  currSlideElement.currentVisibleStatus = VisibleStatus.visible;
  visibleNotify(currSlideElement);
  
  // 其他的报不可见
  filters.forEach((slideItem: HippyElement, index: number) => {
    if (index === currentIndex) return;
    const slideItemElement = getElement(slideItem.nodeId);
    if (!slideItemElement) return;

    slideItemElement.swiperSlideIndex = index;
    if (slideItemElement.currentVisibleStatus === VisibleStatus.visible) {
      // 通知外部之前，必须先更新最新状态
      slideItemElement.lastVisibleStatus = slideItemElement.currentVisibleStatus;
      slideItemElement.currentVisibleStatus = VisibleStatus.invisible;
      invisibleNotify(slideItemElement);
    } else {
      slideItemElement.lastVisibleStatus = slideItemElement.currentVisibleStatus;
      slideItemElement.currentVisibleStatus = VisibleStatus.invisible;
    }

    // TOOD: 后续通过配置 verbose 开关深度遍历
    // traverseSwiperSlideDescendant(slideItemElement, false);
  });
}

export const postSwiperSlideInvisible = (
  swiper: ExposureElement,
  currentIndex: number,
) => {
  const swiperElement = swiper.el;
  const filters = swiperElement.childNodes.filter((child: HippyNode) => {
    if (isHippyElement(child) === false) return false;
    const childElement = child as HippyElement;
    if (childElement.tagName !== swiperSlideTag) return false;
    return true;
  }) as HippyElement[];

  if (filters.length <= currentIndex) return;

  // invisible
  filters.forEach((slideItem: HippyElement, index: number) => {
    const slideItemElement = getElement(slideItem.nodeId);
    if (!slideItemElement) return;
    slideItemElement.swiperSlideIndex = index;

    if (slideItemElement.currentVisibleStatus === VisibleStatus.visible) {
      // 通知外部之前，必须先更新最新状态
      slideItemElement.lastVisibleStatus = slideItemElement.currentVisibleStatus;
      slideItemElement.currentVisibleStatus = VisibleStatus.invisible;
      invisibleNotify(slideItemElement);
    } else {
      slideItemElement.lastVisibleStatus = slideItemElement.currentVisibleStatus;
      slideItemElement.currentVisibleStatus = VisibleStatus.invisible;  
    }
    
    // TOOD: 后续通过配置 verbose 开关深度遍历
    // traverseSwiperSlideDescendant(slideItemElement, false);
  });
}

const traverseSwiperSlideDescendant = (slide: HippyElement, isVisible: boolean) => {
  slide.childNodes.forEach( (child: HippyNode) => {
    if (isHippyElement(child) === false) return;

    const descendant = getElement(child.nodeId);
    if (!descendant) return;
    // 上报自己
    if (isVisible) {
      descendant.lastVisibleStatus = descendant.currentVisibleStatus;
      descendant.currentVisibleStatus = VisibleStatus.visible;
      visibleNotify(descendant);
    } else {
      if (descendant.currentVisibleStatus === VisibleStatus.visible) {
        descendant.lastVisibleStatus = descendant.currentVisibleStatus;
        descendant.currentVisibleStatus = VisibleStatus.invisible;
        invisibleNotify(descendant);
      }
    }

    // 继续检测子节点
    traverseSwiperSlideDescendant(child as HippyElement, isVisible);
  });
}