/*
 * We are pleased to support the open source community by making
 * Hippy Exposure available.
 *
 * Copyright (c) 2015-present 马上消费金融股份有限公司, https://www.msxf.com/
 *
 * Licensed under the MIT LICENSE.
 */

import { getElementMap } from './collect';
import { ExposureElement } from './type';
import { isHippyElement } from './utils';
import { HippyElement } from '@hippy/vue-next';
import { debugLogElementWhenGC } from './debug'

let idleScheduled = false;
let cooldown = false;

export const scheduleIdleCleanup = (
    timeout: number = 50, 
    cooldownMs: number = 300
) => {
  if (idleScheduled || cooldown) return;

  idleScheduled = true;

  requestIdleCallback(
    (deadline) => {
      try {
        if (deadline.timeRemaining() > 0 || deadline.didTimeout) {
          recursivelyCleanup();
        }
      } finally {
        idleScheduled = false;
        cooldown = true;
        setTimeout(() => (cooldown = false), cooldownMs);
      }
    },
    { timeout }
  );
}

const recursivelyCleanup = () => {
  // console.log('gc::::====>');
  const elementMap: Map<number, ExposureElement> = getElementMap();
  if (!elementMap) return;

  const visited = new Set<number>();

  const recursivelyRemove = (node: HippyElement) => {
    const expEl = elementMap.get(node.nodeId);
    if (!expEl) return;
    if (visited.has(node.nodeId)) return;

    visited.add(node.nodeId);

    // 先递归清理子节点
    node.childNodes?.forEach((child) => {
      if (isHippyElement(child)) recursivelyRemove(child as HippyElement);
    });

    // 然后删除自己
    elementMap.delete(node.nodeId);
    // console.log('gcgcgc::', node.nodeId);
    // 标识为已经移除，taskQueue 再遍历的时候，可以直接忽略
    expEl.hadRemove = true;

    debugLogElementWhenGC(expEl.el);
  }

  elementMap.forEach((expEl) => {
    const el = expEl.el;

    // 已经访问过的不再处理
    if (visited.has(el.nodeId)) return;

    const parent = el.parentNode;

    if (!parent && !el.isRootNode()) {
      // parent 不存在且不是 root → 清理自己和子节点
      recursivelyRemove(el);
    } else if (parent && !parent.childNodes.includes(el)) {
      // parent 存在，但 childNodes 不包含自己 → 清理
      recursivelyRemove(el);
    }
  });
}