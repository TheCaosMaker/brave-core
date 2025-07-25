/* Copyright (c) 2020 The Brave Authors. All rights reserved.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you can obtain one at http://mozilla.org/MPL/2.0/. */

#ifndef BRAVE_CHROMIUM_SRC_COMPONENTS_COMPONENT_UPDATER_COMPONENT_INSTALLER_H_
#define BRAVE_CHROMIUM_SRC_COMPONENTS_COMPONENT_UPDATER_COMPONENT_INSTALLER_H_

#include "components/update_client/update_client.h"

// We can't redefine Register() here because that would change two methods at
// the same time. Instead, we leverage OnUpdateError() void method to inject
// the declarations of Register_ChromiumImpl that are defined in the override
// for component_installer.cc, so that we can still compile and link.
#define OnUpdateError                                                        \
  Register_ChromiumImpl(ComponentUpdateService* cus,                         \
                        base::OnceClosure callback);                         \
  void Register_ChromiumImpl(                                                \
      RegisterCallback register_callback, base::OnceClosure callback,        \
      const base::Version& registered_version = base::Version(kNullVersion), \
      const base::Version& max_previous_product_version =                    \
          base::Version(kNullVersion));                                      \
  bool IsBraveComponent() const override;                                    \
  void OnUpdateError

#define AllowUpdatesOnMeteredConnections \
  IsBraveComponent() const;              \
  virtual bool AllowUpdatesOnMeteredConnections

#include <components/component_updater/component_installer.h>  // IWYU pragma: export

#undef OnUpdateError
#undef AllowUpdatesOnMeteredConnections

#endif  // BRAVE_CHROMIUM_SRC_COMPONENTS_COMPONENT_UPDATER_COMPONENT_INSTALLER_H_
