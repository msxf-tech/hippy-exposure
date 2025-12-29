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
  _setBeforeRenderToNative
} from '@hippy/vue-next';
import taskQueue from './task';
import { 
  ExposureStruct,
  ExposureVisibleCallback,
  ExposurePluginParam,
  ExposureConfig, 
  ExposureElement 
} from './type';
import { 
  isHippyElement, 
  isCommentElement, 
  getElement,
  isElementVisible
} from './utils';
import { recordElement } from './collect';
import { setExposureOptions } from './config';
import { addListener } from './listener';

const exposureMap: Map<number, ExposureStruct> = new Map();

let _isPageShow = false;
// 因为滑动(或者重新布局)引发元素再次可见后，是否重复通知曝光，插件默认给 true
let _reNotifyWhenReVisible = true;
// 可见比例门限值为多少时进行曝光
let _exposureRatioThreshold = 0.0;
let _isDebug = false;
let _visibleNotify: ExposureVisibleCallback | undefined = undefined;
let _invisibleNotify: ExposureVisibleCallback | undefined = undefined;
type VueAppType = any;

export interface SwiperExposureEvent {
  $swiperSlide: HippyElement;
  isVisible: boolean;
  index: number;
}

export type ExposurePluginFunction = (app: VueAppType) => void;

export const _setPageShowStatus = (isShow: boolean) => {
  _isPageShow = isShow;
}

export const _getPageShowStatus = (): boolean => {
  return _isPageShow;
}

// 非严格可见性静态查询
export const _queryElementVisible = (nodeId: number) => {
  if (_isPageShow === false) return false;
  if (taskQueue.isReady() === false) return false;
  return isElementVisible(nodeId);
}

// 可见性静态检查，主动检查
// 检查可见性，还有露出比例
const visibleStaticCheck = (nodeId: number) : boolean => {
  if (_isPageShow === false) return false;
  if (taskQueue.isReady() === false) return false;
  if (isElementVisible(nodeId) === false) return false;

  const element = getElement(nodeId);
  if (!element) return false;

  let ratio = 0.0;
  if (element.isInListView || element.isInScrollView) {
    ratio = element.intersectAreaRatioInScroll ?? 0.0;
  } else {
    ratio = element.intersectAreaRatioInWindow ?? 0.0;
  }

  return (ratio >= _exposureRatioThreshold);
}

const _tryToVisibleNotify = (es: ExposureStruct) => {
  if (_visibleNotify === undefined) return;
  
  if (visibleStaticCheck(es.el.nodeId) === false) return;
  if (es.exposured === true) return; // 默认已经曝光后，不会重复曝光
  if (!es.el) return;
  if (es.enable === false) return;
  if (es.data === undefined || es.data === null) return;

  _visibleNotify(es.el, es.data);
  es.exposured = true;
}

const _tryToInvisibleNotify = (es: ExposureStruct) => {

  if (_reNotifyWhenReVisible) {
    // 设置为 false，下次可见后，可以触发重新曝光
    // 提前重置 exposured 防止 _invisibleNotify 为 undefined，漏掉 exposured 重置
    es.exposured = false;
  }

  // !IMPORTANT: 不可见通知，不检查 pageshow，可能存在后台刷新，导致的布局变化
  // if (_isPageShow === false) return false;

  if (_invisibleNotify === undefined) return;
  if (taskQueue.isReady() === false) return;
  if (!es.el) return;

  // 不可见通知，不检查 data 数据是否有值
  _invisibleNotify(es.el, es.data);
}

// 强制检查曝光，不考虑是否 exposured，但默认会检查 enable，可设置不检查 enable
export const _forceExposureForAllElement = (checkEnable: boolean = true) => {
  if (_visibleNotify === undefined) return;
  if (taskQueue.isReady() === false) return;

  for (const [nodeId, es] of exposureMap) {
    if (visibleStaticCheck(nodeId) === false) continue;
    if (es.data === undefined || es.data === null) continue;
    if (checkEnable && es.enable === false) continue;
    _visibleNotify(es.el, es.data);
  }
}

// 强制检查曝光，不考虑是否 exposured，但默认会检查 enable，可设置不检查 enable
// element 参数可以是 elementId 或者 ExposureStruct
export const _forceExposureForElement = (
  element: number | ExposureStruct, 
  checkEnable: boolean = true
) => {
  if (_visibleNotify === undefined) return;
  if (taskQueue.isReady() === false) return;

  let es: undefined | ExposureStruct = undefined;
  if (typeof element === 'number') {
    es = exposureMap.get(element);
  } else {
    es = element;
  }

  if (!es || !es.el || !es.data) return;
  if (checkEnable && es.enable === false) return;
  if (visibleStaticCheck(es.el.nodeId) === false) return;

  _visibleNotify(es.el, es.data);
}

export const _setInvalid = (
  el: HippyElement, 
  needDeepTraverse: boolean = false
) => {
  const es = exposureMap.get(el.nodeId);
  if (!es) return;
  
  es.exposured = false;

  if (needDeepTraverse) {
    el.childNodes.forEach((item) => {
      if (isCommentElement(item)) return;
      if (isHippyElement(item) === false) return;
      _setInvalid(item as HippyElement, needDeepTraverse);
    })
  }
}

export const _trigger = (
  el: HippyElement, 
  needDeepTraverse: boolean = false
) => {
  const es = exposureMap.get(el.nodeId);
  if (!es) return;

  const element = getElement(el.nodeId);
  if (!element) return;

  // 曝光上报
  _tryToVisibleNotify(es);

  if (needDeepTraverse) {
    el.childNodes.forEach((item) => {
      if (isCommentElement(item)) return;
      if (isHippyElement(item) === false) return;
      _trigger(item as HippyElement, needDeepTraverse);
    })
  }
}

export const _createExposurePlugin = (
  options: ExposurePluginParam
): ExposurePluginFunction => {
  const {
    reNotifyWhenReVisible = true,
    exposureRatioThreshold = 0.0,
    isDebug = false,
    visibleNotify = undefined,
    invisibleNotify = undefined,
  } = options;
  _reNotifyWhenReVisible = reNotifyWhenReVisible;
  _exposureRatioThreshold = exposureRatioThreshold;
  _isDebug = isDebug;
  _visibleNotify = visibleNotify;
  _invisibleNotify = invisibleNotify;

  return exposurePluginFunction;
}

function exposurePluginFunction(app: VueAppType) {

  // app.config.globalProperties.$myTest = (input) => {
  //   return input;
  // }

  app.directive('hippy-exposure', {
    created(el, binding, vnode) {
      onDirectiveCreate(el, binding, vnode);
    },
    mounted(el, binding, vnode) {
      onDirectiveMounted(el, binding, vnode);
    },
    updated(el, binding, vnode) {
      onDirectiveUpdate(el, binding, vnode);
    },
    unmounted(el, binding, vnode) {
      onDirectiveUnmounted(el, binding, vnode);
    },
  });
  
  runExposure();
}

const runExposure = () => {
  const config: ExposureConfig = {
    isDebug: _isDebug,
    onVisible: onVisible,
    onInvisible: onInvisible,
    checkRatio: true,
  }
  setExposureOptions(config);

  _setBeforeRenderToNative((el: HippyElement, style) => {
    customRenderToNativeEvent(el);
    recordElement(el, style);
    addListener(el, style);
  }, 1);
}

const customRenderToNativeEvent = (el: HippyElement) => {
  // ref 无法精确获取 element，实现一个自定义事件稳定获取 element
  const eventList = el.getEventListenerList();
  const renderToNativeEvents = eventList.renderToNative;
  if (renderToNativeEvents) {
    renderToNativeEvents.forEach((vis) => vis.callback(el));
  }
}

const callHippyVisibleEvent = (element: ExposureElement) => {
  const eventList = element.el.getEventListenerList();
  const visibleEvents = eventList.hippyVisible;
  if (visibleEvents) {
    const data = {
      el: element.el,
      ratioInClipped: element.intersectAreaRatioInScroll ?? 0.0,
      ratioInWindow: element.intersectAreaRatioInWindow ?? 0.0,
    }
    visibleEvents.forEach((vis) => vis.callback(data));
  }
  
  callSwiperVisibleSlideChangedEvent(element, true);
}

const callHippyInvisibleEvent = (element: ExposureElement) => {
  const eventList = element.el.getEventListenerList();
  const invisibleEvents = eventList.hippyInvisible;
  if (invisibleEvents) {
    const data = {
      el: element.el,
      ratioInClipped: element.intersectAreaRatioInScroll ?? 0.0,
      ratioInWindow: element.intersectAreaRatioInWindow ?? 0.0,
    }
    invisibleEvents.forEach((ivis) => ivis.callback(data));
  }

  callSwiperVisibleSlideChangedEvent(element, false);
}

const callSwiperVisibleSlideChangedEvent = (
  element: ExposureElement, 
  isVisible: boolean,
) => {

  // 针对 swiper-slide 的可见通知，做特殊事件回调，方便做曝光处理
  if (element.isSwiperSlide === false) return;
  const swiperElement = element.ancestorScrollElement;
  if (!swiperElement) return;
  if (swiperElement.isSwiper === false) return;

  const idx = element.swiperSlideIndex;
  if (idx === undefined) return;

  const eventList = swiperElement.el.getEventListenerList();
  if (isVisible) {
    const swiperVisibleChangedLists = eventList.swiperVisibleChanged;
    if (swiperVisibleChangedLists) {
      const data: SwiperExposureEvent = {
        $swiperSlide: element.el,
        isVisible: true,
        index: idx
      }
      // console.log('visible----> swiper:', swiperElement.el.nodeId, '; ele:', swiperElement.el);
      swiperVisibleChangedLists.forEach((vis) => vis.callback(data));
    }
  } else {
    const swiperInvisibleChangedLists = eventList.swiperInvisibleChanged;
    if (swiperInvisibleChangedLists) {
      const data: SwiperExposureEvent = {
        $swiperSlide: element.el,
        isVisible: false,
        index: idx
      }
      swiperInvisibleChangedLists.forEach((vis) => vis.callback(data));
    }
  }
  
}

const onVisible = (element: ExposureElement) => {
  if (_isPageShow === false) return;

  // 回调元素的 onHippyVisible 事件
  callHippyVisibleEvent(element);
  const es: ExposureStruct | undefined = exposureMap.get(element.el.nodeId);
  if (es) {
    _tryToVisibleNotify(es);
  }
}

const onInvisible = (element: ExposureElement) => {
  // !IMPORTANT: 不可见通知，不检查 pageshow，可能存在后台刷新，导致的布局变化
  // if (_isPageShow === false) return;

  // 回调元素的 onHippyInvisible 事件
  callHippyInvisibleEvent(element);
  
  const es: ExposureStruct | undefined = exposureMap.get(element.el.nodeId);
  if (es) {
    _tryToInvisibleNotify(es);
  }
}

const debugLog = (element: ExposureElement) => {
  const eleRect = {
    layoutCount: element.onLayoutCount,
    rInParent: element.rectInParent,
    rInScroll: element.rectInScroll,
    rInWindow: element.rectInWindow,
  }

  const ancestorEleRect = {
    rInParent: element.ancestorScrollElement?.rectInParent,
    rInScroll: element.ancestorScrollElement?.rectInScroll,
    rInWindow: element.ancestorScrollElement?.rectInWindow,
  }
  // console.log(
  //   'notify:onVisible:', element.el.nodeId, 
  //   '; tagName:', element.el.tagName, 
  //   '; ele:', eleRect,
  //   '; ancestore:', ancestorEleRect
  // );
}

/* 1：支持 arg 为 bool:
 * v-hippy-exposure:[enable]="data"
 * enable 为 boolean 类型
 * 
 * 2：支持对象类型，其中包含 enable，方便以后扩展
 * v-hippy-exposure:[obj]="data"
 * obj: { enable: boolean, ... }
 * 
 * 3: 其他情况，都不解析，直接返回 true，即默认上报数据
 */
const isEnableFromArg = (arg: unknown) => {
  if (arg === undefined || arg === null) return true;
  if (typeof arg === 'boolean') return arg;

  if ((typeof arg === 'object') && ('enable' in arg)) {
    return Boolean((arg as any).enable);
  }

  // 其他情况均不支持，返回 true
  return true;
}

const onDirectiveCreate = (el, binding, vnode) => {
  let enable = true;
  enable = isEnableFromArg(binding.arg);
  const data = binding.value;
  if (exposureMap.has(el.nodeId) === false) {
    const struct: ExposureStruct = {
      el: el,
      data: data,
      enable: enable,
      exposured: false,
    }
    exposureMap.set(el.nodeId, struct);
  }
}

const onDirectiveUpdate = (el, binding, vnode) => {
  if (exposureMap.has(el.nodeId)) {
    const struct: ExposureStruct | undefined = exposureMap.get(el.nodeId);
    if (struct) {
      const enable = isEnableFromArg(binding.arg);

      let forceCheck = false;
      if (enable === true && struct.enable === false) {
        forceCheck = true;
      }

      struct.enable = enable;
      struct.data = binding.value;
      
      if (forceCheck) {
        // enable 生效，强制检查曝光，不考虑上次是否 exposured
        _forceExposureForElement(struct);
      } else {
        // 数据变化 (通常是 空 --> 有值)，正常发起检查曝光，内部会考虑上次是否 exposured
        _tryToVisibleNotify(struct);
      }
    }
  }
}

const onDirectiveMounted = (el, binding, vnode) => { 
  // console.log(
  //   'dd-exposure::m:el:', el, 
  //   '; nid:', el.nodeId , 
  //   '; binding:', binding, 
  //   '; vnode:', vnode);
}

const onDirectiveUnmounted = (el, binding, vnode) => { 
  exposureMap.delete(el.nodeId);
  // console.log(
  //   'dd-exposure::m:el:', el, 
  //   '; nid:', el.nodeId , 
  //   '; binding:', binding, 
  //   '; vnode:', vnode);
}