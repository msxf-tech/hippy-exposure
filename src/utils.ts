/*
 * We are pleased to support the open source community by making
 * Hippy Exposure available.
 *
 * Copyright (c) 2015-present 马上消费金融股份有限公司, https://www.msxf.com/
 *
 * Licensed under the MIT LICENSE.
 */


import { HippyNode, HippyElement } from '@hippy/vue-next';
import { getElementMap } from "./collect";
import { ExposureElement, ExposureLayout, VisibleStatus } from "./type";
import { swiperSlideTag, swiperTag, hiPullHeaderTag } from './const';

let customScrollComponent: string[] | undefined = undefined;

export const isHippyElement = (node: HippyNode) => {
  return (node && "tagName" in node);
}

export const setCustomScrollComponents = (tags: string[]) => {
  customScrollComponent = tags;
}

// 判断是否为注释的节点
export const isCommentElement = (el: HippyNode) => {
  if (isHippyElement(el) === false) return false;
  return el && (el as HippyElement).tagName === 'comment';
}

/* 对 hippy hi-swiper 做特殊处理
 * 本质上客户端对 hi-swiper 也是通过 ScrollView 实现
 * 但表现的是一个 ViewPager 行为，不会触发 onScroll，所以需要特殊处理
 */
export const isSwiperScroll = (el: HippyElement, style: any = {}) => {
  const tag = el.tagName;
  if (tag === swiperTag) return true;
  return false;
}

// 是否为下拉刷新组件，会影响每个子组件的 y 值；
// 记录下拉刷新占据的空间，通过 scroll offset 纠正曝光计算
export const isHiPullHeader = (el: HippyElement, style: any = {}) => {
  const tag = el.tagName;
  if (tag === hiPullHeaderTag) return true;
  return false;
}

export const isSwiperSlideElement = (el: HippyElement, style: any = {}) => {
  const tag = el.tagName;
  if (tag === swiperSlideTag) return true;
  return false;
}

export const isScrollViewElement = (el: HippyElement, style: any) => {
  if (isHippyElement(el) === false) return false;
  const tag = el.tagName;
  if (tag === 'ul') return false;
  if (style.overflowY === 'scroll' ||  style.overflowX === 'scroll') return true;

  return isCustomScroll(el);
}

export const isCustomScroll = (el: HippyElement) => {
  const tag = el.tagName;
  if (customScrollComponent && customScrollComponent.includes(tag)) return true;
  return false;
}

export const isNeedInsertToNative = (el: HippyNode) => {
  if (isHippyElement(el) === false) return false;
  return el.isNeedInsertToNative;
}

export const needFilter = (el: HippyNode) => {
  if (isHippyElement(el) === false) return true;
  return isCommentElement(el) || (isNeedInsertToNative(el) === false);
}

export const getElement = (nodeId: number) => {
  const elementMap = getElementMap();
  // const keysArray = Array.from(elementMap.keys());
  return elementMap.get(nodeId);
}

export const isElementVisible = (nodeId: number): boolean => {
  const ele = getElement(nodeId);
  if (ele === undefined) return false;
  const currVisibleStatus = ele.currentVisibleStatus;
  return currVisibleStatus === VisibleStatus.visible;
}

export const getScrollContainerElement = (el: HippyElement): ExposureElement | null => {
  if (!el.childNodes || el.childNodes.length === 0) return null;
  const first = el.childNodes.find((item) => {
    return (isHippyElement(item) && !isCommentElement(item));
  });
  if (!first) return null;
  const res = getElement(first.nodeId);
  if (!res) return null;
  return res;
}

export const getParentExposureElement = (el: HippyElement): ExposureElement | null => {
  const pel = el.parentNode;
  if (!pel) return null;
  const res = getElement(pel.nodeId);
  if (!res) return null;
  return res;
}

export const traverseToTop = (el: HippyNode | null, info: string) => {
  if (!el) return info;
  const isRoot = el.isRootNode();
  if (isRoot) { 
    info += `root::${el.nodeId}`;
    return info;
  };

  info += `${el.nodeId}=>`;
  return traverseToTop(el.parentNode, info);
}

export const layoutToString = (rect: ExposureLayout) => {
  return `{x:${rect.x}, y:${rect.y}, w:${rect.width}, h:${rect.height}}`
}

export const classListInfo = (el: HippyElement) => {
  const cllSet = el.classList;
  const info = Array.from(cllSet).join("-");
  return info;
}

export const allElementKeys = () => {
  const elementMap = getElementMap();
  const result = Array.from(elementMap.keys()).join(",");
  return result;
}