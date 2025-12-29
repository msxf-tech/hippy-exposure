/*
 * We are pleased to support the open source community by making
 * Hippy Exposure available.
 *
 * Copyright (c) 2015-present 马上消费金融股份有限公司, https://www.msxf.com/
 *
 * Licensed under the MIT LICENSE.
 */


import { ExposureElement } from './type';
import { HippyLayoutEvent, ViewPagerEvent } from "@hippy/vue-next";
import { readyUpdateOnLayout, readyMeasureOnAttached } from './ready';
import { debugLogElementWhenGCInTaskQueue } from './debug';
import { postToMeasureSwiper } from './measure';

export type Task = () => Promise<void>;

export type PreCheck = () => Promise<boolean>;

export type TaskPhrase = 
  | 'layout'
  | 'attached'

interface PhraseElement {
  element: ExposureElement,
  phrase: TaskPhrase,
  layoutEvent: HippyLayoutEvent | null,
}

interface SwiperElementWrapper {
  swiper: ExposureElement,
  vpEvent: ViewPagerEvent
}

class TaskQueue {
  private tasks: Task[] = [];
  private _running = false;
  private _isReady: boolean = false;
  private _preCheck?: PreCheck;
  private _backlog: PhraseElement[] = [];
  private _swiperElements: SwiperElementWrapper[] = [];

  run() {
    this._isReady = true;
    this.runBacklog();
    // if (this._running) return;
    // if (this._preCheck) {
    //   console.log('pvpvpvpv--task--run');
    //   this._preCheck().then((res: boolean) => {
    //     this.runNext();
    //   });
    // } else {
    //   this.runNext();
    // }
  }

  isReady() {
    return this._isReady;
  }

  setPreCheck(pc: PreCheck) {
    this._preCheck = pc;
  }

  add(task: Task) {
    this.tasks.push(task);
    if (!this._isReady) return;
    if (this._running) return;
    this.runNext();
  }

  addBacklog(
    forPhrase: TaskPhrase, 
    element: ExposureElement, 
    layoutEvent: HippyLayoutEvent | null = null) {
    const pe: PhraseElement = {
      element: element,
      phrase: forPhrase,
      layoutEvent: layoutEvent
    }
    this._backlog.push(pe);
  }

  private runBacklog() {
    const pe: PhraseElement | undefined = this._backlog.shift();
    if (!pe) {
      this._running = false;
      return;
    }
    this._running = true;

    const ph = pe.phrase;
    const element = pe.element;

    // 如果已经 GC 了，无需再次计算
    if (element.hadRemove === false) {
      debugLogElementWhenGCInTaskQueue(element.el);

      // console.log(
      //   '[TaskQueue.backlog]', !!pe, 
      //   '剩余:', this._backlog.length, 
      //   '; eld:', element.el.nodeId,
      //   '; ele:', element
      // );

      if (ph === 'layout') {
        const layoutEvent = pe.layoutEvent;
        if (layoutEvent) readyUpdateOnLayout(element, layoutEvent);
      } else if (ph == 'attached') {
        readyMeasureOnAttached(element);
      }
    }
    this.runBacklog();
  }

  addSwiperBacklog(
    swiper: ExposureElement,
    vpEvent: ViewPagerEvent,
  ) {
    if (swiper && vpEvent) {
      const ele: SwiperElementWrapper = {
        swiper,
        vpEvent
      }
      this._swiperElements.push(ele);
    }
  }

  runSwiper(swiper: ExposureElement) {
    const target = this._swiperElements.find((item) => item.swiper.el.nodeId === swiper.el.nodeId);
    if (target) {
      postToMeasureSwiper(swiper, target.vpEvent);
      const index = this._swiperElements.indexOf(target);
      if (index !== -1) this._swiperElements.splice(index, 1);
    }
  }

  private async runNext() {
    
    const task = this.tasks.shift();
    
    if (!task) {
      this._running = false;
      return;
    }

    this._running = true;
    try {
      await task();
    } catch (_) {
      // console.log("Task failed:", e);
    } finally {
      this.runNext(); // 继续下一个
    }
  }
}

// 全局队列
const taskQueue = new TaskQueue();

export default taskQueue;