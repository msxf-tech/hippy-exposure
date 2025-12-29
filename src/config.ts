/*
 * We are pleased to support the open source community by making
 * Hippy Exposure available.
 *
 * Copyright (c) 2015-present 马上消费金融股份有限公司, https://www.msxf.com/
 *
 * Licensed under the MIT LICENSE.
 */

import { 
    ExposureConfig,
} from './type';
import {
  setVisibleCallback,
  setInvisibleCallback
} from './visible';

let _isDebug: boolean = true;

export const setExposureOptions = (options: ExposureConfig) => {
  const {
    isDebug = false,
    onVisible,
    onInvisible,
    checkRatio = true,
  } = options;

  setVisibleCallback(onVisible);
  setInvisibleCallback(onInvisible);
  _isDebug = isDebug;
}

export const getIsDebug = () => {
  return _isDebug;
}