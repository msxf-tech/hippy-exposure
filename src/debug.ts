/*
 * We are pleased to support the open source community by making
 * Hippy Exposure available.
 *
 * Copyright (c) 2015-present 马上消费金融股份有限公司, https://www.msxf.com/
 *
 * Licensed under the MIT LICENSE.
 */


import { ExposureElement, ExposureLayout } from './type';
import { 
  HippyLayoutEvent,
  HippyEvent, 
  ViewPagerEvent,
  HippyNode,
  Native, 
  HippyElement,
} from '@hippy/vue-next';
import { 
  traverseToTop, 
  layoutToString, 
  classListInfo,
  allElementKeys,
  isHippyElement,
} from './utils';
import { getIsDebug } from './config';
import {
  logTypeRecord,
  element_phrase,
  layout_phrase,
  attach_phrase,
  measure_phrase,
  visible_phrase,
} from './const';
import { getRootElement } from './collect';

export type TraceType = 
  | 'NATIVE'
  | 'FRONTEND'
  | 'BOTH'

export const trace = (type: TraceType, prefix: string, el: HippyNode, ...rest) => {

  if (!getIsDebug()) return;

  if (type === 'BOTH') {
    Native.ConsoleModule.log(prefix, ...rest);
    colorConsole(prefix, el, ...rest);
    return;
  } else if (type === 'NATIVE') {
    Native.ConsoleModule.log(prefix, ...rest);
  } else {
    colorConsole(prefix, el, ...rest);
  }
}

const colorConsole = (
  prefix: string, 
  el: HippyNode, 
  ...rest) => {

  // const coloredPrefix = logTypeRecord[prefix];
  // if (coloredPrefix) {
  //   console.log(...coloredPrefix, 'el:', el, ';', ...rest);
  // } else {
  //   console.log(prefix, 'el:', el, ';', ...rest);
  // }
}

const recordElementTrace = (el: HippyElement, ...argus) => {
  trace(
    'BOTH',
    element_phrase,
    el,
    ...argus
  )
}

const layoutTrace = (el: HippyElement, ...argus) => {
  trace(
    'BOTH',
    layout_phrase,
    el,
    ...argus
  )
}

export const attchedTrace = (el: HippyElement, ...argus) => {
  trace(
    'BOTH',
    attach_phrase,
    el,
    ...argus
  )
}

export const measureTrace = (el: HippyNode, ...argus) => {
  trace(
    'BOTH',
    measure_phrase,
    el,
    ...argus
  )
}

export const visibleTrace = (el: HippyElement, ...argus) => {
  trace(
    'BOTH',
    visible_phrase,
    el,
    ...argus
  )
}

export const debugLogElementWhenException = (
  el: HippyElement,
  extraInfo: string
) => {

  if (!getIsDebug()) return;

  const isRoot = el.isRootNode();

  let sInfo = 'not hippy element';
  let cls = 'not element'
  if (isHippyElement(el)) {
    sInfo = getSimpleTagInfo(el);
    cls = classListInfo(el);
  }

  recordElementTrace(
    el,
    '[EXCEP]',
    '| isR: ', isRoot,
    '| e: ', sInfo,
    '| cls:', cls,
    extraInfo
  );
}

export const debugLogElementWhenGC = (
  el: HippyElement
) => {

  if (!getIsDebug()) return;

  const isRoot = el.isRootNode();

  let sInfo = 'not hippy element';
  let cls = 'not element'
  if (isHippyElement(el)) {
    sInfo = getSimpleTagInfo(el);
    cls = classListInfo(el);
  }

  recordElementTrace(
    el,
    '[GC]',
    '| isR: ', isRoot,
    '| e: ', sInfo,
    '| cls:', cls,
  );
}

export const debugLogElementWhenGCInTaskQueue = (
  el: HippyElement
) => {

  if (!getIsDebug()) return;

  const isRoot = el.isRootNode();

  let sInfo = 'not hippy element';
  let cls = 'not element'
  if (isHippyElement(el)) {
    sInfo = getSimpleTagInfo(el);
    cls = classListInfo(el);
  }

  recordElementTrace(
    el,
    '[GCTK]',
    '| isR: ', isRoot,
    '| e: ', sInfo,
    '| cls:', cls,
  );
}

export const debugLogCollectElementWhenRecord = (
  el: HippyElement
) => {

  if (!getIsDebug()) return;

  const isRoot = el.isRootNode();

  let sInfo = 'not hippy element';
  let cls = 'not element'
  if (isHippyElement(el)) {
    sInfo = getSimpleTagInfo(el);
    cls = classListInfo(el);
  }

  recordElementTrace(
    el,
    '[RE]',
    '| isR: ', isRoot,
    '| e: ', sInfo,
    '| cls:', cls,
  );
}

export const debugLogForElementCreated = (element: ExposureElement) => {
  const el = element.el;
  const nodeId = el.nodeId;
  const isRoot = element.el.isRootNode();
  const nodeLink = traverseToTop(el, '');
  const cls = classListInfo(el);

  recordElementTrace(
    el,
    '[EC]',
    '| ', nodeId, 
    '| isR:', isRoot, 
    '| cls:', cls, 
    '| tag:', el.tagName,
    '| isSc:', element.isScrollView,
    '| isList:', element.isListView,
    '| isLi:', element.isListItemView,
    '| isInL:', element.isInListView,
    '| isInS:', element.isInScrollView,
    '| ', nodeLink,
  );
}

export const debugLogOnLayout = (
  element: ExposureElement,
  layoutEvent: HippyLayoutEvent
) => {

  if (!getIsDebug()) return;

  const el = element.el;
  const sInfo = getSimpleTagInfo(el);
  const cls = classListInfo(el);
  const onLayoutCount = element.onLayoutCount;
  const elKeys = allElementKeys();
  layoutTrace(
    el,
    '[IOL]',
    '| e: ', sInfo,
    '| cls:', cls,
    '| olc:', onLayoutCount,
    '| layout: ', layoutEvent,
    // '| ', elKeys,
  );
}

export const debugLogForLayoutInParent = (
  element: ExposureElement
) => {

  if (!getIsDebug()) return;

  const el = element.el;
  const nodeId = el.nodeId;
  const isRoot = element.el.isRootNode();
  const nodeLink = traverseToTop(el, '');
  const cls = classListInfo(el);
  const rectP = getRectPInfo(element);

  layoutTrace(
    el,
    '[upInP]',
    '| ', nodeId, 
    // '| isR:', isRoot, 
    '| cls:', cls, 
    '| tag:', el.tagName,
    '| P:', rectP, 
    // '| ', nodeLink,
  );
}

export const debugLogForLayoutInWindowBefore = (
  element: ExposureElement
) => {

  if (!getIsDebug()) return;

  const el = element.el;
  const nodeId = el.nodeId;
  const isRoot = element.el.isRootNode();
  const nodeLink = traverseToTop(el, '');
  const cls = classListInfo(el);
  const rectP = getRectPInfo(element);
  const rectW = getRectWInfo(element);

  layoutTrace(
    el,
    '[upInWB]',
    '| ', nodeId, 
    // '| isR:', isRoot, 
    '| cls:', cls, 
    '| tag:', el.tagName,
    '| W:', rectW, 
    '| nodeLink', nodeLink,
    // '| el: ', el,
  );
}

export const debugLogForLayoutInWindow = (
  element: ExposureElement
) => {

  if (!getIsDebug()) return;

  const el = element.el;
  const nodeId = el.nodeId;
  const isRoot = element.el.isRootNode();
  const nodeLink = traverseToTop(el, '');
  const cls = classListInfo(el);
  const rectP = getRectPInfo(element);
  const rectW = getRectWInfo(element);

  layoutTrace(
    el,
    '[upInW]',
    '| ', nodeId, 
    // '| isR:', isRoot, 
    '| cls:', cls, 
    '| tag:', el.tagName,
    '| W:', rectW, 
    // '| nodeLink', nodeLink,
    // '| el: ', el,
  );
}

export const debugLogForScrollContentSize = (
  element: ExposureElement,
  clipped: ExposureLayout
) => {

  if (!getIsDebug()) return;

  const el = element.el;
  const nodeId = el.nodeId;
  const isRoot = el.isRootNode();
  const nodeLink = traverseToTop(el, '');
  const clippedInfo = convertRectToString(clipped);
  const cls = classListInfo(el);
  const rectW = getRectWInfo(element);
  const rectS = getRectSInfo(element);

  layoutTrace(
    el,
    '[upSCInO]',
    '| ', nodeId, 
    // '| isR:', isRoot, 
    '| cls:', cls, 
    '| tag:', el.tagName,
    '| sTag:', getAncestorScrollInfo(element),
    '| MC:', clippedInfo,
    // '| W:', rectW, 
    // '| ', nodeLink,
    // '| el: ', el,
  );
}

export const debugLogForLayoutInScroll = (
  element: ExposureElement
) => {

  if (!getIsDebug()) return;

  const el = element.el;
  const nodeId = el.nodeId;
  const isRoot = el.isRootNode();
  const nodeLink = traverseToTop(el, '');
  const cls = classListInfo(el);
  const rectW = getRectWInfo(element);
  const rectS = getRectSInfo(element);

  layoutTrace(
    el,
    '[upInS]',
    '| ', nodeId, 
    // '| isR:', isRoot, 
    '| cls:', cls, 
    '| tag:', el.tagName,
    '| sTag:', getAncestorScrollInfo(element),
    '| S:', rectS,
    // '| W:', rectW, 
    // '| ', nodeLink,
    // '| el: ', el,
  );
}

export const debugLogAfterLayout = (
  element:ExposureElement, 
  event: HippyLayoutEvent
) => {

  if (!getIsDebug()) return;

  const el = element.el;
  const nodeId = el.nodeId;
  const isRoot = element.el.isRootNode();
  const nodeLink = traverseToTop(el, '');
  const cls = classListInfo(el);
  const rectP = getRectPInfo(element);
  const rectW = getRectWInfo(element);
  const rectS = getRectSInfo(element);

  layoutTrace(
    el,
    '[AOL]',
    '| ', nodeId, 
    '| isR:', isRoot, 
    '| cls:', cls, 
    '| tag:', el.tagName,
    '| P:', rectP, 
    '| W:', rectW, 
    '| S:', rectS, 
    '| ', nodeLink,
    // '| el: ', el,
  );
  layoutTrace(
    el,
    '[AOL-R]',
    '| ', nodeId, 
    // '| isR:', isRoot, 
    // '| cls:', cls, 
    '| tag:', el.tagName,
    '| P:', rectP, 
    '| W:', rectW, 
    '| S:', rectS, 
    // '| ', nodeLink,
    // '| el: ', el,
  );
}

export const debugLogOnAttaced = (
  element:ExposureElement, 
  event: HippyEvent
) => {

  if (!getIsDebug()) return;

  const el = element.el;
  const nodeId = el.nodeId;
  const sInfo = getSimpleTagInfo(el);
  const isRoot = element.el.isRootNode();
  const nodeLink = traverseToTop(el, '');
  const cls = classListInfo(el);
  const rectP = getRectPInfo(element);
  const rectW = getRectWInfo(element);
  const rectS = getRectSInfo(element);

  attchedTrace(
    el,
    '[IAT]',
    // '| ', nodeId, 
    '| e: ', sInfo,
    // '| isR:', isRoot, 
    '| cls:', cls, 
    // '| tag:', el.tagName,
    '| isLi:', element.isListItemView,
    '| isInL:', element.isInListView,
    '| isInS:', element.isInScrollView,
    '| P:', rectP, 
    '| W:', rectW, 
    '| S:', rectS, 
    // '| ', nodeLink,
    // '| el: ', el,
  );
}

export const debugLogOnDetached = (
  element:ExposureElement, 
  event: HippyEvent
) => {

  if (!getIsDebug()) return;

  const el = element.el;
  const nodeId = el.nodeId;
  const isRoot = element.el.isRootNode();
  const nodeLink = traverseToTop(el, '');
  const cls = classListInfo(el);
  const rectP = getRectPInfo(element);
  const rectW = getRectWInfo(element);
  const rectS = getRectSInfo(element);
  const allKeys = allElementKeys();

  attchedTrace(
    el,
    '[IDT]',
    '| ', nodeId, 
    // '| isR:', isRoot, 
    '| cls:', cls, 
    '| tag:', el.tagName,
    '| all-mk:', allKeys,
    // '| P:', rectP, 
    // '| W:', rectW, 
    // '| S:', rectS, 
    '| ', nodeLink,
    // '| el: ', el,
  );
}

export const debugLogAfterDetached = (
  element:ExposureElement, 
  event: HippyEvent
) => {

  if (!getIsDebug()) return;

  const el = element.el;
  const nodeId = el.nodeId;
  const isRoot = element.el.isRootNode();
  const nodeLink = traverseToTop(el, '');
  const cls = classListInfo(el);
  const rectP = getRectPInfo(element);
  const rectW = getRectWInfo(element);
  const rectS = getRectSInfo(element);
  const allKeys = allElementKeys();

  attchedTrace(
    el,
    '[ADT]',
    '| ', nodeId, 
    // '| isR:', isRoot, 
    '| cls:', cls, 
    '| tag:', el.tagName,
    '| all-mk:', allKeys,
    // '| P:', rectP, 
    // '| W:', rectW, 
    // '| S:', rectS, 
    '| ', nodeLink,
    // '| el: ', el,
  );
}

export const debugLogOnNormalMeasureStart= (
  element:ExposureElement,
) => {
  if (!getIsDebug()) return;

  const el = element.el;
  const rInW = element.rectInWindow;
  const nodeId = el.nodeId;
  const isRoot = element.el.isRootNode();
  const nodeLink = traverseToTop(el, '');
  const cls = classListInfo(el);
  const rectW = getRectWInfo(element);
  const lastRatio = element.lastIntersectAreaRatioInWindow;
  const ratio = element.intersectAreaRatioInWindow;
  const lastVs = element.lastVisibleStatus;
  const currVs = element.currentVisibleStatus;

  measureTrace(
    el,
    '[MNS]',
    '| ', nodeId,
    '| tag:', el.tagName,
    // '| isR:', isRoot, 
    '| cls:', cls, 
    '| W:', rectW,
    // '| rW:', rootRect,
    '| isLi:', element.isListItemView,
    '| isInL:', element.isInListView,
    '| isInS:', element.isInScrollView,
    '| lrt:', lastRatio,
    '| rt:', ratio,
    '| lvs:', lastVs,
    '| vs:', currVs,
  );
}

export const debugLogOnNormalMeasureBeforeVisible = (
  element:ExposureElement,
  rootRectInWindow: ExposureLayout,
) => {
  if (!getIsDebug()) return;

  const el = element.el;
  const rInW = element.rectInWindow;
  const nodeId = el.nodeId;
  const isRoot = element.el.isRootNode();
  const nodeLink = traverseToTop(el, '');
  const cls = classListInfo(el);
  const rectW = getRectWInfo(element);
  const rootRect = convertRectToString(rootRectInWindow);
  const lastRatio = element.lastIntersectAreaRatioInWindow;
  const ratio = element.intersectAreaRatioInWindow;
  const lastVs = element.lastVisibleStatus;
  const currVs = element.currentVisibleStatus;

  measureTrace(
    el,
    '[MNBV]',
    '| ', nodeId,
    '| tag:', el.tagName,
    // '| isR:', isRoot, 
    // '| cls:', cls, 
    // '| W:', rectW,
    // '| rW:', rootRect,
    '| lrt:', lastRatio,
    '| rt:', ratio,
    '| lvs:', lastVs,
    '| vs:', currVs,
  );
}

export const debugLogMeasureOnLayoutUpdate = (
  element:ExposureElement,
) => {
  if (!getIsDebug()) return;

  const rootElement = getRootElement();
  const rootRectInWindow = rootElement?.rectInWindow;
  const rootRect = convertRectToString(rootRectInWindow);

  const {
    el, nodeId, tag, cls, rectW, rectS,
    ratio, lastRatio, lastVs, currVs, ancestorScroll
  } = logParams(element);

  measureTrace(
    el,
    '[MLU]',
    '| ', nodeId,
    '| tag:', el.tagName,
    // '| isR:', isRoot, 
    // '| cls:', cls, 
    // '| W:', rectW,
    // '| rW:', rootRect,
    '| lrt:', lastRatio,
    '| rt:', ratio,
    '| lvs:', lastVs,
    '| vs:', currVs,
  );
}

export const debugLogForListScrolling = (
  element:ExposureElement,
  clippedRect: ExposureLayout,
) => {
  if (!getIsDebug()) return;

  const clipped = convertRectToString(clippedRect);
  const {
    el, nodeId, tag, cls, rectW, rectS,
    ratioInS, lastRatioInS, lastVs, currVs, ancestorScroll
  } = logParams(element);

  measureTrace(
    el,
    '[CLINLS]',
    '| ', nodeId,
    '| tag:', el.tagName,
    // '| isR:', isRoot, 
    '| cls:', cls, 
    // '| W:', rectW,
    '| clippedR:', clipped,
    // '| lrt:', lastRatio,
    // '| rt:', ratio,
    // '| lvs:', lastVs,
    // '| vs:', currVs,
  );
}

export const debugLogForScrollScrolling = (
  element:ExposureElement,
  clippedRect: ExposureLayout,
) => {
  if (!getIsDebug()) return;

  const clipped = convertRectToString(clippedRect);
  const {
    el, nodeId, tag, cls, rectW, rectS,
    ratioInS, lastRatioInS, lastVs, currVs, ancestorScroll
  } = logParams(element);

  measureTrace(
    el,
    '[CLINSS]',
    '| ', nodeId,
    '| tag:', tag,
    // '| isR:', isRoot, 
    '| cls:', cls, 
    // '| W:', rectW,
    '| clippedR:', clipped,
    '| rectS:', rectS,
    '| an_s:', ancestorScroll
    // '| lrt:', lastRatio,
    // '| rt:', ratio,
    // '| lvs:', lastVs,
    // '| vs:', currVs,
  );
}

export const debugLogForSwiperPaging = (
  element:ExposureElement,
  event: ViewPagerEvent,
) => {
  if (!getIsDebug()) return;

  const viewPager = convertViewPagerEvent(event);
  const {
    el, nodeId, tag, cls, rectW, rectS,
    ratioInS, lastRatioInS, lastVs, currVs, ancestorScroll
  } = logParams(element);

  measureTrace(
    el,
    '[SWPager]',
    '| ', nodeId,
    '| tag:', tag,
    // '| isR:', isRoot, 
    '| cls:', cls, 
    // '| W:', rectW,
    '| pageSed:', viewPager,
    '| rectS:', rectS,
    '| an_s:', ancestorScroll
    // '| lrt:', lastRatio,
    // '| rt:', ratio,
    // '| lvs:', lastVs,
    // '| vs:', currVs,
  );
}

export const debugLogForListItemsMeasureWhenListScroll = (
  element:ExposureElement,
  clippedRect: ExposureLayout,
) => {
  if (!getIsDebug()) return;

  const clipped = convertRectToString(clippedRect);

  const {
    el, nodeId, tag, cls, rectW, rectS, rectP,
    ratioInS, lastRatioInS, lastVs, currVs
  } = logParams(element);

  measureTrace(
    el,
    '[MLIILS]',
    '| ', nodeId,
    '| tag:', el.tagName,
    // '| isR:', isRoot, 
    '| cls:', cls, 
    '| P:', rectP,
    '| W:', rectW,
    '| IS:', rectS,
    '| clippedR:', clipped,
    // '| lrtInL:', lastRatioInS,
    // '| rtInL:', ratioInS,
    // '| lvs:', lastVs,
    // '| vs:', currVs,
  );
}

export const debugLogForScrollItemsMeasureWhenScroll = (
  element:ExposureElement,
  clippedRect: ExposureLayout,
) => {
  if (!getIsDebug()) return;

  const el = element.el;
  const rInW = element.rectInWindow;
  const nodeId = el.nodeId;
  const isRoot = element.el.isRootNode();
  const nodeLink = traverseToTop(el, '');
  const cls = classListInfo(el);
  const rectW = getRectWInfo(element);
  const clipped = convertRectToString(clippedRect);
  const lastRatio = element.lastIntersectAreaRatioInWindow;
  const ratio = element.intersectAreaRatioInWindow;
  const lastVs = element.lastVisibleStatus;
  const currVs = element.currentVisibleStatus;

  measureTrace(
    el,
    '[MLIIS]',
    '| ', nodeId,
    '| tag:', el.tagName,
    // '| isR:', isRoot, 
    '| cls:', cls, 
    // '| W:', rectW,
    // '| clippedR:', clipped,
    // '| lrt:', lastRatio,
    // '| rt:', ratio,
    // '| lvs:', lastVs,
    // '| vs:', currVs,
  );
}

export const debugLogForHippyNodeType = (
  node: HippyNode,
) => {
  if (!getIsDebug()) return;

  const nodeId = node.nodeId;
  if(isHippyElement(node) === false) {
    measureTrace(
      node,
      '[MIForEache]',
      '| ', nodeId,
      '| This is HippyNode'
    );
    return;
  }

  const el = node as HippyElement;
  const isRoot = el.isRootNode();
  const tag = el.tagName;
  const nodeLink = traverseToTop(el, '');
  const cls = classListInfo(el);

  measureTrace(
    el,
    '[MIForEache]',
    '| ', nodeId,
    '| tag:', tag,
    '| cls:', cls, 
    '| ', nodeLink, 
  );
}

export const debugLogOnScrollItemsMeasure = (
  element:ExposureElement,
  clippedRect: ExposureLayout,
) => {
  if (!getIsDebug()) return;

  const clipped = convertRectToString(clippedRect);
  const {
    el, nodeId, tag, cls, rectW, rectS,
    ratioInS, lastRatioInS, lastVs, currVs
  } = logParams(element);

  measureTrace(
    el,
    '[MISBV]',
    '| ', nodeId,
    '| tag:', tag,
    // '| isR:', isRoot, 
    '| cls:', cls, 
    '| W:', rectW,
    '| S:', rectS,
    '| clippedR:', clipped,
    '| lrtInS:', lastRatioInS,
    '| rtInS:', ratioInS,
    '| lvs:', lastVs,
    '| vs:', currVs,
  );
}

export const debugLogOnListItemsMeasure = (
  element:ExposureElement,
  clippedRect: ExposureLayout,
) => {
  if (!getIsDebug()) return;

  const {
    el, nodeId, tag, cls, lastRatioInS, ratioInS,
    ratio, lastRatio, lastVs, currVs
  } = logParams(element);

  measureTrace(
    el,
    '[MILBV]',
    '| ', nodeId,
    '| tag:', el.tagName,
    // '| isR:', isRoot, 
    // '| cls:', cls, 
    // '| W:', rectW,
    // '| clippedR:', clipped,
    '| lrt:', lastRatio,
    '| rt:', ratio,
    '| lvs:', lastVs,
    '| vs:', currVs,
  );
}

export const debugLogOnReportVisible = (
  element:ExposureElement,
) => {
  if (!getIsDebug()) return;
  _debugLogForReportVisible(element, '[RV]');
}

export const debugLogOnReportInvisible = (
  element:ExposureElement,
) => {
  if (!getIsDebug()) return;
  _debugLogForReportVisible(element, '[RIV]');
}

const _debugLogForReportVisible = (
  element:ExposureElement,
  vis: string,
) => {
  if (!getIsDebug()) return;

  const {
    el, nodeId, tag, cls, lastRatioInS, ratioInS,
    ratio, lastRatio, lastVs, currVs
  } = logParams(element);

  visibleTrace(
    el,
    vis,
    '| ', nodeId,
    '| tag:', tag,
    // '| isInS:', isInS,
    // '| isR:', isRoot, 
    '| cls:', cls, 
    // '| W:', rectW,
    '| lrtInS:', lastRatioInS,
    '| rtInS:', ratioInS,
    '| lrt:', lastRatio,
    '| rt:', ratio,
    '| lvs:', lastVs,
    '| vs:', currVs,
  );
}

const logParams = (element:ExposureElement) => {

  const el = element.el;
  const nodeId = el.nodeId;
  const tag = el.tagName;
  const isRoot = element.el.isRootNode();
  const nodeLink = traverseToTop(el, '');
  const cls = classListInfo(el);
  const rectP = getRectPInfo(element);
  const rectW = getRectWInfo(element);
  const rectS = getRectSInfo(element);
  const lastRatio = element.lastIntersectAreaRatioInWindow;
  const ratio = element.intersectAreaRatioInWindow;
  const lastRatioInS = element.lastIntersectAreaRatioInScroll;
  const ratioInS = element.intersectAreaRatioInScroll;
  const lastVs = element.lastVisibleStatus;
  const currVs = element.currentVisibleStatus;
  const ancestorScroll = getAncestorScrollInfo(element);
  const isList = element.isListView;
  const isListItem = element.isListItemView;
  const isScroll = element.isScrollView;
  const isInL = element.isInListView;
  const isInS = element.isInScrollView;

  return {
    el,
    nodeId,
    tag,
    isRoot,
    nodeLink,
    cls,
    rectP,
    rectW,
    rectS,
    lastRatio,
    ratio,
    lastRatioInS,
    ratioInS,
    lastVs,
    currVs,
    ancestorScroll,
    isList,
    isListItem,
    isScroll,
    isInL,
    isInS,
  }
}

const getRectPInfo = (element: ExposureElement) => {
  return convertRectToString(element.rectInParent);
}

const getRectWInfo = (element: ExposureElement) => {
  return convertRectToString(element.rectInWindow);
}

const getRectSInfo = (element: ExposureElement) => {
  return convertRectToString(element.rectInScroll);
}

const convertRectToString = (rect: ExposureLayout | undefined | null) => {
  let rectW = 'undefined';
  if (rect) {
    rectW = layoutToString(rect)
  }
  return rectW;
}

const convertViewPagerEvent = (event: ViewPagerEvent) => {
  let s = 'undefined';
  if (event) {
    s = `currSlide: ${event.currentSlide}, nextSlide: ${event.nextSlide}, state: ${event.state}, offset: ${event.offset}`;
  }
  return s;
}

const getAncestorScrollInfo = (element: ExposureElement) => {
  let rectS = 'undefined';
  if (element.ancestorScrollElement) {
    const aElement = element.ancestorScrollElement;
    rectS = getSimpleTagInfo(aElement.el);
  }
  return rectS;
}

const getSimpleTagInfo = (el: HippyElement) => {
  return `${ el.tagName } - ${ el.nodeId }`
}

