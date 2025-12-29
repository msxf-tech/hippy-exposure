/*
 * We are pleased to support the open source community by making
 * Hippy Exposure available.
 *
 * Copyright (c) 2015-present 马上消费金融股份有限公司, https://www.msxf.com/
 *
 * Licensed under the MIT LICENSE.
 */


import { ExposureElement, ExposureLayout } from "./type"
import { classListInfo, layoutToString } from './utils';
import { Native } from '@hippy/vue-next';

const cacheMap = new Map<number, {
  rect?: ExposureLayout,
  pending?: Promise<ExposureLayout>;
}>();

export const getRectInWindowWithPolyfill = async (
  element: ExposureElement
) :Promise<ExposureLayout> => {
  if (element.rectInWindow) return element.rectInWindow;
  
  const nid = element.el.nodeId;
  const entry = cacheMap.get(nid);
  if (entry?.rect) {
    return entry.rect;
  }
  if (entry?.pending) {
    return await entry.pending;
  }
    
  const pending = (async() => {
    const rect = await Native.getBoundingClientRect(element.el, { relToContainer: true });
    const rectInWindow: ExposureLayout = {
      x: rect.x ?? 0,
      y: rect.y ?? 0,
      width: rect.width ?? 0,
      height: rect.height ?? 0,
    }

    cacheMap.set(nid, { rect: rectInWindow });

    return rectInWindow;
  })();

  cacheMap.set(nid, { pending });

  return await pending;
  
}