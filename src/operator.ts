/*
 * We are pleased to support the open source community by making
 * Hippy Exposure available.
 *
 * Copyright (c) 2015-present 马上消费金融股份有限公司, https://www.msxf.com/
 *
 * Licensed under the MIT LICENSE.
 */


import { Rect, ExposureElement } from './type'
import { getParentExposureElement } from './utils';

type EmptyValue = undefined | null; 

/* 算子: 副作用推迟，真正需要计算的时候，迭代函数联进行计算 */
interface Operator {
  rect: Rect | EmptyValue;
  polyfill: () => Promise<Rect> | EmptyValue;
  superOperator: Operator | EmptyValue;
}

const operate = (
  element: ExposureElement,
  superRectInWindow: Rect | EmptyValue, 
  selfInParent: Rect
) => {
  const p = getParentExposureElement(element.el);
  const pRectInWindow = p?.rectInWindow;
}