// Copyright (c) 2025 The Brave Authors. All rights reserved.
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this file,
// You can obtain one at https://mozilla.org/MPL/2.0/.

#ifndef BRAVE_IOS_BROWSER_UI_COMMERCE_FEATURES_H_
#define BRAVE_IOS_BROWSER_UI_COMMERCE_FEATURES_H_

#import "base/feature_list.h"

namespace brave::features {

// Whether or not to allow Brave to present external purchase links for Brave
// Premium products on iOS paywalls.
BASE_DECLARE_FEATURE(kBraveAllowExternalPurchaseLinks);

}  // namespace brave::features

#endif  // BRAVE_IOS_BROWSER_UI_COMMERCE_FEATURES_H_
