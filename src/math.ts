/*
 * We are pleased to support the open source community by making
 * Hippy Exposure available.
 *
 * Copyright (c) 2015-present 马上消费金融股份有限公司, https://www.msxf.com/
 *
 * Licensed under the MIT LICENSE.
 */


import {
  ExposureLayout
} from './type';

// 是否相离
export const isRectDisjoint = (
  a: ExposureLayout, 
  b: ExposureLayout
) => {
  return (
    a.x > b.x + b.width ||
    a.x + a.width < b.x ||
    a.y > b.y + b.height ||
    a.y + a.height < b.y
  );
}

// a 和 b 是否相交，a 包含于 b，或者 b 包含于 a 都算
export const isRectIntersect = (
    a: ExposureLayout, 
    b: ExposureLayout
) => {
  // 相离取反即可
  return !isRectDisjoint(a, b);
}

// a 是否包含于 b
export const isRectContained = (
  a: ExposureLayout, 
  b: ExposureLayout
) => {

  return (
    a.x >= b.x &&
    a.y >= b.y &&
    a.x + a.width <= b.x + b.width &&
    a.y + a.height <= b.y + b.height
  );
};

/*
 * a 和 b 相交部分的 Rect
 */
const getIntersectionRect = (
  a: ExposureLayout, 
  b: ExposureLayout
): ExposureLayout | null => {

  if (isRectIntersect(a, b) === false) return null;

  const left = Math.max(a.x, b.x)
  const top = Math.max(a.y, b.y)
  const right = Math.min(a.x + a.width, b.x + b.width)
  const bottom = Math.min(a.y + a.height, b.y + b.height)

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  }
}

/*
 * a 和 b 相交部分在 a 的占比
 */
export const getIntersectionAreaRatio = (
  a: ExposureLayout, 
  b: ExposureLayout
): number => {
  const inter = getIntersectionRect(a, b);
  if (!inter) return 0;
  const interArea = inter.width * inter.height;
  const aArea = a.width * a.height;
  if (aArea <= 0) return 0;
  // 保留两位小数
  const ratio = Math.round((interArea / aArea) * 100) / 100
  return ratio;
}