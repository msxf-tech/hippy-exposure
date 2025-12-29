/*
 * We are pleased to support the open source community by making
 * Hippy Exposure available.
 *
 * Copyright (c) 2015-present 马上消费金融股份有限公司, https://www.msxf.com/
 *
 * Licensed under the MIT LICENSE.
 */


import { 
    ExposureElement, 
    VisibleStatus,
    ExposureVisbleCallback,
} from "./type";
import {
    debugLogOnReportVisible,
    debugLogOnReportInvisible
} from './debug';

const RatioTolerance = 0.001;
let _exposureRatio: number = 0;
let _visibleCb: ExposureVisbleCallback | undefined = undefined;
let _inVisibleCb: ExposureVisbleCallback | undefined = undefined;
let _needCheckRatio = true;

export const setNeedCheckRatio = (checkRatio: boolean) => {
  _needCheckRatio = checkRatio;
}

export const setVisibleCallback = (cb: ExposureVisbleCallback | undefined) => {
  _visibleCb = cb;
}

export const setInvisibleCallback = (cb: ExposureVisbleCallback | undefined) => {
  _inVisibleCb = cb;
}

export const setExposureRatio = (ratio: number) => {
  _exposureRatio = ratio;
}

export const visibleNotify = (element: ExposureElement) => {
  debugLogOnReportVisible(element);

  if (_visibleCb) _visibleCb(element);
}

export const invisibleNotify = (element: ExposureElement) => {
  debugLogOnReportInvisible(element);

  if (_inVisibleCb) _inVisibleCb(element);
}

export const pollForNewcomeVisibleStatus = (
  element: ExposureElement,
  lastRatio: number | undefined,
  ratio: number,
) => {
  // 对于新到来的可见状态，判断是否需要通知外部
  const curr = element.currentVisibleStatus;
  if (curr !== VisibleStatus.visible) {
    element.lastVisibleStatus = curr;
    element.currentVisibleStatus = VisibleStatus.visible;
    visibleNotify(element);
  } else if (lastRatio && _needCheckRatio) {
    if (ratio - lastRatio > RatioTolerance) {
      element.lastVisibleStatus = curr;
      element.currentVisibleStatus = VisibleStatus.visible;
      visibleNotify(element);
    }
  } else {
    element.lastVisibleStatus = curr;
    element.currentVisibleStatus = VisibleStatus.visible;
  }
}

export const pollForNewcomeInvisibleStatus = (element: ExposureElement) => {
    // 对于新到来的不可见状态，判断是否需要通知外部
  const curr = element.currentVisibleStatus;
  if (curr === VisibleStatus.visible) {
    element.lastVisibleStatus = curr;
    element.currentVisibleStatus = VisibleStatus.invisible;
    invisibleNotify(element);
  } else {
    element.lastVisibleStatus = curr;
    element.currentVisibleStatus = VisibleStatus.invisible;
  }
}