/*
 * We are pleased to support the open source community by making
 * Hippy Exposure available.
 *
 * Copyright (c) 2015-present 马上消费金融股份有限公司, https://www.msxf.com/
 *
 * Licensed under the MIT LICENSE.
 */

import { HippyElement } from '@hippy/vue-next';
import taskQueue from './task';
import { ExposurePluginParam, Size } from './type';
import { _setRootId, _setRootSize, _getRootSize } from './collect';
import { setCustomScrollComponents } from './utils';
import { 
  _setInvalid,
  _trigger,
  _createExposurePlugin,
  _forceExposureForAllElement,
  _forceExposureForElement,
  _setPageShowStatus,
  _getPageShowStatus,
  _queryElementVisible,
  ExposurePluginFunction,
} from './plugin';

export interface ExposureInstance {
  // registRoot: (rootId: string) => void;
  // setRootSize: (size: Size) => void;
  createExposurePlugin: (rootId: string, options?: ExposurePluginParam) => ExposurePluginFunction;
  setPageShowStatus: (isShow: boolean) => void;
  start: (rootSize: Size) => void;
  isReady: () => boolean;
  setInvalid: (el: HippyElement, needDeepTraverse?: boolean) => void;
  trigger: (el: HippyElement, needDeepTraverse?: boolean) => void;
  forceExposureForAllElement: (checkEnable?: boolean) => void;
  forceExposureForElement: (el: HippyElement, checkEnable: boolean) => void;
  registCustomScrollComponents: (tags: string[]) => void;
  queryElementVisible: (el: HippyElement) => boolean;
}

class Exposure implements ExposureInstance {

  createExposurePlugin(
    rootId: string,
    options: ExposurePluginParam = {}
  ): ExposurePluginFunction {
    _setRootId(rootId);
    return _createExposurePlugin(options);
  }

  start(rootSize: Size) {
    
    if (this.isReady()) return;
    // rootSize 是必须的参数，需要强制 start 函数注入。
    _setRootSize(rootSize);
    taskQueue.run();
  }

  isReady() {
    return taskQueue.isReady();
  }

  setInvalid(
    el: HippyElement, 
    needDeepTraverse: boolean = false
  ) {
    _setInvalid(el, needDeepTraverse);
  }

  setPageShowStatus(isShow: boolean) {
    _setPageShowStatus(isShow);
  }

  trigger(
    el: HippyElement, 
    needDeepTraverse: boolean = false
  ) {
    _trigger(el, needDeepTraverse);
  }

  // 对所有设置了 v-hippy-exposure 的元素强制检查曝光，不考虑是否曝光过
  forceExposureForAllElement(checkEnable: boolean = true) {
    const isPageShow = _getPageShowStatus();
    const ready = this.isReady();
    if (isPageShow && ready) {
      _forceExposureForAllElement(checkEnable);
    }
  }

  // 对特定的设置了 v-hippy-exposure 的元素强制检查曝光，不考虑是否曝光过
  forceExposureForElement(el: HippyElement, checkEnable: boolean = true) {
    const isPageShow = _getPageShowStatus();
    const ready = this.isReady();
    if (isPageShow && ready) {
      _forceExposureForElement(el.nodeId, checkEnable);
    }
  }

  registCustomScrollComponents(tags: string[]) {
    setCustomScrollComponents(tags);
  }

  queryElementVisible(el: HippyElement){
    return _queryElementVisible(el.nodeId);
  }

}

const exposure: ExposureInstance = new Exposure();

export default exposure;
export * from './plugin';
export * from './type';