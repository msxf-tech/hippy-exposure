/*
 * We are pleased to support the open source community by making
 * Hippy Exposure available.
 *
 * Copyright (c) 2015-present 马上消费金融股份有限公司, https://www.msxf.com/
 *
 * Licensed under the MIT LICENSE.
 */


import { HippyElement } from "@hippy/vue-next"

export const enum VisibleStatus {
  visible = 1,
  invisible = 2,
}

export const enum ListenedEventName {
  layout = 'layout',
  attachedToWindow = 'attachedToWindow',
  detachedFromWindow = 'detachedFromWindow',
  appear = 'appear',
  disAppear = 'disAppear',
  willAppear = 'willAppear',
  willDisappear = 'willDisappear',
  scroll = 'scroll',
  momentumScrollBegin = 'momentumScrollBegin',
  momentumScrollEnd = 'momentumScrollEnd',
  scrollBeginDrag = 'scrollBeginDrag',
  scrollEndDrag = 'scrollEndDrag',

  // swiper 专用
  pageSelected = 'pageSelected'
}

export interface ExposurePoint {
  x: number;
  y: number;
}

export interface ExposureSize {
  width: number;
  height: number;
}

export type Point = ExposurePoint;
export type Size = ExposureSize;
export type ExposureLayout = ExposurePoint & ExposureSize
export type Rect = ExposureLayout;

export interface ExposureScrollParam {
  // 滑动组件相关
  isListView: boolean;
  isListItemView: boolean; // is li
  isScrollView: boolean;
  isInListView: boolean;
  isInScrollView: boolean;
  isPullHeader: boolean;
  
  // 有下拉刷新组件的，需要特殊处理 
  pullHeaderRect?: ExposureLayout;
  contentOffset?: ExposurePoint;
  clippedRect?: ExposureLayout;

  ancestorScrollElement: ExposureElement | null;
}

export interface ExposureSwiperParam {
  isSwiper: boolean; // 如果是 swiper，则一定是 scrollView，swiper 基于 scroll 实现
  currSwiperSelectedIndex: number;
  isSwiperSlide: boolean;
  swiperSlideIndex?: number; // 只有 swiper-slide-item 可用，当前 slide 索引，方便外层根据索引取数据
  isInSwiper: boolean;
}

export interface ExposureAttachedParam {
  // attachedToWindow 相关
  isAttached: boolean;
  // onAttached 次数，listView 存在复用，会反复 attached
  onAttachedCount: number; // onAttached 调用次数
}

export interface ExposureLayoutParam {
  // onLayout 相关
  rectInParent?: ExposureLayout;
  rectInWindow?: ExposureLayout;
  intersectAreaRatioInWindow?: number; // 和 window 相交部分占自身的面积比例
  lastIntersectAreaRatioInWindow?: number; // 和 window 相交部分占自身的面积比例
  onLayoutCount: number; // onlayout 调用次数

  // 相对于 scroll / list 的 rect
  rectInScroll?: ExposureLayout;
  intersectAreaRatioInScroll?: number; // 和 scroll / list 相交部分占自身的面积比例
  lastIntersectAreaRatioInScroll?: number; // 和 scroll / list 相交部分占自身的面积比例
}

export interface ExposureListenerParam {
  // 监听相关
  hadAddLayout: boolean;
  hadAddAttached: boolean;
  hadAddDetached: boolean;
  hadAddAppear: boolean;
  hadAddDisappear: boolean;
  hadAddWillAppear: boolean;
  hadAddWillDisappear: boolean;
  hadAddScroll: boolean;
  hadAddPageSelected: boolean;

  hadAddMomentumScrollBegin: boolean;
  hadAddMomentumScrollEnd: boolean;
  hadAddScrollBeginDrag: boolean;
  hadAddScrollEndDrag: boolean;
}

export interface ExposureStatusParam {
  currentVisibleStatus: VisibleStatus;
  lastVisibleStatus: VisibleStatus;
}

export interface ExposureMeta {
  el: HippyElement;
}

// GC：Element 中移除的时候，可能还被其他(taskQueue)中异步持有
// 所以做个标识
export interface ExposureGarageCollect {
  hadRemove: boolean;
}

export type ExposureElement = 
 & ExposureMeta 
 & ExposureStatusParam
 & ExposureListenerParam
 & ExposureLayoutParam
 & ExposureScrollParam
 & ExposureAttachedParam
 & ExposureGarageCollect
 & ExposureSwiperParam


export type ExposureVisbleCallback = (element: ExposureElement) => void;
export interface ExposureConfig {
  onVisible?: ExposureVisbleCallback;
  onInvisible?: ExposureVisbleCallback;
  isDebug?: boolean; // default false
  checkRatio?: boolean; // default true
}

export interface DirectiveData {
  data: any;
}

export type ExposureStruct = DirectiveData & {
  el: HippyElement;
  enable: boolean;
  exposured: boolean;
}

export type ExposureVisibleCallback = (el: HippyElement, data: any) => void;
export interface ExposurePluginParam {
  // 因为滑动(或者重新布局)引发元素再次可见后，是否重复通知曝光，插件默认给 true
  reNotifyWhenReVisible?: boolean;
  exposureRatioThreshold?: number;
  isDebug?: boolean;
  visibleNotify?: ExposureVisibleCallback;
  invisibleNotify?: ExposureVisibleCallback;
}