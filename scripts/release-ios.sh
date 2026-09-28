#!/bin/bash
# Build WordCross for iOS on a Mac and upload it to App Store Connect (TestFlight).
# Needs: Xcode, Node.js, CocoaPods, and an App Store Connect API key (.p8).
#
#   export ASC_KEY_ID=XXXXXXXXXX           # App Store Connect → Users and Access → Integrations → API key ID
#   export ASC_ISSUER_ID=xxxxxxxx-xxxx-...  # shown on the same page
#   export ASC_KEY_PATH=~/Downloads/AuthKey_XXXXXXXXXX.p8
#   export APPLE_TEAM_ID=XXXXXXXXXX        # developer.apple.com → Membership
#   ./scripts/release-ios.sh
set -euo pipefail
cd "$(dirname "$0")/.."

for v in ASC_KEY_ID ASC_ISSUER_ID ASC_KEY_PATH APPLE_TEAM_ID; do
  [ -n "${!v:-}" ] || { echo "Set $v first (see the top of this script)."; exit 1; }
done
command -v xcodebuild >/dev/null || { echo "Install Xcode from the App Store first."; exit 1; }
command -v pod >/dev/null || { echo "Installing CocoaPods…"; sudo gem install cocoapods; }

# altool looks for the key in ~/.appstoreconnect/private_keys.
mkdir -p ~/.appstoreconnect/private_keys
cp "$ASC_KEY_PATH" ~/.appstoreconnect/private_keys/AuthKey_${ASC_KEY_ID}.p8

echo "› Installing packages"
npm install
echo "› Generating the native iOS project"
npx expo prebuild --platform ios --clean

BUILD=$(date +%Y%m%d%H%M)   # always-increasing build number
WS=$(ls -d ios/*.xcworkspace | head -1)
SCHEME=$(basename "$WS" .xcworkspace)
ARCHIVE=build/WordCross.xcarchive
mkdir -p build

cat > build/ExportOptions.plist <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>method</key><string>app-store-connect</string>
  <key>teamID</key><string>${APPLE_TEAM_ID}</string>
  <key>signingStyle</key><string>automatic</string>
  <key>uploadSymbols</key><true/>
  <key>destination</key><string>export</string>
</dict></plist>
PLIST

AUTH=(-allowProvisioningUpdates -authenticationKeyPath "$ASC_KEY_PATH" -authenticationKeyID "$ASC_KEY_ID" -authenticationKeyIssuerID "$ASC_ISSUER_ID")

echo "› Archiving (build $BUILD)"
xcodebuild -workspace "$WS" -scheme "$SCHEME" -configuration Release -destination 'generic/platform=iOS' \
  -archivePath "$ARCHIVE" DEVELOPMENT_TEAM="$APPLE_TEAM_ID" CURRENT_PROJECT_VERSION="$BUILD" \
  CODE_SIGN_STYLE=Automatic "${AUTH[@]}" archive | xcpretty 2>/dev/null || true
[ -d "$ARCHIVE" ] || { echo "Archive failed. Re-run without '| xcpretty' to see the full log."; exit 1; }

echo "› Exporting the IPA"
xcodebuild -exportArchive -archivePath "$ARCHIVE" -exportPath build -exportOptionsPlist build/ExportOptions.plist "${AUTH[@]}"
IPA=$(ls build/*.ipa | head -1)
echo "  $IPA"

echo "› Uploading to App Store Connect"
xcrun altool --upload-app -f "$IPA" -t ios --apiKey "$ASC_KEY_ID" --apiIssuer "$ASC_ISSUER_ID"
echo "✓ Uploaded. It appears in App Store Connect → TestFlight in about 15 minutes."
