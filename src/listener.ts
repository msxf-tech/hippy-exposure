/*
 * We are pleased to support the open source community by making
 * Hippy Exposure available.
 *
 * Copyright (c) 2015-present 马上消费金融股份有限公司, https://www.msxf.com/
 *
 * Licensed under the MIT LICENSE.
 */

import { 
  HippyElement,
  HippyEvent,
  HippyLayoutEvent,
  ViewPagerEvent,
} from "@hippy/vue-next"

import { 
  ListenedEventName,
  ExposureElement
} from './type';

import { 
  getElement, 
  isScrollViewElement,
  isSwiperScroll,
} from './utils';
import {
  onLayout,
  onAttachedToWindow,
  onDetachedFromWindow,
  onAppear,
  onDisappear,
  onWillAppear,
  onWillDisappear,
  onScrollViewScroll,
  onListViewScroll,
  onMomentumScrollBegin,
  onMomentumScrollEnd,
  onScrollBeginDrag,
  onScrollEndDrag,
  onListMomentumScrollBegin,
  onListMomentumScrollEnd,
  onListScrollBeginDrag,
  onListScrollEndDrag,
  onPageSelected,
} from './on';

export const addListener = (el: HippyElement, style) => {

  const layout = ListenedEventName.layout;
  onceListenerAdd(el, layout, (element: ExposureElement) => {
    element.el.addEventListener(layout, (layoutEvent: HippyLayoutEvent) => {
      onLayout(element, layoutEvent);
    });
  });

  const attachedToWindow = ListenedEventName.attachedToWindow;
  onceListenerAdd(el, attachedToWindow, (element: ExposureElement) => {
    element.el.addEventListener(attachedToWindow, (event: HippyEvent) => {
      onAttachedToWindow(element, event);
    });
  });

  const detachedFromWindow = ListenedEventName.detachedFromWindow;
  onceListenerAdd(el, detachedFromWindow, (element: ExposureElement) => {
    element.el.addEventListener(detachedFromWindow, (event: HippyEvent) => {
      onDetachedFromWindow(element, event);
    });
  });

  if (el.tagName === 'li') {
    const appear = ListenedEventName.appear;
    onceListenerAdd(el, appear, (element: ExposureElement) => {
      element.el.addEventListener(appear, (event: HippyEvent) => {
        onAppear(element, event);
      });
    });

    const disAppear = ListenedEventName.disAppear;
    onceListenerAdd(el, disAppear, (element: ExposureElement) => {
      element.el.addEventListener(disAppear, (event: HippyEvent) => {
        onDisappear(element, event);
      });
    });

    const willAppear = ListenedEventName.willAppear;
    onceListenerAdd(el, willAppear, (element: ExposureElement) => {
      element.el.addEventListener(willAppear, (event: HippyEvent) => {
        onWillAppear(element, event);
      });
    });

    const willDisappear = ListenedEventName.willDisappear;
    onceListenerAdd(el, willDisappear, (element: ExposureElement) => {
      element.el.addEventListener(willDisappear, (event: HippyEvent) => {
        onWillDisappear(element, event);
      });
    });
  }

  const isSwiper = isSwiperScroll(el, style);
  if (isSwiper) {
    const pageSelected = ListenedEventName.pageSelected;
    // onPageSelected
    onceListenerAdd(el, pageSelected, (element: ExposureElement) => {
      element.el.addEventListener(pageSelected, (event: ViewPagerEvent) => {
        onPageSelected(element, event);
      });
    });
    return;
  }

  const isList = el.tagName === 'ul';
  const isScroll = isScrollViewElement(el, style); // (style.overflowY === 'scroll' || style.overflowX === 'scroll');
  
  if (isList || isScroll) {
    const scroll = ListenedEventName.scroll;
    onceListenerAdd(el, scroll, (element: ExposureElement) => {
      element.el.addEventListener(scroll, (event: HippyEvent) => {
        if (isList) {
          onListViewScroll(element, event);
        } else {
          onScrollViewScroll(element, event);
        }
      });
    });

    const momentumScrollBegin = ListenedEventName.momentumScrollBegin;
    onceListenerAdd(el, momentumScrollBegin, (element: ExposureElement) => {
      element.el.addEventListener(momentumScrollBegin, (event: HippyEvent) => {
        if (isList) {
          onListMomentumScrollBegin(element, event);
        } else {
          onMomentumScrollBegin(element, event);
        }
      });
    });

    const momentumScrollEnd = ListenedEventName.momentumScrollEnd;
    onceListenerAdd(el, momentumScrollEnd, (element: ExposureElement) => {
      element.el.addEventListener(momentumScrollEnd, (event: HippyEvent) => {
        if (isList) {
          onListMomentumScrollEnd(element, event);
        } else {
          onMomentumScrollEnd(element, event);
        }
      });
    });

    const scrollBeginDrag = ListenedEventName.scrollBeginDrag;
    onceListenerAdd(el, scrollBeginDrag, (element: ExposureElement) => {
      element.el.addEventListener(scrollBeginDrag, (event: HippyEvent) => {
        if (isList) {
          onListScrollBeginDrag(element, event);
        } else {
          onScrollBeginDrag(element, event);
        }
      });
    });

    const scrollEndDrag = ListenedEventName.scrollEndDrag;
    onceListenerAdd(el, scrollEndDrag, (element: ExposureElement) => {
      element.el.addEventListener(scrollEndDrag, (event: HippyEvent) => {
        if (isList) {
          onListScrollEndDrag(element, event);
        } else {
          onScrollEndDrag(element, event);
        }
      });
    });
  }
}

const onceListenerAdd = (
  el: HippyElement, 
  evnentName: ListenedEventName,
  block: (element: ExposureElement, eventName: ListenedEventName) => void,
) : void => {

  if (!block) return;

  const nodeId = el.nodeId;
  const exposureElement: ExposureElement | undefined = getElement(nodeId);

  if (!exposureElement) {
    // console.log(`ExposureElement should be record before add Listener`);
    return;
  }
  
  switch (evnentName) {
    case ListenedEventName.layout: {
      if(exposureElement.hadAddLayout === false) {
        block(exposureElement, evnentName);
        exposureElement.hadAddLayout = true;
      }
      break;
    }
    case ListenedEventName.appear: {
      if(exposureElement.hadAddAppear === false) {
        block(exposureElement, evnentName);
        exposureElement.hadAddAppear = true;
      }
      break;
    }
    case ListenedEventName.disAppear: {
      if(exposureElement.hadAddDisappear === false) {
        block(exposureElement, evnentName);
        exposureElement.hadAddDisappear = true;
      }
      break;
    }
    case ListenedEventName.willAppear: {
      if(exposureElement.hadAddWillAppear === false) {
        block(exposureElement, evnentName);
        exposureElement.hadAddWillAppear = true;
      }
      break;
    }
    case ListenedEventName.willDisappear: {
      if(exposureElement.hadAddWillDisappear === false) {
        block(exposureElement, evnentName);
        exposureElement.hadAddWillDisappear = true;
      }
      break;
    }
    case ListenedEventName.attachedToWindow: {
      if(exposureElement.hadAddAttached === false) {
        block(exposureElement, evnentName);
        exposureElement.hadAddAttached = true;
      }
      break;
    }
    case ListenedEventName.detachedFromWindow: {
      if(exposureElement.hadAddDetached === false) {
        block(exposureElement, evnentName);
        exposureElement.hadAddDetached = true;
      }
      break;
    }
    case ListenedEventName.scroll: {
      if(exposureElement.hadAddScroll === false) {
        block(exposureElement, evnentName);
        exposureElement.hadAddScroll = true;
      }
      break;
    }

    case ListenedEventName.pageSelected: {
      if(exposureElement.hadAddPageSelected === false) {
        block(exposureElement, evnentName);
        exposureElement.hadAddPageSelected = true;
      }
      break;
    }

    case ListenedEventName.momentumScrollBegin: {
      if(exposureElement.hadAddMomentumScrollBegin === false) {
        block(exposureElement, evnentName);
        exposureElement.hadAddMomentumScrollBegin = true;
      }
      break;
    }

    case ListenedEventName.momentumScrollEnd: {
      if(exposureElement.hadAddMomentumScrollEnd === false) {
        block(exposureElement, evnentName);
        exposureElement.hadAddMomentumScrollEnd = true;
      }
      break;
    }

    case ListenedEventName.scrollBeginDrag: {
      if(exposureElement.hadAddScrollBeginDrag === false) {
        block(exposureElement, evnentName);
        exposureElement.hadAddScrollBeginDrag = true;
      }
      break;
    }

    case ListenedEventName.scrollEndDrag: {
      if(exposureElement.hadAddScrollEndDrag === false) {
        block(exposureElement, evnentName);
        exposureElement.hadAddScrollEndDrag = true;
      }
      break;
    }
  }
}