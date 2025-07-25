// Copyright (c) 2025 The Brave Authors. All rights reserved.
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this file,
// You can obtain one at https://mozilla.org/MPL/2.0/.

#ifndef BRAVE_BROWSER_EXTENSIONS_MANIFEST_V2_BRAVE_EXTENSIONS_MANIFEST_V2_INSTALLER_H_
#define BRAVE_BROWSER_EXTENSIONS_MANIFEST_V2_BRAVE_EXTENSIONS_MANIFEST_V2_INSTALLER_H_

#include <memory>
#include <string>

#include "base/memory/scoped_refptr.h"
#include "base/memory/weak_ptr.h"
#include "chrome/browser/extensions/webstore_install_with_prompt.h"

namespace extensions {
class CrxInstaller;
}  // namespace extensions

namespace content {
class WebContents;
}

namespace network {
class SharedURLLoaderFactory;
class SimpleURLLoader;
}  // namespace network

namespace extensions_mv2 {

class ExtensionManifestV2Installer {
 public:
  ExtensionManifestV2Installer(
      const extensions::ExtensionId& extension_id,
      content::WebContents* web_contents,
      scoped_refptr<network::SharedURLLoaderFactory> url_loader_factory,
      extensions::WebstoreInstallWithPrompt::Callback callback);
  ~ExtensionManifestV2Installer();

  void BeginInstall();

 private:
  void OnUpdateManifestResponse(std::optional<std::string> body);
  void DownloadCrx(const GURL& url);
  void OnCrxDownloaded(base::FilePath path);
  void OnInstalled(const std::optional<extensions::CrxInstallError>& error);

  const extensions::ExtensionId extension_id_;
  base::WeakPtr<content::WebContents> web_contents_;
  scoped_refptr<network::SharedURLLoaderFactory> url_loader_factory_;
  extensions::WebstoreInstallWithPrompt::Callback callback_;

  std::unique_ptr<network::SimpleURLLoader> url_loader_;
  scoped_refptr<extensions::CrxInstaller> crx_installer_;
  base::WeakPtrFactory<ExtensionManifestV2Installer> weak_factory_{this};
};

}  // namespace extensions_mv2

#endif  // BRAVE_BROWSER_EXTENSIONS_MANIFEST_V2_BRAVE_EXTENSIONS_MANIFEST_V2_INSTALLER_H_
