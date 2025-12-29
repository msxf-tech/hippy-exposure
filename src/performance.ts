/*
 * We are pleased to support the open source community by making
 * Hippy Exposure available.
 *
 * Copyright (c) 2015-present 马上消费金融股份有限公司, https://www.msxf.com/
 *
 * Licensed under the MIT LICENSE.
 */


import { ExposureElement, ExposureLayout, VisibleStatus } from "./type";
import { isRectDisjoint, isRectContained } from "./math";
import { getRootElement } from "./collect";

// 是否忽略 element，避免深度递归查询；用于 scroll / list 组件中
export const ignoredDeepTraverseInScroll = (
  element: ExposureElement,
  rectInScroll: ExposureLayout,
  clippedRect: ExposureLayout,
) => {
  
  const curr = element.currentVisibleStatus;

  // 相离且上次不可见，过滤
  const isDisjoint = isRectDisjoint(rectInScroll, clippedRect);
  if (curr === VisibleStatus.invisible && isDisjoint)
    return true;

  // 包含于且上次可见，过滤
  const isContained = isRectContained(rectInScroll, clippedRect);
  if (isContained && curr === VisibleStatus.visible)
    return true;

  // 最终只处理相交的矩形
  return false;
}

/* 是否忽略 element，避免深度递归查询；
 * 用于 （非 scroll / list）组件中元素深度递归时的优化
 */
export const ignoredDeepTraverseInWindow = (
  element: ExposureElement,
): boolean => {
  
  const rootElement = getRootElement();
  // 遇到异常，这里不处理，让下一阶段统一处理
  if (!rootElement) return false;
  const rootRectInWindow = rootElement.rectInWindow;
  if (!rootRectInWindow) return false;
  const rectInWindow = element.rectInWindow;
  if (!rectInWindow) return false;

  const curr = element.currentVisibleStatus;
  
  // 相离且当前不可见，过滤
  const isDisjoint = isRectDisjoint(rectInWindow, rootRectInWindow);
  if (curr === VisibleStatus.invisible && isDisjoint)
    return true;

  // 包含于且当前可见，过滤
  const isContained = isRectContained(rectInWindow, rootRectInWindow);
  if (isContained && curr === VisibleStatus.visible)
    return true;

  // 最终只处理相交的矩形
  return false;
}