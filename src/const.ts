/*
 * We are pleased to support the open source community by making
 * Hippy Exposure available.
 *
 * Copyright (c) 2015-present 马上消费金融股份有限公司, https://www.msxf.com/
 *
 * Licensed under the MIT LICENSE.
 */

export const swiperTag = 'hi-swiper';
export const swiperSlideTag = 'hi-swiper-slide';
export const hiPullHeaderTag = 'hi-pull-header'; // 下拉刷新组件

export const element_phrase = ' [ RecElement ] ';
export const layout_phrase = ' [ OnLayout ] ';
export const attach_phrase = ' [ OnAttach ] ';
export const measure_phrase = ' [ Measure ] ';
export const visible_phrase = ' [ Visible ] ';

export const ELEMENT_TYPE = [
  `%c${element_phrase}%c`, 
  'color:rgb(234, 246, 126); font-weight: bold', 
  'color: auto; font-weight: auto'
];

export const LAYOUT_TYPE = [
  `%c${layout_phrase}%c`, 
  'color: #4fc08d; font-weight: bold', 
  'color: auto; font-weight: auto'
];

export const ATTACH_TYPE = [
  `%c${attach_phrase}%c`, 
  'color:rgb(240, 73, 27); font-weight: bold', 
  'color: auto; font-weight: auto'
];

export const MEASURE_TYPE = [
  `%c${measure_phrase}%c`, 
  'color:rgb(46, 76, 244); font-weight: bold', 
  'color: auto; font-weight: auto'
];

export const VISIBLE_TYPE = [
  `%c${visible_phrase}%c`, 
  'color:rgb(23, 233, 93); font-weight: bold', 
  'color: auto; font-weight: auto'
];

export const logTypeRecord = {
  [element_phrase]: ELEMENT_TYPE,
  [layout_phrase]: LAYOUT_TYPE,
  [attach_phrase]: ATTACH_TYPE,
  [measure_phrase]: MEASURE_TYPE,
  [visible_phrase]: VISIBLE_TYPE
}