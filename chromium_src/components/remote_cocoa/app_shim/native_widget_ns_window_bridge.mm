/* Copyright (c) 2022 The Brave Authors. All rights reserved.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

#include "base/check.h"
#include "base/logging.h"
#include "skia/ext/skia_utils_mac.h"

#include <components/remote_cocoa/app_shim/native_widget_ns_window_bridge.mm>

namespace {
NSColor* g_brave_title_color = nil;
}  // namespace

@interface NSThemeFrame (BraveTheme)
- (NSColor*)_currentTitleColor;  // Forward declaration of method
@end

@interface BrowserWindowFrame : NativeWidgetMacNSWindowTitledFrame
@end

// Custom implementation for BrowserWindowFrame only
@implementation BrowserWindowFrame (BraveTheme)

// Override currentTitleColor to return our own.
- (NSColor*)_currentTitleColor {
  return g_brave_title_color;
}

@end
namespace remote_cocoa {

void NativeWidgetNSWindowBridge::SetWindowTitleVisibility(bool visible) {
  NSUInteger styleMask = [window_ styleMask];
  if (visible)
    styleMask |= NSWindowStyleMaskTitled;
  else
    styleMask &= ~NSWindowStyleMaskTitled;

  [window_ setStyleMask:styleMask];

  ResetWindowControlsPosition();

  // Sometimes title is not visible until window is resized. In order to avoid
  // this, reset title to force it to be visible.
  if (visible) {
    NSString* title = window_.title;
    window_.title = @"";
    window_.title = title;
  }
}

void NativeWidgetNSWindowBridge::ResetWindowControlsPosition() {
  // Call undocumented method of NSThemeFrame in order to reset window controls'
  // position.
  //
  // As for undocumented APIs, they're found by dumping Appkit classes with
  // `class-dump` script.
  // https://chromium.googlesource.com/external/github.com/nygard/class-dump/
  //
  //  There are a few sources to find dumpled headers:
  // [1] Qt:
  // https://github.com/qt/qt/blob/0a2f2382541424726168804be2c90b91381608c6/src/gui/kernel/qnsthemeframe_mac_p.h#L121
  // [2] macos_headers:
  // https://github.com/w0lfschild/macOS_headers/blob/a5c2da62810189aa7ea71e6a3e1c98d98bb6620e/macOS/Frameworks/AppKit/1348.17/NSThemeFrame.h#L393
  //
  // If this behavior is broken, we should run `class-dump` by ourselves and
  // find out what can be used instead of this.
  NSView* frameView = window_.contentView.superview;
  DCHECK([frameView isKindOfClass:[NSThemeFrame class]]);
  if ([frameView respondsToSelector:@selector(_resetTitleBarButtons)]) {
    [frameView performSelector:@selector(_resetTitleBarButtons)];
  } else {
    LOG(ERROR) << "Failed to find selector for resetting window controls";
  }
}

void NativeWidgetNSWindowBridge::UpdateWindowTitleColor(SkColor color) {
  NSView* frameView = window_.contentView.superview;
  if (![frameView isKindOfClass:[BrowserWindowFrame class]]) {
    return;
  }

  if (![frameView respondsToSelector:@selector(_currentTitleColor)]) {
    return;
  }

  g_brave_title_color = skia::SkColorToDeviceNSColor(color);

  // Reset title to apply new title color.
  NSString* title = window_.title;
  window_.title = @"";
  window_.title = title;
}

}  // namespace remote_cocoa
