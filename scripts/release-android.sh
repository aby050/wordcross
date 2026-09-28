#!/bin/bash
# Build a signed Android App Bundle (.aab) for Google Play on a Mac.
# Needs: Node.js, JDK 17 (brew install --cask zulu@17), Android SDK (Android Studio).
# First run creates your upload key in ./keys. BACK IT UP and never commit it.
#   ./scripts/release-android.sh
set -euo pipefail
cd "$(dirname "$0")/.."

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
[ -d "$ANDROID_HOME" ] || { echo "Install Android Studio (it installs the SDK at $ANDROID_HOME)."; exit 1; }

mkdir -p keys
KS=keys/wordcross-upload.jks
PROPS=keys/keystore.properties
if [ ! -f "$KS" ]; then
  echo "› Creating your upload key (one time)"
  read -r -s -p "Choose a keystore password (min 6 chars): " PW; echo
  keytool -genkeypair -v -keystore "$KS" -alias wordcross -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass "$PW" -keypass "$PW" -dname "CN=RV Studio, O=RV Studio, C=IN"
  printf 'storeFile=%s\nstorePassword=%s\nkeyAlias=wordcross\nkeyPassword=%s\n' "$(pwd)/$KS" "$PW" "$PW" > "$PROPS"
  echo "  Saved $KS. Back up the keys/ folder somewhere safe NOW."
fi

echo "› Installing packages"
npm install
echo "› Generating the native Android project"
npx expo prebuild --platform android --clean

# Wire the upload key into the release build.
GRADLE=android/app/build.gradle
if ! grep -q "wordcrossUpload" "$GRADLE"; then
  python3 - "$GRADLE" "$(pwd)/$PROPS" <<'PY'
import sys, re
path, props = sys.argv[1], sys.argv[2]
s = open(path).read()
s = s.replace("android {", f"""def wcProps = new Properties()
wcProps.load(new FileInputStream(file("{props}")))

android {{""", 1)
s = s.replace("signingConfigs {", """signingConfigs {
        wordcrossUpload {
            storeFile file(wcProps['storeFile'])
            storePassword wcProps['storePassword']
            keyAlias wcProps['keyAlias']
            keyPassword wcProps['keyPassword']
        }""", 1)
s = re.sub(r"(release\s*\{[^}]*?)signingConfig signingConfigs\.debug", r"\1signingConfig signingConfigs.wordcrossUpload", s, count=1, flags=re.S)
open(path, "w").write(s)
PY
fi

CODE=$(( $(date +%s) / 60 ))   # always-increasing versionCode
sed -i '' "s/versionCode [0-9][0-9]*/versionCode $CODE/" "$GRADLE"
echo "› Building the release bundle (versionCode $CODE)"
(cd android && ./gradlew bundleRelease --no-daemon)

mkdir -p build
cp android/app/build/outputs/bundle/release/app-release.aab build/WordCross.aab
echo "✓ build/WordCross.aab is ready."
echo "  Upload it in Play Console → your app → Testing → Internal testing → Create release."
